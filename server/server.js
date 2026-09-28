/**
 * WebRTC Signaling Server (Socket.IO)
 * ------------------------------------
 * Tugas server ini HANYA signaling:
 *   - join-room / leave-room (room management, max 2 peer per room)
 *   - relay: offer, answer, ice-candidate  (ditujukan ke 1 socket tertentu)
 *
 * Server ini TIDAK PERNAH menerima isi chat. Setelah RTCDataChannel terbuka,
 * pesan dikirim langsung peer-to-peer (browser <-> browser).
 */

const http = require('http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 3001;
// Contoh: CLIENT_ORIGIN="http://localhost:3000,http://192.168.1.10:3000"
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const MAX_PEERS_PER_ROOM = 2;
const ROOM_ID_PATTERN = /^[A-Z0-9-]{4,32}$/;

const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        rooms: countRooms(),
        connections: io.engine.clientsCount,
      })
    );
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('P2P Chat signaling server is running. Chat messages never pass through here.\n');
});

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST'],
  },
});

/** Hitung room "asli" (bukan room default per-socket milik Socket.IO). */
function countRooms() {
  let n = 0;
  for (const [name] of io.sockets.adapter.rooms) {
    if (!io.sockets.sockets.has(name)) n += 1;
  }
  return n;
}

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function leaveCurrentRoom(socket) {
  const { roomId } = socket.data;
  if (!roomId) return;
  socket.to(roomId).emit('peer-left', {
    socketId: socket.id,
    username: socket.data.username,
  });
  socket.leave(roomId);
  log(`${socket.data.username} (${socket.id}) left room ${roomId}`);
  socket.data.roomId = null;
}

io.on('connection', (socket) => {
  log(`socket connected: ${socket.id}`);

  // ---- Room management -------------------------------------------------
  socket.on('join-room', (payload = {}) => {
    const roomId = String(payload.roomId || '').trim().toUpperCase();
    const username = String(payload.username || '').trim().slice(0, 24) || 'Anonymous';

    if (!ROOM_ID_PATTERN.test(roomId)) {
      socket.emit('join-error', { message: 'Invalid Room ID (4-32 chars, A-Z, 0-9, "-").' });
      return;
    }

    // Kalau socket ini sebelumnya ada di room lain, keluar dulu
    if (socket.data.roomId && socket.data.roomId !== roomId) leaveCurrentRoom(socket);

    const room = io.sockets.adapter.rooms.get(roomId);
    const currentSize = room ? room.size : 0;

    if (currentSize >= MAX_PEERS_PER_ROOM) {
      socket.emit('room-full', { roomId });
      log(`room ${roomId} full, rejected ${username} (${socket.id})`);
      return;
    }

    // Peer yang sudah ada di room (sebelum socket ini join)
    const peers = room
      ? [...room].map((id) => ({
          socketId: id,
          username: io.sockets.sockets.get(id)?.data.username || 'Anonymous',
        }))
      : [];

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;

    socket.emit('room-joined', { roomId, selfId: socket.id, peers });
    // Peer lama akan menjadi "offerer" begitu menerima event ini
    socket.to(roomId).emit('peer-joined', { socketId: socket.id, username });

    log(`${username} (${socket.id}) joined room ${roomId} [${currentSize + 1}/${MAX_PEERS_PER_ROOM}]`);
  });

  socket.on('leave-room', () => leaveCurrentRoom(socket));

  // ---- Signaling relay (offer / answer / ice-candidate) ------------------
  // Payload diteruskan apa adanya ke socket tujuan, hanya jika keduanya
  // berada di room yang sama. Server tidak menyimpan SDP/candidate.
  const relay = (event) => {
    socket.on(event, (payload = {}) => {
      const { to, ...data } = payload;
      const target = to && io.sockets.sockets.get(to);
      if (!target || !socket.data.roomId || target.data.roomId !== socket.data.roomId) return;

      target.emit(event, {
        ...data,
        from: socket.id,
        username: socket.data.username,
      });
      if (event !== 'ice-candidate') log(`relay ${event}: ${socket.id} -> ${to}`);
    });
  };
  ['offer', 'answer', 'ice-candidate'].forEach(relay);

  socket.on('disconnect', (reason) => {
    leaveCurrentRoom(socket);
    log(`socket disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  log(`Signaling server listening on http://0.0.0.0:${PORT}  (CORS origin: ${CLIENT_ORIGIN})`);
});
