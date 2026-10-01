/**
 * src/dashboard/lib/sounds.js
 *
 * Single source of truth for all dashboard audio.
 * Web Audio API only, one shared AudioContext, resumed on first pointerdown.
 *
 * Named constants let you tune any tone in one line.
 * Everything is gated by the mute flag EXCEPT the mute-toggle confirmation
 * tones (playMuteSound / playUnmuteSound), which always play.
 */

// ─── Shared AudioContext ─────────────────────────────────────────────────────
let _ctx = null;

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _ctx;
}

// Resume on first user pointer interaction
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', function resumeCtx() {
    if (_ctx && _ctx.state === 'suspended') _ctx.resume();
    if (!_ctx) {
      try { getCtx(); } catch (_) {}
    }
    document.removeEventListener('pointerdown', resumeCtx);
  }, { once: true });
}

// ─── Tone constants (tune in one line each) ──────────────────────────────────

// Notification chime — two-note sine: E5 then A5
const NOTE_CHIME_1_HZ   = 659;   // E5
const NOTE_CHIME_2_HZ   = 880;   // A5
const NOTE_CHIME_DUR_MS = 120;   // each note duration ms
const NOTE_CHIME_ATK_MS = 10;    // attack ms
const NOTE_CHIME_DELAY  = 0.110; // second note starts at 110 ms (seconds)
const NOTE_CHIME_GAIN   = 0.08;  // peak gain

// Mute confirmation — descending A4→E4 over 140 ms
const NOTE_MUTE_HZ_START = 440;  // A4
const NOTE_MUTE_HZ_END   = 329;  // E4
const NOTE_MUTE_DUR_S    = 0.14;
const NOTE_MUTE_GAIN     = 0.06;

// Unmute confirmation — ascending E4→A4 over 140 ms
const NOTE_UNMUTE_HZ_START = 329; // E4
const NOTE_UNMUTE_HZ_END   = 440; // A4
const NOTE_UNMUTE_DUR_S    = 0.14;
const NOTE_UNMUTE_GAIN     = 0.06;

// ─── Helper: play a single sine tone with ramp-in (no click) ─────────────────
function _playTone({ startHz, endHz, durationS, peakGain, offsetS = 0 }) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t0 = ctx.currentTime + offsetS;
    const atkS = NOTE_CHIME_ATK_MS / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startHz, t0);
    if (endHz && endHz !== startHz) {
      osc.frequency.exponentialRampToValueAtTime(endHz, t0 + durationS);
    }

    // Ramp gain from 0 to prevent click, then exponential decay
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + atkS);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationS);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durationS + 0.01); // small buffer to avoid truncation
  } catch (e) {
    // Silent fail — audio unavailable
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Soft two-note chime for new notifications.
 * E5 (659 Hz) then A5 (880 Hz), each ~120 ms.
 * Gated by mute flag.
 */
export function playNotificationSound() {
  const isMuted = localStorage.getItem('notifications-muted') === 'true';
  if (isMuted) return;

  const durS = NOTE_CHIME_DUR_MS / 1000;

  // First note: E5
  _playTone({
    startHz: NOTE_CHIME_1_HZ,
    endHz: NOTE_CHIME_1_HZ,
    durationS: durS,
    peakGain: NOTE_CHIME_GAIN,
    offsetS: 0
  });

  // Second note: A5, starts at 110 ms
  _playTone({
    startHz: NOTE_CHIME_2_HZ,
    endHz: NOTE_CHIME_2_HZ,
    durationS: durS,
    peakGain: NOTE_CHIME_GAIN,
    offsetS: NOTE_CHIME_DELAY
  });
}

/**
 * Descending tone confirming mute activation (A4 → E4).
 * Always plays regardless of mute state (it IS the mute confirmation).
 */
export function playMuteSound() {
  _playTone({
    startHz: NOTE_MUTE_HZ_START,
    endHz: NOTE_MUTE_HZ_END,
    durationS: NOTE_MUTE_DUR_S,
    peakGain: NOTE_MUTE_GAIN,
    offsetS: 0
  });
}

/**
 * Ascending tone confirming unmute activation (E4 → A4).
 * Always plays regardless of mute state (it IS the unmute confirmation).
 */
export function playUnmuteSound() {
  _playTone({
    startHz: NOTE_UNMUTE_HZ_START,
    endHz: NOTE_UNMUTE_HZ_END,
    durationS: NOTE_UNMUTE_DUR_S,
    peakGain: NOTE_UNMUTE_GAIN,
    offsetS: 0
  });
}
