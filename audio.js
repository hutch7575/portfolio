/* ═══════════════════════════════
   AUDIO — Josh Walls Portfolio
═══════════════════════════════ */
let _AC;
function getAC() {
  if (!_AC) _AC = new (window.AudioContext || window.webkitAudioContext)();
  if (_AC.state === 'suspended') _AC.resume();
  return _AC;
}

function playTone(freq, dur, vol = .15, type = 'sine', delay = 0) {
  const ac = getAC();
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime + delay);
  g.gain.setValueAtTime(0, ac.currentTime + delay);
  g.gain.linearRampToValueAtTime(vol, ac.currentTime + delay + .01);
  g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + delay + dur);
  o.start(ac.currentTime + delay);
  o.stop(ac.currentTime + delay + dur);
}

function playNoise(dur, vol = .2, hipass = 800) {
  const ac = getAC();
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = buf; f.type = 'highpass'; f.frequency.value = hipass;
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + dur);
  s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
}

export function playWhoosh()      { playNoise(.2, .1, 400); playTone(200, .2, .04, 'sine'); }
export function playLift()        { playTone(320, .25, .07, 'sine'); playTone(480, .18, .04, 'sine', .05); }
export function playHoldTick()    { playTone(440, .05, .06, 'square'); }
export function playHoldReady()   { playTone(520, .15, .1, 'sine'); playTone(780, .1, .06, 'sine', .08); }
export function playStaticBurst() { playNoise(.18, .28, 1200); }
export function playSlide()       { playNoise(.12, .05, 600); playTone(180, .18, .03, 'sine'); }
export function wakeAudio()       { getAC(); }
