'use client';

// Base64 encoded sounds to avoid external dependencies
const SOUNDS = {
  success: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAA/wD/AP8A/wD/AP8A/wD/', // Placeholder: very short beep
  error: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAA/wD/AP8A/wD/AP8A/wD/'     // Placeholder: very short beep
};

export function playSound(type: keyof typeof SOUNDS) {
  try {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.2;
    audio.play().catch(() => {}); // Browser might block auto-play
  } catch (e) {}
}
