'use client';

// Warna status sengaja tetap hijau / kuning / merah (bukan ungu),
// supaya arti "berhasil / menunggu / gagal" tetap langsung terbaca.
const tone = {
  good: 'bg-emerald-50 text-emerald-800 ring-emerald-600/30',
  wait: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  bad: 'bg-rose-50 text-rose-800 ring-rose-600/30',
  idle: 'bg-surface text-ink/70 ring-soft',
};

function toneFor(value) {
  if (['connected', 'open', 'completed'].includes(value)) return 'good';
  if (['failed', 'error', 'room-full', 'disconnected', 'closed'].includes(value)) return 'bad';
  if (['connecting', 'checking', 'new', 'waiting'].includes(value)) return 'wait';
  return 'idle';
}

// Nilai state asli dari WebRTC / Socket.IO (bahasa Inggris) -> label Indonesia
const labelId = {
  connected: 'terhubung',
  connecting: 'menghubungkan',
  disconnected: 'terputus',
  failed: 'gagal',
  closed: 'tertutup',
  open: 'terbuka',
  new: 'baru',
  checking: 'memeriksa',
  completed: 'selesai',
  waiting: 'menunggu',
  'room-full': 'room penuh',
  error: 'error',
};

function Pill({ label, value }) {
  const t = toneFor(value);
  const shown = labelId[value] || value;
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1 ${tone[t]}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${t === 'wait' ? 'animate-pulse' : ''}`} />
      <span className="opacity-70">{label}:</span>
      <span className="font-medium" title={value}>{shown}</span>
    </div>
  );
}

export default function ConnectionStatus({ signalingState, peerState, iceState, channelState }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Pill label="Signaling" value={signalingState} />
      <Pill label="Peer" value={peerState} />
      <Pill label="ICE" value={iceState} />
      <Pill label="DataChannel" value={channelState} />
    </div>
  );
}
