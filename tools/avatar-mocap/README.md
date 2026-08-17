# Avatar facial mocap / lip-sync capture (production tool, not app code)

Standalone Python tool using MediaPipe Face Landmarker to capture 52
ARKit-style facial blendshapes + head pose in real time from a webcam
or video file. For whoever produces the Jesus avatar assets described
in `../../docs/jesus-video-portrait-brief.md` -- either to drive a 3D
rig that gets rendered out to the video loops that brief specs, or as
the front end of a future real-time avatar.

**This does not run inside the Expo/React Native app.** There's no
Python runtime on mobile; this is a separate workstation tool that
feeds the content pipeline, not the app itself.

## Setup

```bash
cd tools/avatar-mocap
pip install -r requirements.txt --break-system-packages   # or use a venv
wget -O face_landmarker_v2_with_blendshapes.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
python face_landmarker_capture.py
```

Press `q` to quit the preview window.

## What it outputs

- **478 face landmarks** (3D mesh points)
- **52 ARKit blendshapes** (`jawOpen`, `mouthSmileLeft/Right`, etc.) --
  compatible with Unity, Unreal, Ready Player Me, VRoid, and Live2D
  morph/parameter systems
- **4x4 head-pose transformation matrix** (rotation + translation)

`LIP_SYNC_BLENDSHAPES` in the script isolates the ~23 shapes that
matter most for mouth/lip animation; `jawOpen` alone is often enough
for a simple lip-sync driver if the target rig doesn't support full
ARKit blendshapes.

## How this maps to the app's mood system

