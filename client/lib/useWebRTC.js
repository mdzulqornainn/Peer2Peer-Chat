'use client';

/**
 * useWebRTC — seluruh logika WebRTC + signaling ada di sini.
 *
 * Alur (2 peer per room):
 *   1. A connect ke Socket.IO -> emit 'join-room'. Room kosong -> A menunggu.
 *   2. B join -> server kirim 'peer-joined' ke A.
 *   3. A (peer lama) = OFFERER:
 *        createPeerConnection -> createDataChannel('chat') -> createOffer
 *        -> setLocalDescription -> emit 'offer' ke B
 *   4. B = ANSWERER: terima 'offer' -> setRemoteDescription -> createAnswer
 *        -> setLocalDescription -> emit 'answer' ke A
 *   5. Kedua sisi saling kirim 'ice-candidate' (trickle ICE) lewat server.
 *   6. DataChannel 'open' -> SEMUA chat lewat DataChannel (P2P).
 *      Server tidak pernah melihat isi pesan.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { xorEncrypt, xorDecrypt, bytesToBase64, base64ToBytes } from './xor';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function getSignalingUrl() {
  if (process.env.NEXT_PUBLIC_SIGNALING_URL) return process.env.NEXT_PUBLIC_SIGNALING_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}

function makeId() {
  const r = new Uint32Array(1);
  crypto.getRandomValues(r);
  return `${Date.now().toString(36)}-${r[0].toString(36)}`;
}

export function useWebRTC(roomId, username) {
  // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [signalingState, setSignalingState] = useState('connecting');
  // 'waiting' | RTCPeerConnectionState ('new','connecting','connected','disconnected','failed','closed') | 'room-full'
  const [peerState, setPeerState] = useState('waiting');
  const [iceState, setIceState] = useState('new');
  const [channelState, setChannelState] = useState('closed');
  const [peerName, setPeerName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const remoteIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    if (!roomId || !username) return undefined;

    let disposed = false;
    const signalingUrl = getSignalingUrl();
    const socket = io(signalingUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const addSystem = (text) => {
      if (disposed) return;
      setMessages((m) => [...m, { id: makeId(), type: 'system', text, ts: Date.now() }]);
    };

    // ---------- DataChannel ----------
    const setupChannel = (channel) => {
      channelRef.current = channel;
      setChannelState(channel.readyState);

      channel.onopen = () => {
        if (channelRef.current !== channel) return;
        setChannelState('open');
        addSystem('🔒 Data Channel terbuka — pesan sekarang dikirim langsung peer-to-peer.');
        channel.send(JSON.stringify({ type: 'hello', username }));
      };
      channel.onclose = () => {
        if (channelRef.current !== channel) return;
        setChannelState('closed');
      };
      channel.onerror = (e) => console.warn('[DataChannel] error', e);

      channel.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload.type === 'hello') {
          setPeerName(payload.username);
          return;
        }

        if (payload.type === 'chat') {
          const cipherBytes = base64ToBytes(payload.cipher);
          let plaintext;
          try {
            // DECRYPT lokal dengan key = Room ID
            plaintext = xorDecrypt(cipherBytes, roomId);
          } catch {
            plaintext = '[gagal didekripsi]';
          }
          setMessages((m) => [
            ...m,
            {
              id: payload.id,
              type: 'chat',
              direction: 'in',
              sender: payload.sender,
              plaintext,
              cipherBytes,
              ts: payload.ts,
            },
          ]);
        }
      };
    };

    // ---------- RTCPeerConnection ----------
    const closePeer = () => {
      const ch = channelRef.current;
      const pc = pcRef.current;
      channelRef.current = null;
      pcRef.current = null;
      remoteIdRef.current = null;
      pendingCandidatesRef.current = [];
      try { ch?.close(); } catch {}
      try { pc?.close(); } catch {}
      setChannelState('closed');
      setIceState('new');
    };

    const createPeer = (remoteId) => {
      closePeer();
      remoteIdRef.current = remoteId;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { to: remoteId, candidate: e.candidate.toJSON() });
      };
      pc.onconnectionstatechange = () => {
        if (pcRef.current !== pc) return;
        setPeerState(pc.connectionState);
        if (pc.connectionState === 'failed') {
          addSystem('❌ Koneksi P2P gagal (NAT/firewall?). Coba di jaringan yang sama atau tambahkan server TURN.');
        }
      };
      pc.oniceconnectionstatechange = () => {
        if (pcRef.current === pc) setIceState(pc.iceConnectionState);
      };
      pc.ondatachannel = (e) => setupChannel(e.channel);

      setPeerState('new');
      return pc;
    };

    const flushPendingCandidates = async (pc) => {
      const queued = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];
      for (const c of queued) {
        try { await pc.addIceCandidate(c); } catch (err) { console.warn('addIceCandidate (queued)', err); }
      }
    };

    // ---------- Socket.IO signaling events ----------
    socket.on('connect', () => {
      setSignalingState('connected');
      setError(null);
      socket.emit('join-room', { roomId, username });
    });

    socket.on('connect_error', () => {
      setSignalingState('error');
      setError(`Tidak bisa terhubung ke signaling server di ${signalingUrl}. Apakah server.js sudah dijalankan?`);
    });

    socket.on('disconnect', () => {
      // Catatan: kalau DataChannel sudah open, chat TETAP jalan walau signaling putus.
      setSignalingState('disconnected');
    });

    socket.on('join-error', ({ message }) => {
      setError(message);
    });

    socket.on('room-full', () => {
      setPeerState('room-full');
      setError('Room ini sudah berisi 2 orang. Gunakan Room ID lain.');
      socket.disconnect();
    });

    socket.on('room-joined', ({ peers }) => {
      if (peers.length === 0) {
        setPeerState('waiting');
        addSystem(`Kamu masuk ke room ${roomId}. Menunggu lawan bicara…`);
      } else {
        setPeerName(peers[0].username);
        setPeerState('new');
        addSystem(`Masuk ke room ${roomId}. ${peers[0].username} sudah di sini — menunggu offer darinya…`);
      }
    });

    // Peer baru masuk -> kita (peer lama) menjadi OFFERER
    socket.on('peer-joined', async ({ socketId, username: remoteName }) => {
      try {
        setPeerName(remoteName);
        addSystem(`${remoteName} bergabung. Membuat WebRTC offer…`);
        const pc = createPeer(socketId);
        setupChannel(pc.createDataChannel('chat', { ordered: true }));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to: socketId, sdp: pc.localDescription.toJSON() });
      } catch (err) {
        console.error(err);
        setError(`Gagal membuat offer: ${err.message}`);
      }
    });

    // Kita ANSWERER
    socket.on('offer', async ({ from, sdp, username: remoteName }) => {
      try {
        if (remoteName) setPeerName(remoteName);
        const pc = createPeer(from);
        await pc.setRemoteDescription(sdp);
        await flushPendingCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, sdp: pc.localDescription.toJSON() });
      } catch (err) {
        console.error(err);
        setError(`Gagal memproses offer: ${err.message}`);
      }
    });

    socket.on('answer', async ({ from, sdp }) => {
      const pc = pcRef.current;
      if (!pc || remoteIdRef.current !== from) return;
      try {
        await pc.setRemoteDescription(sdp);
        await flushPendingCandidates(pc);
      } catch (err) {
        console.error(err);
        setError(`Gagal menerapkan answer: ${err.message}`);
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = pcRef.current;
      if (!pc || remoteIdRef.current !== from || !candidate) return;
      // Candidate bisa datang sebelum remoteDescription di-set -> antrikan
      if (!pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('addIceCandidate', err);
      }
    });

    socket.on('peer-left', ({ socketId, username: remoteName }) => {
      if (remoteIdRef.current && remoteIdRef.current !== socketId) return;
      closePeer();
      setPeerName(null);
      setPeerState('waiting');
      addSystem(`${remoteName || 'Lawan bicara'} keluar dari room. Menunggu peserta baru…`);
    });

    return () => {
      disposed = true;
      socket.emit('leave-room');
      socket.removeAllListeners();
      socket.disconnect();
      closePeer();
      socketRef.current = null;
    };
  }, [roomId, username]);

  /** ENCRYPT lokal (XOR, key = Room ID) lalu kirim ciphertext via DataChannel. */
  const sendMessage = useCallback(
    (text) => {
      const channel = channelRef.current;
      if (!channel || channel.readyState !== 'open' || !text) return false;

      const cipherBytes = xorEncrypt(text, roomId);
      const payload = {
        type: 'chat',
        id: makeId(),
        sender: username,
        cipher: bytesToBase64(cipherBytes), // hanya ciphertext yang dikirim
        ts: Date.now(),
      };
      channel.send(JSON.stringify(payload));

      setMessages((m) => [
        ...m,
        {
          id: payload.id,
          type: 'chat',
          direction: 'out',
          sender: username,
          plaintext: text,
          cipherBytes,
          ts: payload.ts,
        },
      ]);
      return true;
    },
    [roomId, username]
  );

  return {
    signalingState,
    peerState,
    iceState,
    channelState,
    peerName,
    messages,
    error,
    sendMessage,
    isReady: channelState === 'open',
  };
}
