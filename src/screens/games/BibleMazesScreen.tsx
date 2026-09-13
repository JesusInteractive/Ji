// Bible Mazes -- game #10 on the Jesus Interactive Games Hub. One nav
// route, hub + play switched by plain useState (same "one screen, many
// views" shape TriviaScreen.tsx already uses for this hub) rather than a
// nested navigator, since a maze run doesn't need to survive
// backgrounding the way real navigation state does.
//
// Every "gate" between rooms is a tap-a-multiple-choice-answer
// checkpoint -- not a spatial maze engine -- see bibleMazes.ts's own
// comment on why (explicitly not "a 1000-maze dump").
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { BIBLE_MAZES, type BibleMaze } from '../../data/bibleMazes';

export default function BibleMazesScreen() {
  const [activeMaze, setActiveMaze] = useState<BibleMaze | null>(null);
  const [roomIndex, setRoomIndex] = useState(0);
  const [wrongOption, setWrongOption] = useState<number | null>(null);
  const [solvedRoom, setSolvedRoom] = useState(false);

  const startMaze = (maze: BibleMaze) => {
    setActiveMaze(maze);
    setRoomIndex(0);
    setWrongOption(null);
    setSolvedRoom(false);
  };

  const exitMaze = () => {
    setActiveMaze(null);
  };

  if (!activeMaze) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Bible Mazes</Text>
          <Text style={styles.subhead}>Walk a Bible story room by room. Answer correctly to unlock the next door.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {BIBLE_MAZES.map((maze) => (
            <Pressable key={maze.id} style={[styles.mazeCard, { backgroundColor: maze.color }]} onPress={() => startMaze(maze)}>
              <Ionicons name="git-network-outline" size={28} color={Colors.white} />
              <Text style={styles.mazeCardTitle}>{maze.title}</Text>
              <Text style={styles.mazeCardSubtitle}>{maze.subtitle}</Text>
              <Text style={styles.mazeCardRooms}>{maze.rooms.length} rooms</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const room = activeMaze.rooms[roomIndex];
  const isLastRoom = roomIndex === activeMaze.rooms.length - 1;
  const mazeComplete = solvedRoom && isLastRoom;

  const handleOptionPress = (index: number) => {
    if (solvedRoom) return;
    if (index === room.correctIndex) {
      setSolvedRoom(true);
      setWrongOption(null);
    } else {
      setWrongOption(index);
    }
  };

  const handleNextRoom = () => {
    setRoomIndex((i) => i + 1);
    setSolvedRoom(false);
    setWrongOption(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: activeMaze.color }]}>
        <Pressable style={styles.backRow} onPress={exitMaze}>
          <Ionicons name="chevron-back" size={18} color={Colors.white} />
          <Text style={styles.backText}>All Mazes</Text>
        </Pressable>
        <Text style={styles.title}>{activeMaze.title}</Text>
        <Text style={styles.subhead}>Room {roomIndex + 1} of {activeMaze.rooms.length}</Text>
        <View style={styles.progressRow}>
          {activeMaze.rooms.map((r, i) => (
            <View
              key={r.id}
              style={[
                styles.progressDot,
                i < roomIndex && styles.progressDotDone,
                i === roomIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.playContent} showsVerticalScrollIndicator={false}>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>{room.prompt}</Text>
        </View>

        <Text style={styles.questionText}>{room.question}</Text>

        <View style={styles.options}>
          {room.options.map((option, i) => {
            const isCorrectAnswer = solvedRoom && i === room.correctIndex;
            const isWrong = wrongOption === i;
            return (
              <Pressable
                key={option}
                style={[
                  styles.option,
                  { borderColor: activeMaze.color },
                  isCorrectAnswer && styles.optionCorrect,
                  isWrong && styles.optionWrong,
                ]}
                onPress={() => handleOptionPress(i)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {solvedRoom && (
          <View style={[styles.resultBanner, { backgroundColor: '#6FCF97' }]}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
            <Text style={styles.resultBannerText}>
              {room.reference ? `That's right -- ${room.reference}` : 'Door unlocked!'}
            </Text>
          </View>
        )}

        {solvedRoom && !mazeComplete && (
          <Pressable style={[styles.nextButton, { backgroundColor: activeMaze.color }]} onPress={handleNextRoom}>
            <Text style={styles.nextButtonText}>Next Room</Text>
          </Pressable>
        )}

        {mazeComplete && (
          <View style={styles.completeCard}>
            <Ionicons name="trophy-outline" size={32} color={activeMaze.color} />
            <Text style={styles.completeTitle}>Maze complete!</Text>
            <Pressable style={[styles.nextButton, { backgroundColor: activeMaze.color }]} onPress={exitMaze}>
              <Text style={styles.nextButtonText}>Back to Mazes</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F7FF' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.royal },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { color: Colors.white, fontWeight: '700', fontSize: 13, marginLeft: 2 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.white },
  subhead: { fontSize: 12.5, color: 'rgba(255,255,255,0.9)', marginTop: 6, lineHeight: 17 },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.35)' },
  progressDotDone: { backgroundColor: Colors.white },
  progressDotActive: { backgroundColor: Colors.white, width: 14, height: 14, borderRadius: 7 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 14,
  },
  mazeCard: {
    width: '47%', borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    padding: 16, minHeight: 160,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  mazeCardTitle: { fontSize: 15, fontWeight: '800', color: Colors.white, textAlign: 'center', marginTop: 10 },
  mazeCardSubtitle: { fontSize: 11.5, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
  mazeCardRooms: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 8, fontWeight: '700' },
  playContent: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40, paddingHorizontal: 20 },
  promptCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  promptText: { fontSize: 14.5, lineHeight: 21, color: '#1C1006', fontStyle: 'italic' },
  questionText: { fontSize: 16, fontWeight: '800', color: Colors.royal, marginTop: 18, textAlign: 'center' },
  options: { width: '100%', gap: 10, marginTop: 16 },
  option: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white, borderWidth: 2 },
  optionCorrect: { backgroundColor: '#E4F8EE', borderColor: '#6FCF97' },
  optionWrong: { backgroundColor: '#FDEAE3', borderColor: '#EF6C4D' },
  optionText: { fontSize: 14.5, fontWeight: '700', color: '#1C1006', textAlign: 'center' },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20,
  },
  resultBannerText: { color: Colors.white, fontWeight: '700', fontSize: 13.5, textAlign: 'center', flexShrink: 1 },
  nextButton: { marginTop: 18, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 32 },
  nextButtonText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  completeCard: { alignItems: 'center', marginTop: 20 },
  completeTitle: { fontSize: 18, fontWeight: '800', color: Colors.royal, marginTop: 10 },
});
