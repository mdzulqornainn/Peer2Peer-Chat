'use client';

const tone = {
  good: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  wait: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  bad: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  idle: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
};

function toneFor(value) {
  if (['connected', 'open', 'completed'].includes(value)) return 'good';
  if (['failed', 'error', 'room-full', 'disconnected', 'closed'].includes(value)) return 'bad';
  if (['connecting', 'checking', 'new', 'waiting'].includes(value)) return 'wait';
  return 'idle';
}

function Pill({ label, value }) {
  const t = toneFor(value);
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1 ${tone[t]}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${t === 'wait' ? 'animate-pulse' : ''}`} />
      <span className="text-slate-400">{label}:</span>
      <span className="font-medium">{value}</span>
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
