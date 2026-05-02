/**
 * Short synthesized two-tone bell for Web Push (Web Audio API).
 */

export function playPushBell(
  ctx: AudioContext,
  destination: AudioNode,
  now = ctx.currentTime,
): number {
  const freqs = [523.25, 783.99];
  let latestEnd = now;
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(g);
    g.connect(destination);
    osc.start(now);
    osc.stop(now + 0.38);
    latestEnd = now + 0.38;
  }
  return Math.round((latestEnd - now) * 1000) + 80;
}
