# P2P Chat — WebRTC Data Channel + XOR + Differential Manchester

Pure peer-to-peer chat. Socket.IO is used **only** for signaling (offer / answer / ICE).
Once the `RTCDataChannel` opens, every message goes browser ⇄ browser directly.

## Folder structure

```
p2p-chat/
├── README.md
├── server/                          # Signaling server (Node.js + Socket.IO)
│   ├── package.json
│   └── server.js                    # join-room, relay offer/answer/ice-candidate, peer-left
└── client/                          # Next.js 14 (App Router) + Tailwind CSS
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── jsconfig.json                # alias "@/..."
    ├── .env.local.example           # NEXT_PUBLIC_SIGNALING_URL (optional)
    ├── app/
    │   ├── layout.js                # <UserProvider> wraps every page
    │   ├── globals.css
    │   ├── page.js                  # Entry Page (username)
    │   ├── home/page.js             # Home Dashboard (generate / join room)
    │   ├── profile/page.js          # Profile + Reset/Logout
    │   └── room/[roomId]/page.js    # Chat Room
    ├── components/
    │   ├── AuthGuard.js             # redirect to "/" when no username
    │   ├── Navbar.js
    │   ├── ConnectionStatus.js      # Signaling / Peer / ICE / DataChannel pills
    │   ├── ChatBubble.js            # bubble + waveform + hex/binary details
    │   └── ManchesterWaveform.js    # SVG Differential Manchester visualizer
    ├── context/
    │   └── UserContext.js           # global username (Context + localStorage)
    └── lib/
        ├── useWebRTC.js             # all WebRTC + signaling logic (hook)
        ├── xor.js                   # XOR encrypt/decrypt (key = Room ID) + binary helpers
        ├── manchester.js            # Differential Manchester encode/decode
        └── roomId.js                # generate / validate Room ID
```

## Run locally

Requirements: Node.js 18+ (tested on 22).

**Terminal 1 — signaling server**
```bash
cd server
npm install
npm start            # http://localhost:3001  (health check: /health)
```

**Terminal 2 — Next.js client**
```bash
cd client
npm install
npm run dev          # http://localhost:3000
```

**Test it**
1. Open `http://localhost:3000` in a normal window → enter username → *Generate Random Room ID* → *Enter this room*.
2. Open `http://localhost:3000` in an **incognito window / other browser** (localStorage is per profile) → another username → paste the Room ID → *Join Room*.
3. Wait for `DataChannel: open` / **P2P connected**, then chat.

**Two devices on the same Wi-Fi**
Open `http://<your-laptop-LAN-IP>:3000` on the phone. The client automatically uses
`http://<same-host>:3001` for signaling. Allow ports 3000 & 3001 in the firewall.
Override with `client/.env.local` → `NEXT_PUBLIC_SIGNALING_URL=http://host:3001` if needed.

**Production build:** `cd client && npm run build && npm start`.

## How it works

| Step | Where | What |
|---|---|---|
| Join | Socket.IO | `join-room {roomId, username}` — max 2 peers, 3rd gets `room-full` |
| Offer | existing peer | receives `peer-joined` → `createDataChannel('chat')` → `createOffer` → `offer` |
| Answer | new peer | `setRemoteDescription` → `createAnswer` → `answer` |
| ICE | both | trickle `ice-candidate` (queued until remoteDescription is set) |
| Chat | **DataChannel** | `{type:'chat', sender, cipher:<base64>, ts}` — only ciphertext is sent |

- **XOR:** `UTF-8 bytes(plaintext) XOR bytes(RoomID)[i % len]` → ciphertext bytes. Byte-level, so emoji / Turkish chars survive.
- **Differential Manchester** (IEEE 802.5 convention): always a transition mid-bit; bit `0` = transition at bit start, bit `1` = no transition at start. Initial line level = LOW. Input = ciphertext bits (MSB first).

## Known limitations (honest notes)

- **XOR with the Room ID is not real security.** The key is short and repeats, and the Room ID is sent to the signaling server in `join-room`, so the server operator effectively knows the key. The actual confidentiality on the wire comes from WebRTC's mandatory DTLS encryption of the Data Channel. XOR here is for the educational/visualization requirement.
- **STUN only, no TURN.** Works on the same LAN and most home networks. Symmetric NAT / strict campus or mobile networks may end in `failed`; add a TURN server to `ICE_SERVERS` in `lib/useWebRTC.js` for that.
- **1-to-1 rooms.** Group chat would need a mesh (one RTCPeerConnection per peer) or an SFU.
- **No history.** Messages live in memory; refresh = empty chat (by design — nothing is stored anywhere).
