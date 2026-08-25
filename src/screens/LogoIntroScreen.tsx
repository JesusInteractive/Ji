import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';

interface Props {
  onFinish: () => void;
}

const LOGO_VIDEO = require('../../assets/video/logo-intro.mp4');

const FADE_IN_MS = 500; // the motion graphic's own fade-in, over the glow/cloud background
const FADE_OUT_MS = 550; // graceful close: dissolve video+glow+clouds to navy instead of cutting on the last frame

// The motion graphic (the "J" mark with swirling gold light, ending on
// "Jesus interactive") over a glow + drifting cloud veil, plays once
// per cold launch, before the onboarding/main navigators mount. This
// used to hold on a static logo image first, then cross-dissolve into
// the video -- removed, since the native OS splash screen (app.json's
// expo-splash-screen config, itself a static image of the same logo)
// already shows that exact static mark right before this screen even
// mounts, so the hold just repeated the same "J Interactive" branding
// twice in a row. Advances automatically when the clip ends; also
// tappable to skip, and falls back to onFinish() after a timeout if the
// video fails to load for any reason, so a broken/missing asset can
// never strand someone on this screen.
//
// The clip itself is a 544x544 square, but the screen is a tall
// portrait rectangle -- contentFit="contain" (kept, so the full logo
// and "Jesus interactive" text never get cropped) leaves plain navy
// letterbox space above/below it. The glow + drifting cloud veil behind
// the video fill that space with the same "heavenly clouds" look used
// for the glory-cloud entrance and JesusAvatar's cloud veil elsewhere,
// rather than flat empty color.
export default function LogoIntroScreen({ onFinish }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const finishedRef = useRef(false);
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const cloudDrift = useRef(new Animated.Value(0)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const player = useVideoPlayer(LOGO_VIDEO, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(glowOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(glowScale, { toValue: 1, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(cloudDrift, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();

    player.play();
    Animated.timing(videoOpacity, {
      toValue: 1,
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => {
      loop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seamless drift: two identical bands side by side, each the full
  // screen width, sliding left together -- same technique as
  // JesusAvatar.tsx's useDriftingClouds.
  const cloudTranslateX = cloudDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -screenWidth] });

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  // The clip previously cut hard from its last frame straight to the next
  // screen. Instead, once it reaches the end, dissolve the video + glow +
  // cloud veil down to the plain navy background (glowOpacity also drives
  // the cloud layer's opacity, so one fade covers both), THEN advance --
  // a graceful close instead of an abrupt stop.
  const endedRef = useRef(false);
  const fadeOutAndFinish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    player.pause();
    Animated.parallel([
      Animated.timing(videoOpacity, { toValue: 0, duration: FADE_OUT_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0, duration: FADE_OUT_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) finish();
    });
  };

  useEffect(() => {
    const subscription = player.addListener('playToEnd', fadeOutAndFinish);
    // Clip is ~6s; that + fade-out + margin is the real ceiling, so the
    // fallback needs headroom past both combined.
    const fallback = setTimeout(finish, 8000 + FADE_OUT_MS);
    return () => {
      subscription.remove();
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return (
    <TouchableWithoutFeedback onPress={finish}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
          // See JesusAvatar.tsx's drifting-cloud-veil comment -- avoids a
          // known Android flicker/redraw issue for LinearGradient content
          // riding a native-driver opacity/scale/translate transform.
          renderToHardwareTextureAndroid
          needsOffscreenAlphaCompositing
        >
          <LinearGradient
            colors={[Colors.glory, 'rgba(255,243,196,0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          renderToHardwareTextureAndroid
          needsOffscreenAlphaCompositing
          style={[
            styles.cloudLayer,
            { width: screenWidth * 2, opacity: glowOpacity, transform: [{ translateX: cloudTranslateX }] },
          ]}
        >
          {[0, 1].map((i) => (
            <LinearGradient
              key={i}
              colors={['transparent', 'rgba(255,255,255,0.14)', 'rgba(255,243,196,0.1)', 'transparent']}
              locations={[0, 0.35, 0.65, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ width: screenWidth, height: '100%' }}
            />
          ))}
        </Animated.View>
        <Animated.View style={[styles.video, { opacity: videoOpacity }]}>
          <VideoView player={player} style={styles.video} contentFit="contain" nativeControls={false} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.royalLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 620,
    height: 620,
    borderRadius: 310,
  },
  cloudLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
