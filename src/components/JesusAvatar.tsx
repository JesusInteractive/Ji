import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { JesusMood } from '../types';
import Colors from '../theme/colors';
import { MOOD_APPEARANCE_NOTES } from '../constants/appearance';
import { AVATAR_VIDEO_ASSETS, AVATAR_SETTLE_LOOP_ASSETS } from '../constants/avatarVideoAssets';

// ---------------------------------------------------------------------
// STATE MACHINE + SPEAKING INDICATOR
// ---------------------------------------------------------------------
// State machine: 'idle' | 'speaking'.
//   idle     -> the normal looping mood clip (or, until real clips exist,
//               the dressed-up placeholder image).
//   speaking -> cross-fades to a talking version of the same mood if one
//               exists (AvatarVideoLayer), else keeps the idle clip
//               playing and shows a small pulsing "speaking" badge.
//   idle again once speaking ends -- all transitions below are Animated
//   timings with easing curves, never an instant set.
//
// HONESTY NOTE: there is no independently riggable face behind either
// the placeholder image today or the pre-rendered .mp4 loops this is
// built for -- a baked video's pixels can be cross-faded as a whole clip
// but not blended per-region (mouth vs. brow vs. cheek) the way a live
// blendshape rig can. That capability exists only in the *production*
// pipeline (tools/avatar-mocap/'s MediaPipe -> Live Link path), which
// docs/jesus-video-portrait-brief.md deliberately keeps out of the app
// ("full live streaming... is out of scope for v1"). An earlier version
// of this file tried to fake mouth movement with a shape overlaid
// directly on the lips -- pulled after it read as distorting his face
// rather than as speech (see the speaking-badge section below for what
// replaced it). Until real per-mood video/rig exists, "he's speaking" is
// communicated off the face entirely, not simulated on it.
//
// avatarVideoAssets.ts is the source of truth for which moods have a
// real clip -- `warm` is the first one (see that file's own comment for
// what it shows and its one caveat: it's a one-directional arc, not a
// seamless loop). IDLE_VIDEO_SOURCES below just reads straight from it;
// every other mood is still `null` until a clip exists for it.
// TO ACTIVATE a remaining mood once its clip exists:
//   1. Uncomment its require() call and entry in avatarVideoAssets.ts's
//      AVATAR_VIDEO_ASSETS.
//   2. Nothing else needs to change here -- IDLE_VIDEO_SOURCES picks it
//      up automatically.
//   3. If talking clips are produced per mood, add a same-shaped map in
//      avatarVideoAssets.ts (e.g. AVATAR_VIDEO_ASSETS_TALKING) and point
//      SPEAKING_VIDEO_SOURCES at it. Until then, `speaking` reuses the
//      idle clip plus the speaking badge -- see AvatarVideoLayer.
type MoodVideoSource = number | null;

const IDLE_VIDEO_SOURCES: Record<JesusMood, MoodVideoSource> = {
  neutral: AVATAR_VIDEO_ASSETS.neutral ?? null,
  warm: AVATAR_VIDEO_ASSETS.warm ?? null,
  tearful: AVATAR_VIDEO_ASSETS.tearful ?? null,
  laughing: AVATAR_VIDEO_ASSETS.laughing ?? null,
  grieved: AVATAR_VIDEO_ASSETS.grieved ?? null,
  fadingOut: AVATAR_VIDEO_ASSETS.fadingOut ?? null,
};

const SPEAKING_VIDEO_SOURCES: Record<JesusMood, MoodVideoSource> = {
  neutral: null,
  warm: null,
  tearful: null,
  laughing: null,
  grieved: null,
  fadingOut: null,
};

// Short seamless loop played once the idle clip above finishes -- see
// AVATAR_SETTLE_LOOP_ASSETS's own comment for how it's built.
const SETTLE_LOOP_VIDEO_SOURCES: Record<JesusMood, MoodVideoSource> = {
  neutral: AVATAR_SETTLE_LOOP_ASSETS.neutral ?? null,
  warm: AVATAR_SETTLE_LOOP_ASSETS.warm ?? null,
  tearful: AVATAR_SETTLE_LOOP_ASSETS.tearful ?? null,
  laughing: AVATAR_SETTLE_LOOP_ASSETS.laughing ?? null,
  grieved: AVATAR_SETTLE_LOOP_ASSETS.grieved ?? null,
  fadingOut: AVATAR_SETTLE_LOOP_ASSETS.fadingOut ?? null,
};