The five capture states in `jesus-video-portrait-brief.md`
(neutral/warm, tearful, laughing, grieved, fading out --
`MOOD_APPEARANCE_NOTES` in `src/constants/appearance.ts`) are
performance directions for an actor or animator, not something this
script infers automatically. Record one short loop per mood, run each
through this tool (or the equivalent in your rig's own capture step)
to get the blendshape/landmark data, then bake that into the
delivered clips per the brief's naming convention
(`jesus_neutral_warm_loop.mp4`, etc.) in `assets/video/`.

## Extending

`apply_to_avatar()` at the bottom of the script is a stub showing where
per-engine wiring goes (Unity `SetBlendShapeWeight`, Unreal morph
targets, Three.js `morphTargetInfluences`, Live2D parameters). Fill
that in once you've picked the rig/engine that will actually render
the deliverables -- it's intentionally left as a stub here since that
choice depends on the video pipeline, not on this app's codebase.

## Real-time avatar (chosen path: MediaPipe -> PyLiveLinkFace -> Unreal MetaHuman)

**`realtime_avatar.py` is the recommended/active script for this
project's chosen direction:** it streams the full 52 ARKit blendshapes
from a webcam performer to Unreal Engine using the official Live Link
Face protocol (via `pylivelinkface`), so a MetaHuman or any
ARKit-compatible character moves in real time exactly as if the data
were coming from Apple's iPhone Live Link Face app.

```bash
pip install -r requirements.txt   # includes pylivelinkface
wget -O face_landmarker_v2_with_blendshapes.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
python realtime_avatar.py
```

**Unreal Engine setup:**
1. Enable plugins: **Live Link**, **Apple ARKit**, **Apple ARKit Face
   Support**
2. `Window -> Live Link` -- a source should appear once the script is
   running and sending packets
3. On the MetaHuman (or ARKit character): set the Face component's
   Live Link subject to the one from the script, and confirm the
   Animation Blueprint uses Live Link Pose

Not yet built (ask if you want these added): head-rotation streaming,
jitter smoothing/filtering, and setup notes for a non-MetaHuman
character rig.

**Architecture decision: this is a production tool, not a live
in-app rendering path.** The Expo app continues to use pre-rendered
`.mp4` loops from `assets/video/` (`avatarVideoAssets.ts`,
`JesusAvatar.tsx`) -- that plan is unchanged. This real-time toolkit's
job is to help *produce* those clips faster/better (a performer drives
a MetaHuman live, the performance gets recorded, the recording becomes
a delivered clip) rather than to stream Unreal's live render into the
app. Full live streaming of the avatar into the Expo app is explicitly
out of scope for v1. See the "Real-time avatar path" section in the
brief for the full decision.

`blendshape_streamer.py` (generic UDP JSON / OSC, no Unreal-specific
protocol) is kept as a fallback for Unity, Blender/FACE-It, or any
other engine instead of Unreal.

### Head rotation, jitter smoothing, and Blender rigging (complete real-time path)

`realtime_avatar_with_head.py` is the complete, recommended script for
this project's real-time-avatar direction. It's a superset of
`realtime_avatar.py`:

- **Head rotation:** Yaw/Pitch/Roll extracted from MediaPipe's
  transformation matrix, mapped onto Live Link's
  `HeadYaw`/`HeadPitch`/`HeadRoll`. Tune `HEAD_ROTATION_SCALE` at the
  top if motion reads too weak/strong; flip a sign in
  `matrix_to_euler()` if an axis comes in inverted for your rig.
- **Jitter smoothing:** every blendshape and head-rotation value is
  run through an exponential-moving-average filter (`smooth()`)
  before being sent, since raw per-frame MediaPipe output is noisy
  enough to read as a twitchy rig otherwise. Tune `SMOOTHING_FACTOR`
  (0-1): lower = smoother but laggier, higher = snappier but more
  jitter -- 0.5 is a reasonable starting point.

Rigging in Blender, for a non-MetaHuman/non-Unreal target (two
options):

- **Easiest:** use an existing Live-Link-Face-protocol receiver addon
  (e.g. `blender_livelinkface` by Nick Fisher, or a "LiveLinkFace
  ARKit Receiver" addon) -- it reads the same UDP packets this script
  sends and drives shape keys + head bones automatically.
- **Manual:** create 52 shape keys named exactly per the ARKit names
  in `BLENDSHAPE_MAP`, add three custom properties on the head
  bone/armature (`HeadPitch`, `HeadYaw`, `HeadRoll`), and add drivers
  on the head bone's rotation channels reading those properties
  (-1..1 mapped to roughly ±30-45 degrees is a reasonable start).

**Eye rotation** is also streamed: `LeftEyeYaw`/`LeftEyePitch`/`LeftEyeRoll`
and `RightEyeYaw`/`RightEyePitch`/`RightEyeRoll`, derived from
MediaPipe's directional eye-look blendshapes (MediaPipe doesn't give a
per-eye transformation matrix the way it does for the head, so yaw/pitch
come from out-minus-in and up-minus-down on each eye; roll isn't
estimated and is sent as 0). Tune `EYE_ROTATION_SCALE` the same way as
`HEAD_ROTATION_SCALE`. The script resolves the Live Link enum member
names once at startup and prints a warning for any that don't match
your installed `pylivelinkface` version, rather than failing silently
or crashing mid-stream -- this repo hasn't run the package to confirm
the exact member names, so check that warning on first run.

### Multilingual support

The real-time MediaPipe -> Live Link approach is language-agnostic.
Because lip and face movement are driven by the performer's actual
facial motion rather than synthesized from text or audio, the avatar
stays in sync with whatever language the performer speaks
automatically -- no language-specific phoneme/viseme mapping is
required for `realtime_avatar.py` / `realtime_avatar_with_head.py`.

Given the production-tool decision above, this covers producing the
delivered clips (record a performer per mood, per language as needed);
it doesn't need to separately solve lip sync for the app's own
AI-generated replies at runtime, since v1 always plays back a
pre-rendered clip rather than driving a live rig from TTS audio. See
`jesus-video-portrait-brief.md`'s "Voice alignment" section for how
the app's per-language voice output is handled.

## Choosing a lip-sync approach

| Use case | Tool | Notes |
|---|---|---|
| Real-time avatar / VTuber | `blendshape_streamer.py` (MediaPipe) | Live webcam -> Unity/Unreal/Blender |
| High-quality offline dubbing onto existing video | [LatentSync](https://github.com/bytedance/LatentSync) | Diffusion-based, strongest open-source quality; ~18 GB VRAM (1.6) or use 1.5 for 8-12 GB. Not vendored here -- it's a large separate repo/checkpoint set; clone it independently if you go this route. |
| Fast preview / low VRAM | Wav2Lip or MuseTalk | Quicker, lower quality |

For this project's current plan (pre-rendered per-mood video loops,
not a live talking-head), LatentSync-style offline dubbing is the more
likely fit if the delivered clips ever need audio-driven lip sync
beyond what an animator hand-keys -- feed it a silent idle-loop video
plus the narration audio per mood, run it once per clip, and drop the
output into `assets/video/` per the naming convention above.
