// Our own chrome wrapped around YouTube's official embed player --
// title/channel header we control, a 16:9 WebView underneath loading
// https://www.youtube.com/embed/<id>. The video itself, its controls,
// and any pre-roll ad are entirely YouTube's -- there is no legitimate
// way to embed a YouTube video and strip its ads, and this deliberately
// doesn't try to (see newsBriefVideoSources.js's own comment).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Colors from '../theme/colors';

export default function YouTubePlayer({
  videoId,
  title,
  channelName,
  big,
}: {
  videoId: string;
  title: string;
  channelName: string;
  // Hero treatment for NewsWatchScreen's full-bleed top player -- no
  // rounded corners (it runs edge to edge) and larger caption type.
  big?: boolean;
}) {
  return (
    <View style={[styles.wrap, big && styles.wrapBig]}>
      <View style={styles.player}>
        <WebView
          source={{ uri: `https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0` }}
          style={StyleSheet.absoluteFill}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
      <View style={[styles.captionRow, big && styles.captionRowBig]}>
        <Text style={[styles.title, big && styles.titleBig]} numberOfLines={2}>{title}</Text>
        <Text style={styles.channel}>{channelName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: Colors.royalLight, borderRadius: 14, overflow: 'hidden' },
  wrapBig: { borderRadius: 0 },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  captionRow: { padding: 12 },
  captionRowBig: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 14.5, fontWeight: '700', color: Colors.ivory, lineHeight: 20 },
  titleBig: { fontSize: 18, lineHeight: 24 },
  channel: { fontSize: 12, fontWeight: '700', color: Colors.gold, marginTop: 4 },
});
