function tone(ctx, dest, { type, freq, at, dur, gain, slide }) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), at + dur);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp);
  amp.connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function noiseBurst(ctx, dest, { at, dur, gain, band }) {
  const length = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = band;
  filter.Q.value = 0.7;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, at);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(dest);
  src.start(at);
  src.stop(at + dur + 0.02);
}

export function createPump(ctx) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.35);
  master.connect(ctx.destination);

  const beat = 60 / 126;
  const started = ctx.currentTime + 0.02;
  let next = started;
  let stopped = false;

  noiseBurst(ctx, master, { at: ctx.currentTime, dur: 1.4, gain: 0.18, band: 1400 });

  const timer = setInterval(() => {
    if (stopped) return;
    const horizon = ctx.currentTime + 0.25;
    while (next < horizon) {
      const step = Math.round((next - started) / (beat / 2));
      const eighth = ((step % 8) + 8) % 8;
      if (eighth === 0 || eighth === 4) {
        tone(ctx, master, { type: "sine", freq: 150, slide: 46, at: next, dur: 0.18, gain: 0.9 });
      }
      if (eighth === 2 || eighth === 6) {
        noiseBurst(ctx, master, { at: next, dur: 0.12, gain: 0.35, band: 1800 });
      }
      if (eighth % 2 === 1) {
        noiseBurst(ctx, master, { at: next, dur: 0.04, gain: 0.08, band: 6000 });
      }
      const bass = [55, 55, 65, 55, 49, 55, 73, 55][eighth];
      tone(ctx, master, { type: "sawtooth", freq: bass, at: next, dur: beat * 0.42, gain: 0.12 });
      if (step % 16 === 0) {
        tone(ctx, master, { type: "square", freq: 220, at: next, dur: 0.2, gain: 0.06 });
        tone(ctx, master, { type: "square", freq: 277, at: next, dur: 0.2, gain: 0.05 });
      }
      next += beat / 2;
    }
  }, 50);

  return {
    fade() {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
      setTimeout(() => this.stop(), 1400);
    },
    stop() {
      stopped = true;
      clearInterval(timer);
      master.disconnect();
    },
  };
}