// Four static portraits, one per mood group -- see MOOD_PORTRAIT below
// for the mapping. 'circle' crops an image into a square via
// resizeMode="cover" (scales to match width, crops the taller
// dimension's overflow symmetrically off top and bottom); 'portrait'
// shows the whole image uncropped.
type PortraitAsset = {
  source: number;
  aspect: number; // height / width
};

// 1068x1425. Direct camera gaze, calm/composed, no tears or smile.
const SERIOUS_PORTRAIT: PortraitAsset = {
  source: require('../../assets/jesus-portrait-neutral.png'),
  aspect: 1425 / 1068,
};

// 1031x1419. Direct-camera-gaze smiling shot (was previously head tilted
// back, not looking at the viewer -- swapped on request).
const SMILING_PORTRAIT: PortraitAsset = {
  source: require('../../assets/jesus-portrait-smiling.png'),
  // The photo itself is a square (chest-up) crop, but `aspect` here also
  // sizes the on-screen frame for the warm mood's looping VIDEO
  // (AvatarVideoLayer renders instead of this photo whenever hasVideo is
  // true, which it always is for 'warm'). The video's native size is
  // 480x640 (portrait, not square) -- using its real aspect here means
  // contentFit="cover" doesn't need to crop vertically at all, which is
  // what was eating into his headroom when this was forced to 1 (square).
  aspect: 640 / 480,
};

// 1008x1440 (cropped from a 1080x2340 screenshot -- original had black
// letterbox bars top/bottom, removed via ffmpeg cropdetect before this
// was calibrated). Direct camera gaze with tears, composed rather than
// distressed -- matches MOOD_APPEARANCE_NOTES.tearful/grieved AND the
// direct-gaze requirement.
const TEARFUL_PORTRAIT: PortraitAsset = {
  source: require('../../assets/jesus-portrait-tearful.png'),
  aspect: 1440 / 1008,
};

// 1080x1382. Open, genuine laugh, head tilted back -- distinct from the
// closed-eyes gentle smile of SMILING_PORTRAIT above.
const LAUGHING_PORTRAIT: PortraitAsset = {
  source: require('../../assets/jesus-portrait-laughing.png'),
  aspect: 1382 / 1080,
};

const MOOD_PORTRAIT: Record<JesusMood, PortraitAsset> = {
  neutral: SERIOUS_PORTRAIT,
  warm: SMILING_PORTRAIT,
  tearful: TEARFUL_PORTRAIT,
  laughing: LAUGHING_PORTRAIT,
  grieved: TEARFUL_PORTRAIT,
  fadingOut: SERIOUS_PORTRAIT,
};

// Tallest of the four portraits' aspect ratios (currently
// TEARFUL_PORTRAIT's) -- see MAX_PORTRAIT_ASPECT's one usage below for
// why. Recheck this if a taller-aspect photo is ever added.
const MAX_PORTRAIT_ASPECT = Math.max(
  ...Object.values(MOOD_PORTRAIT).map((p) => p.aspect)
);

interface Props {
  mood: JesusMood;
  size?: number;
  // 'circle' (default) is the small chat-bubble look. 'portrait' shows
  // the full, uncropped image in its natural aspect ratio -- for the
  // large central avatar, per the "no circular crop, natural portrait"
  // request.
  shape?: 'circle' | 'portrait';
  onFadeComplete?: () => void;
  // Controlled speaking flag -- if provided, this drives the idle/speaking
  // state directly. Omit it to use the uncontrolled ref API instead
  // (see JesusAvatarHandle).
  speaking?: boolean;
}

export interface JesusAvatarHandle {
  startSpeaking: () => void;
  stopSpeaking: () => void;
  // Replays the current mood's idle video from the start (no-op for
  // moods without a video). Lets the "plays once, freezes on last frame"
  // clip be rewatched on demand instead of only once per mood-entry.
  replayIdle: () => void;
}

