# P2P Chat — WebRTC + Enkripsi XOR + Differential Manchester

Aplikasi chat **peer-to-peer (P2P)**: pesan dikirim langsung dari browser ke browser lewat **WebRTC Data Channel**, dienkripsi **XOR** (key = Room ID), dan setiap pesan ditampilkan sebagai gelombang sinyal **Differential Manchester**.

Server Socket.IO hanya dipakai sebagai **signaling server** (pertukaran `offer`, `answer`, `ice-candidate`). Isi chat **tidak pernah** melewati server.

---

## Daftar Isi

1. [Persyaratan](#1-persyaratan)
2. [Instalasi](#2-instalasi)
3. [Menjalankan Aplikasi](#3-menjalankan-aplikasi)
4. [Mencoba Chat](#4-mencoba-chat)
5. [Mencoba di 2 Perangkat (HP + Laptop)](#5-mencoba-di-2-perangkat-hp--laptop)
6. [Konfigurasi (Environment Variable)](#6-konfigurasi-environment-variable)
7. [Build untuk Production](#7-build-untuk-production)
8. [Deploy Online (Vercel + Render)](#8-deploy-online-vercel--render)
9. [Troubleshooting](#9-troubleshooting)
10. [Struktur Folder](#10-struktur-folder)
11. [Cara Kerja Singkat](#11-cara-kerja-singkat)
12. [Keterbatasan](#12-keterbatasan)

---

## 1. Persyaratan

| Software | Versi | Cek dengan |
|---|---|---|
| **Node.js** | 18.17 atau lebih baru (disarankan 20 / 22 LTS) | `node -v` |
| **npm** | ikut terpasang bersama Node.js | `npm -v` |
| **Browser** | Chrome, Edge, Firefox, atau Safari versi terbaru | — |
| Git *(opsional)* | untuk upload ke GitHub / deploy | `git --version` |

Belum punya Node.js? Download versi **LTS** di <https://nodejs.org>, install, lalu **tutup dan buka lagi** terminal sebelum cek `node -v`.

---

## 2. Instalasi

### 2.1 Extract project

Extract `p2p-chat.zip`, lalu buka terminal (Command Prompt / PowerShell / Terminal) di folder `p2p-chat`.

```
p2p-chat/
├── server/   ← signaling server (Node.js + Socket.IO)
└── client/   ← aplikasi web (Next.js + Tailwind CSS)
```

### 2.2 Install dependency server

```bash
cd server
npm install
cd ..
```

### 2.3 Install dependency client

```bash
cd client
npm install
cd ..
```

Proses `npm install` di client butuh waktu ±1–2 menit (tergantung internet). Folder `node_modules/` akan muncul di masing-masing folder — itu normal.

---

## 3. Menjalankan Aplikasi

Aplikasi ini butuh **2 terminal yang berjalan bersamaan**. Jangan tutup salah satunya selama aplikasi dipakai.

### Terminal 1 — Signaling Server

```bash
cd server
npm start
```

Kalau berhasil, muncul:

```
Signaling server listening on http://0.0.0.0:3001  (CORS origin: *)
```

Cek di browser: buka <http://localhost:3001/health> → harus muncul `{"status":"ok",...}`.

### Terminal 2 — Client (Next.js)

```bash
cd client
npm run dev
```

Kalau berhasil, muncul:

```
▲ Next.js 14.x
- Local:   http://localhost:3000
✓ Ready
```

Buka **<http://localhost:3000>** di browser.

> Untuk menghentikan server: tekan `Ctrl + C` di masing-masing terminal.

---

## 4. Mencoba Chat

Karena username disimpan di `localStorage`, dua tab di browser yang sama akan memakai username yang sama. Jadi pakai **dua "profil" browser yang berbeda**:

| Peserta | Buka di |
|---|---|
| Peserta A | Window browser biasa |
| Peserta B | Window **Incognito / Private** (atau browser lain, misal Chrome + Edge) |

Langkah:

1. **Peserta A** → buka `http://localhost:3000` → isi username → **Lanjut**.
2. Di Beranda, klik **Buat Room ID Acak** → **Salin** → **Masuk ke room ini →**.
3. **Peserta B** → buka `http://localhost:3000` di window incognito → isi username lain → **Lanjut**.
4. Tempel Room ID di kolom **Gabung ke room** → klik **Gabung**.
5. Tunggu sampai badge **P2P terhubung** muncul dan status `DataChannel: terbuka`.
6. Ketik pesan → **Kirim**. Di bawah setiap bubble akan muncul gelombang Differential Manchester dari ciphertext-nya. Klik **Lihat ciphertext (hex / biner)** untuk melihat datanya.

Status koneksi di bagian atas Chat Room:

| Label | Arti |
|---|---|
| **Signaling** | Koneksi ke server Socket.IO |
| **Peer** | Status `RTCPeerConnection` |
| **ICE** | Proses pencarian jalur jaringan antar-peer |
| **DataChannel** | Jalur P2P untuk pesan — harus **terbuka** agar bisa chat |

---

## 5. Mencoba di 2 Perangkat (HP + Laptop)

Kedua perangkat harus terhubung ke **Wi-Fi yang sama**.

1. Jalankan server dan client di laptop (langkah 3).
2. Cari **IP address laptop** di jaringan lokal:
   - **Windows:** buka Command Prompt → `ipconfig` → lihat `IPv4 Address` (contoh `192.168.1.10`)
   - **macOS:** `ipconfig getifaddr en0`
   - **Linux:** `hostname -I`
3. Di HP, buka `http://192.168.1.10:3000` (ganti dengan IP laptop kamu).
4. Client otomatis terhubung ke signaling server di `http://192.168.1.10:3001` — tidak perlu setting tambahan.
5. **Windows:** kalau muncul pop-up *Windows Defender Firewall* saat menjalankan Node.js, pilih **Allow access** untuk jaringan **Private**.

> Tombol **Salin** (clipboard) hanya bekerja di `localhost` atau HTTPS. Di alamat IP LAN, salin Room ID secara manual.

---

## 6. Konfigurasi (Environment Variable)

Semua bersifat **opsional**. Default-nya sudah jalan untuk localhost dan LAN.

### Client (`client/.env.local`)

Salin `client/.env.local.example` menjadi `client/.env.local`, lalu isi:

| Variable | Default | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SIGNALING_URL` | `http://<host-yang-dibuka>:3001` | Alamat signaling server. **Wajib diisi saat deploy online.** |

> Variable `NEXT_PUBLIC_*` dimasukkan saat **build**. Setelah mengubahnya, restart `npm run dev` atau build ulang.

### Server (environment variable sistem)

| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `3001` | Port signaling server |
| `CLIENT_ORIGIN` | `*` | Domain yang boleh terhubung (CORS). Bisa lebih dari satu, pisahkan dengan koma |

Contoh mengganti port:

```bash
# macOS / Linux
PORT=4000 npm start

# Windows (PowerShell)
$env:PORT=4000; npm start

# Windows (Command Prompt)
set PORT=4000 && npm start
```

Kalau port server diganti, isi juga `NEXT_PUBLIC_SIGNALING_URL=http://localhost:4000` di client.

### Mengganti warna tema

Semua warna ada di satu tempat: `client/app/globals.css` bagian `:root`.

---

## 7. Build untuk Production

Mode `npm run dev` untuk development (ada hot-reload, lebih lambat). Untuk demo / presentasi, pakai build production:

```bash
cd client
npm run build
npm start
```

Aplikasi tetap berjalan di <http://localhost:3000>. Signaling server tetap dijalankan dengan `npm start` di folder `server`.

---

## 8. Deploy Online (Vercel + Render)

Vercel **tidak bisa** menjalankan Socket.IO (serverless, tidak mendukung WebSocket yang terus terbuka). Jadi deploy dipisah:

| Bagian | Deploy ke |
|---|---|
| `client/` | **Vercel** |
| `server/` | **Render** (atau Railway / Fly.io / Koyeb) |

**1. Upload ke GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/p2p-chat.git
git push -u origin main
```

**2. Render (signaling server)** — New → Web Service → pilih repo:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Setelah deploy, catat URL-nya, misal `https://p2p-chat-signal.onrender.com`

**3. Vercel (client)** — Add New → Project → pilih repo:

- Root Directory: `client`
- Environment Variable: `NEXT_PUBLIC_SIGNALING_URL` = URL Render (tanpa `/` di akhir)

**4. (Disarankan)** Di Render → Environment, tambahkan `CLIENT_ORIGIN` = URL Vercel kamu.

> Render versi gratis "tidur" kalau lama tidak dipakai; request pertama bisa lambat ±30–60 detik. Sebelum demo, buka dulu `/health` supaya server bangun.

---

## 9. Troubleshooting

| Masalah | Penyebab & Solusi |
|---|---|
| `'node' is not recognized` / `command not found: node` | Node.js belum terinstall atau terminal belum di-restart setelah install. |
| `Error: listen EADDRINUSE :::3001` (atau `:3000`) | Port sudah dipakai program lain / server lama masih jalan. Tutup terminal lama, atau cari prosesnya: Windows `netstat -ano \| findstr :3001` lalu `taskkill /PID <pid> /F`; macOS/Linux `lsof -i :3001` lalu `kill <pid>`. |
| Status **Signaling: error** + pesan "Tidak bisa terhubung ke signaling server" | `server` belum dijalankan, atau alamat/port salah. Cek <http://localhost:3001/health>. |
| Kedua peserta punya username yang sama | Dua tab di profil browser yang sama berbagi `localStorage`. Pakai window incognito / browser lain. |
| "Room ini sudah berisi 2 orang" | Satu room maksimal 2 peserta. Buat Room ID baru. |
| **Peer: gagal** / tidak pernah **terhubung** | Jaringan memblokir koneksi P2P langsung (NAT ketat, Wi-Fi kampus, data seluler). Coba di Wi-Fi yang sama, atau tambahkan server TURN di `ICE_SERVERS` pada `client/lib/useWebRTC.js`. |
| HP tidak bisa membuka `http://<IP>:3000` | Beda jaringan Wi-Fi, IP salah, atau firewall memblokir port 3000/3001. |
| Pesan chat hilang setelah refresh | Memang begitu desainnya — pesan tidak disimpan di mana pun. |
| Error aneh setelah update code | Hapus folder `client/.next`, lalu jalankan `npm run dev` lagi. |

---

## 10. Struktur Folder

```
p2p-chat/
├── README.md
├── .gitignore
├── server/
│   ├── package.json
│   └── server.js                  # signaling: join-room, offer, answer, ice-candidate
└── client/
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.js          # token warna → CSS variable
    ├── postcss.config.js
    ├── jsconfig.json               # alias "@/..."
    ├── .env.local.example
    ├── app/
    │   ├── layout.js               # UserProvider untuk semua halaman
    │   ├── globals.css             # palet warna (:root)
    │   ├── page.js                 # Entry Page (input username)
    │   ├── home/page.js            # Beranda (buat / gabung room)
    │   ├── profile/page.js         # Profil + Reset / Keluar
    │   └── room/[roomId]/page.js   # Chat Room
    ├── components/
    │   ├── AuthGuard.js            # redirect ke Entry Page jika belum ada username
    │   ├── Navbar.js
    │   ├── ConnectionStatus.js     # status Signaling / Peer / ICE / DataChannel
    │   ├── ChatBubble.js           # bubble + waveform + detail ciphertext
    │   └── ManchesterWaveform.js   # visualisasi SVG Differential Manchester
    ├── context/
    │   └── UserContext.js          # username global (React Context + localStorage)
    └── lib/
        ├── useWebRTC.js            # seluruh logika WebRTC + signaling
        ├── xor.js                  # enkripsi/dekripsi XOR + konversi biner/hex
        ├── manchester.js           # encode/decode Differential Manchester
        └── roomId.js               # generate & validasi Room ID
```

---

## 11. Cara Kerja Singkat

```
Plaintext → [XOR, key = Room ID] → Ciphertext → Biner → [Differential Manchester] → Waveform
                                        │
                                        └──► dikirim lewat WebRTC Data Channel (P2P)
```

1. **Signaling:** peserta yang masuk duluan menjadi *offerer*. Saat peserta kedua masuk, `offer` → `answer` → `ice-candidate` dipertukarkan lewat Socket.IO.
2. **P2P:** setelah Data Channel **terbuka**, semua pesan dikirim langsung antar-browser.
3. **XOR:** teks diubah ke byte UTF-8, lalu di-XOR dengan byte Room ID secara berulang. Yang dikirim hanya ciphertext. Penerima men-decrypt dengan Room ID yang sama.
4. **Differential Manchester** (konvensi IEEE 802.5):
   - selalu ada transisi di **tengah** bit (sinkronisasi clock)
   - bit `0` → **ada** transisi di awal bit
   - bit `1` → **tidak ada** transisi di awal bit

   Manchester adalah *line coding* (representasi sinyal), **bukan** enkripsi. Yang membuat data tidak terbaca pihak ketiga adalah enkripsi XOR sebelum encoding.

---

## 12. Keterbatasan

- **XOR dengan Room ID bukan enkripsi yang kuat.** Key pendek dan berulang (rentan *known-plaintext attack*), dan Room ID terlihat di URL serta dikirim ke signaling server. Keamanan transport sebenarnya berasal dari enkripsi **DTLS** bawaan WebRTC.
- **Hanya STUN, tanpa TURN.** Bisa gagal di jaringan dengan NAT ketat.
- **Satu room = 2 peserta.**
- **Tidak ada riwayat chat** — semua pesan hanya ada di memori browser.
- **Waveform adalah simulasi** physical layer; data yang benar-benar dikirim adalah paket WebRTC.
