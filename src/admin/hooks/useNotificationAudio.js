import { useEffect, useRef } from 'react';

export function useNotificationAudio(notificationCount, notificationSound) {
  const notificationAudio = useRef(null);
  const previousNotificationCount = useRef(null);

  useEffect(() => {
    const unlockAudio = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      notificationAudio.current ||= new AudioContext();
      notificationAudio.current.resume?.();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, []);

  useEffect(() => {
    if (previousNotificationCount.current === null) {
      previousNotificationCount.current = notificationCount;
      return;
    }
    const hasNewNotification = notificationCount > previousNotificationCount.current;
    previousNotificationCount.current = notificationCount;
    if (!notificationSound || !hasNewNotification || !notificationAudio.current) return;
    const context = notificationAudio.current;
    const startedAt = context.currentTime;
    [0, 0.12].forEach((delay, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = index ? 784 : 659;
      gain.gain.setValueAtTime(0.0001, startedAt + delay);
      gain.gain.exponentialRampToValueAtTime(0.08, startedAt + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + delay + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startedAt + delay);
      oscillator.stop(startedAt + delay + 0.2);
    });
  }, [notificationCount, notificationSound]);
}
