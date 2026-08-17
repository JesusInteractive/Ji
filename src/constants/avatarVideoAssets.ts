// Manifest mapping each JesusMood to its avatar video clip, per the
// naming convention and specs in docs/jesus-video-portrait-brief.md.
// Most moods still have no real clip -- this is the plug point for when
// they do. `warm` is the first real one (see AVATAR_VIDEO_ASSETS below).
//
// Metro requires static, literal require() paths (no dynamic string
// building), so each mood needs its own require() call below, not a
// templated filename.
//
// TO ACTIVATE THE REMAINING MOODS:
// 1. Drop the delivered clips into assets/video/ using the filenames
//    below.
// 2. Uncomment the matching require() call and entry in
//    AVATAR_VIDEO_ASSETS.
// 3. JesusAvatar.tsx already reads from AVATAR_VIDEO_ASSETS -- nothing
//    else needs to change when a mood's clip is added.

import type { JesusMood } from '../types';

export const AVATAR_VIDEO_FILENAMES: Record<JesusMood, string> = {
  neutral: 'jesus_neutral_warm_loop.mp4',
  warm: 'jesus_warm_loop.mp4',
  tearful: 'jesus_tearful_loop.mp4',
  laughing: 'jesus_laughing_loop.mp4',
  grieved: 'jesus_grieved_loop.mp4',
  fadingOut: 'jesus_fadeout.mp4',
};

// `warm` is real: eyes closed -> opens, looks up, breaks into a genuine
// smile. NOT a seamlessly-looped clip (it's a one-directional ~6s arc,
// not a designed loop) -- JesusAvatar.tsx plays it once (player.loop =
// false) and then hands off to AVATAR_SETTLE_LOOP_ASSETS below, rather
// than looping this whole arc (which would jump-cut back to eyes-closed)
// or freezing dead-still on the last frame.
export const AVATAR_VIDEO_ASSETS: Partial<Record<JesusMood, number>> = {
  warm: require('../../assets/video/jesus_warm_loop.mp4'),
  // neutral: require('../../assets/video/jesus_neutral_warm_loop.mp4'),
  // tearful: require('../../assets/video/jesus_tearful_loop.mp4'),
  // laughing: require('../../assets/video/jesus_laughing_loop.mp4'),
  // grieved: require('../../assets/video/jesus_grieved_loop.mp4'),
  // fadingOut: require('../../assets/video/jesus_fadeout.mp4'),
};

// Short, seamless "settle" loop played once the idle clip above finishes
// -- on request, so the last pose keeps a little life in it (wind/subtle
// motion through his hair) instead of freezing dead-still. Built from
// the idle clip's own last ~1s of natural, already-existing motion
// (frames 118-144 of jesus_warm_loop.mp4), reordered as
// [last frame -> first frame -> last frame] (backward then forward) so:
// (a) it starts on EXACTLY the same frame the idle clip just froze on --
//     no visible jump handing off from one clip to the other -- and
// (b) the loop point itself is seamless, since a boomerang always
//     returns to its exact starting frame by construction.
// Regenerate via a script like this if the source clip ever changes:
//   forward = frames[118:145]; sequence = forward[::-1] + forward[1:-1]
export const AVATAR_SETTLE_LOOP_ASSETS: Partial<Record<JesusMood, number>> = {
  warm: require('../../assets/video/jesus_warm_settle_loop.mp4'),
};

export const AVATAR_VIDEO_SPECS = {
  formats: ['MP4 (H.264)', 'WebM'],
  resolution: '1080x1080 (square) or 1080x1920 (portrait), higher preferred',
  frameRate: 30,
  loopLengthSeconds: [5, 15] as [number, number],
  background: 'Transparent (ProRes 4444 / VP9 with alpha) preferred; clean soft heavenly background as fallback for compositing',
};
