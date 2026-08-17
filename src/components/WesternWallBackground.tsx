import React, { useMemo } from 'react';
import Svg, { Defs, LinearGradient, Line, Rect, Stop } from 'react-native-svg';

// A stylized but reference-accurate rendering of the Western Wall (Kotel):
// large, light meleke-limestone ashlar blocks in the lower courses -- some
// with the classic Herodian carved margin and a slightly raised central
// boss -- giving way to smaller, more numerous stones in the upper courses
// from later (Roman/Byzantine/Muslim-period) additions. Blocks are laid
// dry, in a running-bond pattern (joints staggered row to row, never
// stacked directly on top of each other), with small irregular crevices
// scattered through the joints -- the crevices where prayer notes (see
// PrayerNote.tsx) are tucked in PrayerWallScreen.
//
// Built with react-native-svg rather than approximated with plain Views so
// the joint lines, margins, and crevice cracks render crisply at any
// screen size. `npx expo install react-native-svg` if it isn't already
// linked in your native build.

export const WALL_WIDTH = 380;

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  herodian: boolean;
  fill: string;
}

interface Crack {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Deterministic PRNG (mulberry32) so the wall's stone pattern is stable
// across re-renders and app restarts instead of reshuffling every time.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LIMESTONE_TONES = ['#E9E0C9', '#E2D8BC', '#DDD1B0', '#EFE7D2', '#D8CBA9'];

function buildWall(rows: number, rand: () => number) {
  const blocks: Block[] = [];
  const cracks: Crack[] = [];
  let y = 0;

  for (let row = 0; row < rows; row++) {
    // Bottom courses = original Herodian: fewer, much larger stones.
    // Upper courses = later, smaller repairs: more, smaller stones.
    const fromBottom = rows - 1 - row;
    let baseWidth: number;
    let height: number;
    let herodianChance: number;
    if (fromBottom < 5) {
      baseWidth = 150;
      height = 72;
      herodianChance = 0.55;
    } else if (fromBottom < 10) {
      baseWidth = 105;
      height = 52;
      herodianChance = 0.2;
    } else {
      baseWidth = 62;
      height = 34;
      herodianChance = 0.05;
    }

    // Stagger the running-bond offset every other row.
    let x = row % 2 === 0 ? 0 : -(baseWidth * 0.4);
    while (x < WALL_WIDTH) {
      const w = Math.max(30, baseWidth + (rand() - 0.5) * baseWidth * 0.4);
      const fill = LIMESTONE_TONES[Math.floor(rand() * LIMESTONE_TONES.length)];
      blocks.push({
        x,
        y,
        width: Math.min(w, WALL_WIDTH - x),
        height,
        herodian: rand() < herodianChance && w > 50,
        fill,
      });

      // A crevice/crack roughly every couple of joints -- concentrated at
      // the vertical joint between this block and the next.
      if (rand() < 0.6) {
        const cx = x + w;
        const cy = y + height * (0.3 + rand() * 0.4);
        const len = 6 + rand() * 10;
        const angle = (rand() - 0.5) * 1.2;
        cracks.push({
          x1: cx - len / 2,
          y1: cy,
          x2: cx + len / 2 + Math.sin(angle) * 4,
          y2: cy + Math.cos(angle) * 4,
        });
      }

      x += w;
    }
    y += height;
  }

  return { blocks, cracks, totalHeight: y };
}

interface Props {
  rows?: number;
  seed?: number;
}

export default function WesternWallBackground({ rows = 16, seed = 1337 }: Props) {
  const { blocks, cracks, totalHeight } = useMemo(() => {
    const rand = mulberry32(seed);
    return buildWall(rows, rand);
  }, [rows, seed]);

  return (
    <Svg width="100%" height={totalHeight} viewBox={`0 0 ${WALL_WIDTH} ${totalHeight}`}>
      <Defs>
        <LinearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6EFDA" stopOpacity={1} />
          <Stop offset="1" stopColor="#C9BB98" stopOpacity={1} />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={WALL_WIDTH} height={totalHeight} fill="url(#wallShade)" />

      {blocks.map((b, i) => (
        <React.Fragment key={i}>
          <Rect
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            fill={b.fill}
            stroke="#A8987A"
            strokeWidth={1.1}
          />
          {b.herodian && (
            <Rect
              x={b.x + 6}
              y={b.y + 6}
              width={Math.max(b.width - 12, 4)}
              height={Math.max(b.height - 12, 4)}
              fill="none"
              stroke="#BDAE8A"
              strokeWidth={1}
              opacity={0.8}
            />
          )}
        </React.Fragment>
      ))}

      {cracks.map((c, i) => (
        <Line
          key={i}
          x1={c.x1}
          y1={c.y1}
          x2={c.x2}
          y2={c.y2}
          stroke="#8C7C5C"
          strokeWidth={0.8}
          opacity={0.55}
        />
      ))}
    </Svg>
  );
}

// Stable string -> 32-bit seed, so a given prayer note (by id) always
// lands in the same spot on the wall instead of jumping around on
// re-render. See PrayerNote.tsx / PrayerWallScreen.tsx.
export function hashStringToSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export { buildWall, mulberry32 };