// Autonomous layer: a randomized blink, always running regardless of
// mood/speaking/emotion. Multiplied into the avatar's overall opacity
// (Animated.multiply) rather than touching mood opacity directly.
function useAutoBlink() {
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = 2400 + Math.random() * 3200; // 2.4-5.6s -- natural, not metronomic
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.82, duration: 70, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: true }),
        ]).start(() => {
          if (!cancelled) scheduleNext();
        });
      }, delay);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [blink]);

  return blink;
}

// Autonomous layer: sheer, continuously drifting cloud veil over the
// portrait -- always running, independent of mood/speaking, per "keep a
// layer of sheer clouds moving over Jesus," slowed down and layered into
// actual waves on request ("slow waves of clouds moving past him as if
// he is visiting from heaven"). Three independent Animated.Values:
// - primary: the nearer, slightly more visible band of cloud.
// - secondary: a farther, dimmer band drifting slower than primary --
//   together they read as depth/parallax (distinct cloud layers passing
//   at different speeds) rather than one flat sliding gradient.
// - bob: a slow, independent vertical sway applied to both layers so the
//   veil gently undulates instead of moving in a perfectly flat line --
//   the "waves" quality, on top of the horizontal drift.
// Each pair of bands is two identical gradients placed side by side
// (each 2x the frame width) drifting left together; when the loop resets
// from -frameWidth back to 0, the second band is sitting exactly where
// the first started, so the wrap is seamless. Pure translateX/translateY
// -- native-driver safe, no mixing issues.
function useDriftingClouds() {
  const primary = useRef(new Animated.Value(0)).current;
  const secondary = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(primary, {
          toValue: 1,
          duration: 26000, // slowed way down from the original 14000, on request
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(secondary, {
          toValue: 1,
          duration: 40000, // slower still -- the "farther" layer
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [primary, secondary, bob]);

  return { primary, secondary, bob };
}

// Idle mood clip <-> talking clip cross-fade. Renders nothing (null) when
// there's no idle clip yet for this mood, so the caller falls back to the
// dressed-up placeholder image. Built on expo-video (useVideoPlayer /
// VideoView) -- expo-av is deprecated and, as of the Expo Go build
// matching this project's SDK, no longer ships its native module at
// all, so importing it anywhere crashes the app at load time, not just
// when a <Video> actually renders. useVideoPlayer(null) is a valid,
// inert player per expo-video's own types, so calling the hooks
// unconditionally here (idle/speaking sources are both usually null
// today) is safe.
function AvatarVideoLayer({
  mood,
  isSpeaking,
  displayWidth,
  displayHeight,
  displayRadius,
  replayKey,
}: {
  mood: JesusMood;
  isSpeaking: boolean;
  displayWidth: number;
  displayHeight: number;
  displayRadius: number;
  // Bumped by JesusAvatarHandle.replayIdle() to rewatch the idle clip
  // on demand once it has already played through.
  replayKey: number;
}) {
  const idleSource = IDLE_VIDEO_SOURCES[mood];
  const speakingSource = SPEAKING_VIDEO_SOURCES[mood];
  const settleSource = SETTLE_LOOP_VIDEO_SOURCES[mood];
  const crossfade = useRef(new Animated.Value(0)).current;

  // Idle clip runs once, not on a loop -- "the graphic" (gaze upward,
  // "smiling at the Father") is meant to read as a single pleasant
  // moment, not a repeating loop. Once it ends, hands off to the short
  // settle loop below (if this mood has one) instead of freezing dead
  // still. Resets when the source itself changes (e.g. mood left and
  // came back), so it plays through once each time this mood is
  // (re)entered.
  const [idleEnded, setIdleEnded] = useState(false);
  const idlePlayer = useVideoPlayer(idleSource, (player) => {
    player.loop = false;
    player.muted = true;
    // Slow motion, on request -- reads as calmer and more contemplative
    // for a single gaze-upward "smiling at the Father" moment than
    // real-time speed did. Muted already, so there's no pitch-shifted
    // audio artifact to worry about from the slower rate.
    player.playbackRate = 0.4;
  });
  const speakingPlayer = useVideoPlayer(speakingSource, (player) => {
    player.loop = true;
    player.muted = true;
  });
  // Loops indefinitely for the rest of the chat session once it takes
  // over -- "loop it all the way thru the chat" -- so the final pose
  // keeps a little life in it (wind/subtle motion through his hair)
  // instead of ever going dead-still. Same slow playbackRate as the
  // idle clip so handing off between them doesn't read as a sudden
  // speed change.
  const settlePlayer = useVideoPlayer(settleSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.playbackRate = 0.4;
  });

  useEffect(() => {
    // Does NOT call idlePlayer.play() here -- the isSpeaking effect below
    // also runs on mount (isSpeaking/idleEnded both start false) and hits
    // its own idlePlayer.play() call in the `!idleEnded` branch. Two
    // play() calls fired back-to-back like that made the native player
    // restart from frame 0 partway in, which is what read as "the clip
    // plays twice." Resetting state here and letting that other effect be
    // the single place that actually starts playback fixes it.
    setIdleEnded(false);
    settlePlayer.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleSource, idlePlayer]);

  // Skips the very first render (the mount effect above already starts
  // it) and re-runs only when the caller explicitly asks for a replay.
  const isFirstReplay = useRef(true);
  useEffect(() => {
    if (isFirstReplay.current) {
      isFirstReplay.current = false;
      return;
    }
    settlePlayer.pause();
    idlePlayer.replay();
    idlePlayer.play();
    setIdleEnded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey]);

  useEffect(() => {
    const subscription = idlePlayer.addListener('playToEnd', () => {
      // Explicit pause() on top of loop=false -- some players reset to
      // frame 0 on end rather than just stopping, which would show as a
      // visible jump back to the start instead of freezing on the last
      // frame.
      idlePlayer.pause();
      setIdleEnded(true);
      if (settleSource) {
        // The settle loop's own first frame is EXACTLY the idle clip's
        // last frame (see AVATAR_SETTLE_LOOP_ASSETS's comment), so
        // starting it here is a hard cut with no visible seam.
        settlePlayer.play();
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idlePlayer]);

  useEffect(() => {
    Animated.timing(crossfade, {
      toValue: isSpeaking ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isSpeaking, crossfade]);

  useEffect(() => {
    if (isSpeaking && speakingSource) {
      speakingPlayer.play();
      idlePlayer.pause();
      settlePlayer.pause();
    } else if (!idleEnded) {
      idlePlayer.play();
      speakingPlayer.pause();
    } else {
      speakingPlayer.pause();
      if (settleSource) settlePlayer.play();
    }
  }, [isSpeaking, speakingSource, settleSource, idleEnded, idlePlayer, speakingPlayer, settlePlayer]);

  if (!idleSource) return null;

  // overflow:'hidden' set here too, not just on the ancestor View that
  // wraps this whole layer -- native video surfaces (VideoView is a
  // native view, not pure JS-rendered) are known to sometimes ignore an
  // ancestor's clipping and render past rounded corners unless the clip
  // is on the same view as the video content itself.
  const dimStyle = { width: displayWidth, height: displayHeight, borderRadius: displayRadius, overflow: 'hidden' as const };

  return (
    <View style={dimStyle}>
      {/* Plain color backdrop while the video's first frame decodes --
          no longer the static smiling photo (removed on request: its
          direct-gaze framing visibly conflicted with the video's own
          upward gaze for a beat right as the video took over on open). */}
      <View style={[StyleSheet.absoluteFill, dimStyle, { backgroundColor: Colors.royal }]} />
      <VideoView
        player={idlePlayer}
        style={[StyleSheet.absoluteFill, dimStyle]}
        contentFit="cover"
        nativeControls={false}
      />
      {idleEnded && settleSource && (
        // Sits directly on top of idlePlayer's frozen last frame once
        // mounted -- their first/frozen frames are pixel-identical (see
        // AVATAR_SETTLE_LOOP_ASSETS's comment), so no crossfade is
        // needed for this to read as one continuous shot.
        <VideoView
          player={settlePlayer}
          style={[StyleSheet.absoluteFill, dimStyle]}
          contentFit="cover"
          nativeControls={false}
        />
      )}
      {speakingSource && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: crossfade }]}>
          <VideoView
            player={speakingPlayer}
            style={[StyleSheet.absoluteFill, dimStyle]}
            contentFit="cover"
            nativeControls={false}
          />
        </Animated.View>
      )}
    </View>
  );
}

// Visual state machine for the Jesus avatar in chat, per spec section 4:
// tears welling for deep pain, head-thrown-back laughter for silly
// questions, and a fade-out for abusive sessions or session end -- plus
// the hybrid lip-sync/expression-blending layers described above.
//
// NOTE: until real clips exist, AvatarVideoLayer renders nothing and
// this falls back to one of two static portraits (see MOOD_PORTRAIT
// above -- AI-generated images the project owner picked) dressed up with
// a distinct badge per mood. No ring/border or glow around the frame --
// he simply appears from the glory cloud, nothing framing the photo
// itself. constants/appearance.ts's PHYSICAL_DESCRIPTION was rewritten
// to match the primary (serious) portrait, so text and visual are in
// sync -- see that file's own note. Both images' provenance (an AI
// image generator) means usage-rights terms are still worth confirming
// before this goes further than local testing/placeholder use. The
// appearance description still drives the accessibility label below so
// screen reader users get the documented portrayal either way.
type MoodStyle = {
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  badgeColor?: string;
  badgePosition?: 'top' | 'bottom';
};

const MOOD_STYLES: Record<JesusMood, MoodStyle> = {
  // Calm, attentive, at rest -- no badge.
  neutral: {},
  // The smile speaks for itself in the photo -- no badge needed.
  warm: {},
  // Eyes welling, composure steady -- a single water-drop.
  tearful: { badgeIcon: 'water', badgeColor: '#7FB3E8', badgePosition: 'bottom' },
  // Unguarded delight -- a small joy badge.
  laughing: { badgeIcon: 'happy', badgeColor: Colors.gold, badgePosition: 'top' },
  // Heavier than tearful -- rain rather than a single drop.
  grieved: { badgeIcon: 'rainy', badgeColor: '#8FA3C4', badgePosition: 'bottom' },
  // Withdrawing -- no badge; the opacity fade carries this state.
  fadingOut: {},
};

const JesusAvatar = forwardRef<JesusAvatarHandle, Props>(function JesusAvatar(
  { mood, size = 72, shape = 'circle', onFadeComplete, speaking: speakingProp },
  ref
) {
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  useImperativeHandle(
    ref,
    () => ({
      startSpeaking: () => setInternalSpeaking(true),
      stopSpeaking: () => setInternalSpeaking(false),
      replayIdle: () => setReplayKey((k) => k + 1),
    }),
    []
  );

  // Controlled props win if supplied; otherwise the ref API drives them.
  // A withdrawing/fading presence shouldn't also read as actively talking.
  const rawSpeaking = speakingProp ?? internalSpeaking;
  const isSpeaking = rawSpeaking && mood !== 'fadingOut';
  const avatarState: 'idle' | 'speaking' = isSpeaking ? 'speaking' : 'idle';

  const opacity = useRef(new Animated.Value(1)).current;
  const laughTilt = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const speakingOpacity = useRef(new Animated.Value(0)).current;
  const speakingPulse = useRef(new Animated.Value(1)).current;
  const blink = useAutoBlink();
  const cloudDrift = useDriftingClouds();

  const style = MOOD_STYLES[mood];
  // Always the warm clip as the baseline idle presence, regardless of
  // the actual conversational mood -- on request, since the mood-specific
  // static photos were only ever meant to stand in for a future
  // per-mood talking-head video that was never built (see the top of
  // this file's HONESTY NOTE). Mood still drives the badge icon,
  // accessibility label, laugh tilt, and fade-out below -- just not
  // which photo/video is on screen.
  const hasVideo = IDLE_VIDEO_SOURCES.warm !== null;
  const hasTalkingClip = SPEAKING_VIDEO_SOURCES.warm !== null;
  // Speaking badge is the "no dedicated talking clip yet" fallback --
  // once one exists for a mood, AvatarVideoLayer's cross-fade replaces it.
  const showSpeakingBadge = isSpeaking && !hasTalkingClip;

  // Gentle opacity pulse while speaking -- opacity-only, so it's safe to
  // run entirely on the native driver (see the crash this replaced,
  // explained where the badge renders below).
  useEffect(() => {
    if (!showSpeakingBadge) {
      speakingPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(speakingPulse, { toValue: 0.5, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(speakingPulse, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [showSpeakingBadge, speakingPulse]);

  useEffect(() => {
    if (mood === 'fadingOut') {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFadeComplete?.();
      });
    } else {
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [mood, opacity, onFadeComplete]);

  useEffect(() => {
    if (mood === 'laughing') {
      Animated.sequence([
        Animated.timing(laughTilt, { toValue: -1, duration: 180, useNativeDriver: true }),
        Animated.spring(laughTilt, { toValue: 0, friction: 3, useNativeDriver: true }),
      ]).start();
    }
  }, [mood, laughTilt]);

  // Cross-fade the mood badge in on change instead of popping it in
  // instantly, so switching moods feels like one continuous presence.
  useEffect(() => {
    badgeOpacity.setValue(0);
    Animated.timing(badgeOpacity, {
      toValue: 1,
      duration: 350,
      delay: 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mood, badgeOpacity]);

  // Speaking badge fades in/out around the idle presentation -- smooth
  // enter/exit of the speaking state, without touching the mood badge.
  useEffect(() => {
    Animated.timing(speakingOpacity, {
      toValue: showSpeakingBadge ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showSpeakingBadge, speakingOpacity]);

  // Laugh tilt is a deliberate one-off spring triggered by a mood change
  // (see the effect above), not a continuous idle loop -- kept. Every
  // other continuous idle motion (breathing scale, micro-jitter, head
  // tilt/shift) was removed on request: once he appears, he stays
  // completely still except for the speaking badge's pulse. "Alive" now
  // comes entirely from switching between the mood photos themselves,
  // not from animating one photo.
  const rotate = laughTilt.interpolate({ inputRange: [-1, 0], outputRange: ['-8deg', '0deg'] });
  const composedOpacity = Animated.multiply(opacity, blink);

  // Always warm's own portrait/aspect now too, matching hasVideo above --
  // the displayed content is always the warm video, so the frame should
  // always be sized to ITS aspect ratio rather than whichever mood's
  // static photo would have shown under the old per-mood system.
  const portrait = MOOD_PORTRAIT.warm;
  const displayWidth = size;
  const displayHeight = shape === 'portrait' ? size * portrait.aspect : size;
  const displayRadius = shape === 'portrait' ? Math.min(28, size * 0.06) : size / 2;
  // Reserves the same outer footprint for every mood's photo (the
  // tallest of the four aspect ratios -- currently TEARFUL_PORTRAIT's),
  // so switching moods mid-conversation swaps the photo in place rather
  // than resizing/recentering the whole avatar block and everything
  // anchored around it (entrance glow, subtitle text below). Each
  // photo's own displayHeight above is unchanged -- this only adds
  // vertically-centered slack around the shorter photos.
  const frameHeight = shape === 'portrait' ? size * MAX_PORTRAIT_ASPECT : size;
  const cloudTranslateX = cloudDrift.primary.interpolate({ inputRange: [0, 1], outputRange: [0, -displayWidth] });
  const cloudTranslateX2 = cloudDrift.secondary.interpolate({ inputRange: [0, 1], outputRange: [0, -displayWidth] });
  const cloudBobY = cloudDrift.bob.interpolate({
    inputRange: [0, 1],
    outputRange: [-displayHeight * 0.025, displayHeight * 0.025],
  });

  return (
    <Animated.View
      style={{
        opacity: composedOpacity,
        transform: [{ rotate }],
        width: displayWidth,
        height: frameHeight,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={[
          styles.wrap,
          {
            width: displayWidth,
            height: displayHeight,
            borderRadius: displayRadius,
          },
        ]}
        accessibilityLabel={`Jesus. ${MOOD_APPEARANCE_NOTES[mood]}${isSpeaking ? ' Speaking.' : ''}`}
        // avatarState exists for readability/future debugging (e.g. a dev
        // overlay) -- the actual behavior above is driven by isSpeaking.
        accessibilityHint={__DEV__ ? avatarState : undefined}
      >
        {/* Clipped separately from `wrap` above (which stays
            overflow:'visible' so the badges below, positioned slightly
            outside the frame, aren't cut off) -- this inner view clips
            both the portrait and the drifting cloud layer to the
            portrait's own rounded rect. */}
        <View style={{ width: displayWidth, height: displayHeight, borderRadius: displayRadius, overflow: 'hidden' }}>
          {hasVideo ? (
            <AvatarVideoLayer
              mood="warm"
              isSpeaking={isSpeaking}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
              displayRadius={displayRadius}
              replayKey={replayKey}
            />
          ) : (
            <Image
              source={portrait.source}
              style={{ width: displayWidth, height: displayHeight, borderRadius: displayRadius }}
              resizeMode="cover"
            />
          )}
          {/* Slow, layered waves of cloud drifting over him -- as if
              arriving from heaven -- see useDriftingClouds above. Two
              depths (farther/dimmer behind, nearer/brighter in front),
              each its own pair of identical gradient bands sliding left
              on an infinite loop at a different speed, plus a shared
              gentle vertical sway so the whole veil undulates rather
              than sliding in a flat line. Kept low-opacity so it reads
              as a veil, not fog obscuring him. pointerEvents="none" so
              it never intercepts taps meant for whatever's
              behind/around the avatar. */}
          <Animated.View
            pointerEvents="none"
            renderToHardwareTextureAndroid
            needsOffscreenAlphaCompositing
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: displayWidth * 2,
              height: displayHeight,
              flexDirection: 'row',
              transform: [{ translateX: cloudTranslateX2 }, { translateY: cloudBobY }],
            }}
          >
            {[0, 1].map((i) => (
              <LinearGradient
                key={i}
                colors={['transparent', 'rgba(255,255,255,0.12)', 'rgba(255,243,196,0.08)', 'transparent']}
                locations={[0, 0.4, 0.6, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: displayWidth, height: displayHeight }}
              />
            ))}
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            // Forces this view onto its own hardware layer on Android
            // instead of being redrawn from its Skia-based LinearGradient
            // children on every native-driver transform frame -- without
            // it, gradients under a translateX/opacity Animated transform
            // can flash/flicker each frame on Android instead of just
            // sliding smoothly. needsOffscreenAlphaCompositing is the
            // iOS-side counterpart for correct alpha blending of the same
            // layered gradients.
            renderToHardwareTextureAndroid
            needsOffscreenAlphaCompositing
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: displayWidth * 2,
              height: displayHeight,
              flexDirection: 'row',
              transform: [{ translateX: cloudTranslateX }, { translateY: cloudBobY }],
            }}
          >
            {[0, 1].map((i) => (
              <LinearGradient
                key={i}
                colors={['transparent', 'rgba(255,255,255,0.22)', 'rgba(255,243,196,0.16)', 'transparent']}
                locations={[0, 0.35, 0.65, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: displayWidth, height: displayHeight }}
              />
            ))}
          </Animated.View>
        </View>
        {style.badgeIcon && (
          <Animated.View
            style={[
              style.badgePosition === 'top' ? styles.badgeTop : styles.badgeBottom,
              { opacity: badgeOpacity },
            ]}
          >
            <Ionicons name={style.badgeIcon} size={size * 0.22} color={style.badgeColor} />
          </Animated.View>
        )}
        {/* Speaking indicator -- deliberately off the face. An earlier
            version tried to fake a mouth opening/closing directly on the
            lips; it read as distorting his face rather than as speech
            (see the HONESTY NOTE at the top of this file), so this signals
            "he's talking" the same way the mood badges above signal a mood:
            a small icon badge, not an attempt to animate the photo itself.
            Bottom-left, opposite the mood badges (bottom/top-right), so
            the two never overlap. speakingOpacity (fade in/out entering
            and leaving the speaking state) and speakingPulse (a gentle
            breathing pulse while active) are both opacity-only and both
            native-driven, so multiplying them is safe -- unlike the old
            crash, nothing here mixes a native-driven value with a
            non-native-drivable style property on the same view. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.speakingBadge, { opacity: Animated.multiply(speakingOpacity, speakingPulse) }]}
        >
          <Ionicons name="chatbubble-ellipses" size={size * 0.22} color={Colors.goldLight} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

export default JesusAvatar;

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
  },
  badgeBottom: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 2,
  },
  badgeTop: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 2,
  },
  speakingBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: 'rgba(20, 12, 8, 0.55)',
    borderRadius: 20,
    padding: 4,
  },
});
