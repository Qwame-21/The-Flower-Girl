import { useEffect, useRef } from 'react';

export function useNotificationAudio(notificationCount, notificationSound) {
  const audio = useRef(null);
  const previousCount = useRef(null);
  const play = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      audio.current ||= new AudioContext();
      const context = audio.current;
      await context.resume();
      [0, 0.12].forEach((delay, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + delay;
        oscillator.frequency.value = index ? 784 : 659;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        oscillator.connect(gain).connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      });
    } catch { /* Browsers may suspend audio until the next user gesture. */ }
  };
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; });
  useEffect(() => {
    const unlock = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audio.current ||= new AudioContext();
      audio.current.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock);
    return () => { window.removeEventListener('pointerdown', unlock); audio.current?.close().catch(() => {}); audio.current = null; };
  }, []);
  useEffect(() => {
    const increased = previousCount.current !== null && notificationCount > previousCount.current;
    previousCount.current = notificationCount;
    if (notificationSound && increased) playRef.current();
  }, [notificationCount, notificationSound]);
  return play;
}
