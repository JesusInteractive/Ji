import type { AudioPlayer, AudioStatus } from 'expo-audio';

// Ramps an already-playing expo-audio player's volume from its current
// level to `target` over `durationMs`, instead of jumping straight to
// it. Used for the entrance/exit wind cue (ChatScreen.tsx,
// GlorySplash.tsx) -- a hard on/off cut at a fixed volume kept reading
// as either "too loud" (any sudden burst is jarring, even a quiet one)
// or "nothing" (an abrupt quiet clip is easy to miss), depending on the
// moment. Fading softens the onset and gives the ear time to register
// it. `onComplete` fires once the ramp finishes.
export function fadeAudioVolume(
  player: AudioPlayer,
  target: number,
  durationMs = 700,
  steps = 10,
  onComplete?: () => void
): void {
  const from = player.volume;
  const stepMs = durationMs / steps;
  let step = 0;
  const interval = setInterval(() => {
    step += 1;
    player.volume = step >= steps ? target : from + (target - from) * (step / steps);
    if (step >= steps) {
      clearInterval(interval);
      onComplete?.();
    }
  }, stepMs);
}

// Fades in from silence at the start (synced with the caller's entrance
// motion starting), then lets the clip run all the way to its own
// natural end -- an earlier version also faded it back out and stopped
// it early partway through, which read as an abrupt cut rather than a
// clip that gets to finish. Cleans up the player once playback
// genuinely completes (didJustFinish), rather than never releasing it.
export function playFadedWindCue(player: AudioPlayer, target: number, fadeInMs = 700): void {
  player.volume = 0;
  player.play();
  fadeAudioVolume(player, target, fadeInMs);

  const subscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (status.didJustFinish) {
      subscription.remove();
      try {
        player.remove();
      } catch {
        // already removed -- fine to ignore
      }
    }
  });
}
