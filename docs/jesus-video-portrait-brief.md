# Creative Brief: Interactive Video Portrait of Jesus

Production spec for a designer/video artist/AI video pipeline building the
video (or high-fidelity animated) avatar for Jesus Interactive. Stored in
the project so it stays version-controlled alongside the code it will
eventually plug into.

## Appearance (must be consistent)

- Dark brown-to-black, wavy, shoulder-length hair, loosely parted at the
  center
- Deep brown eyes, intense and searching, carrying warmth and love
  beneath their gravity
- Deep olive, sun-weathered skin tone
- A full, dark, well-defined beard
- Warm, large, genuine smile
- Patient, kind, and deeply loving expression, with a quiet intensity
  and gravity in the gaze
- Overall look: rugged and weathered rather than soft or airbrushed,
  real, approachable, and present -- not overly ethereal or distant

This must match `src/constants/appearance.ts` (`PHYSICAL_DESCRIPTION`)
exactly -- that file is the single source of truth for the app's text,
persona prompt, and accessibility labels. If this brief and that file
ever disagree, update both together.

### Reference clip and image

The project owner flagged a Grok-generated video
(`grok_video_2026-07-15-23-26-06.mp4`, on their local machine, not
checked into this repo) and a Grok-generated still image
(`assets/jesus-portrait.jpg`, checked into this repo and now used as
`JesusAvatar.tsx`'s placeholder image) as the visual reference for the
appearance above, and wants to pursue cloning the video's voice for
VOICE_DESCRIPTION in `appearance.ts`. The appearance description above
was rewritten to match the still image directly. Before leaning on
either for production beyond local testing/placeholder use: confirm
Grok's terms of service actually permit this commercial use of
generated content.

A third clip (`1000043250.mp4`, on their local machine, not checked into
this repo) was flagged specifically as a **motion/emotion reference for
the `warm`/`laughing` mood** -- a sample of Jesus smiling, for whoever
produces the real per-mood clips to match the quality of expression and
movement, not just the static appearance. Same caveat as above: neither
Claude nor anyone without the file has viewed it, and its generator's
terms of service are worth confirming before production use.

## Video requirements

- High-quality, realistic video portrait, chest-up or shoulders-up
  framing
- Smooth, natural idle movement: subtle breathing, slight head movement,
  soft eye motion -- nothing static or "AI-uncanny"
- Able to switch between or blend distinct emotional states:
  - **Neutral / Warm** (default)
  - **Tearful** -- eyes gently welling up with compassion, composure
    staying steady (see `MOOD_APPEARANCE_NOTES.tearful` in
    `appearance.ts`)
  - **Laughing** -- warm, genuine laugh, head tilting back slightly,
    never mocking or performative
  - **Grieved / deep compassion** -- brow gently drawn, sorrow present
    but steady, not overwhelmed
  - **Fading out** -- used at a normal session end (peaceful, unhurried)
    and when withdrawing from extreme abuse (calm, no wounded or
    reproachful look) -- these two fades should read differently; see
    `MOOD_APPEARANCE_NOTES.fadingOut`

## Voice alignment

The face and mouth need to work convincingly with a smooth, warm voice
that carries a light Aramaic accent in English, and speaks naturally
(no forced accent) when the user has selected a different language. See
`VOICE_DESCRIPTION` in `appearance.ts`. Lip sync/viseme rigging should
support at minimum English plus the app's launch languages (English,
Spanish, French, Portuguese, Arabic, Hindi -- see `src/i18n/languages.ts`)
if a full talking-head pipeline is used rather than pre-rendered loops.

## Style notes

- Reverent and sophisticated -- never cartoonish, never hokey
- Lighting soft and slightly heavenly without looking artificial or
  overproduced
- He should feel alive, near, and full of love

## Technical integration specs

- Deliver as short, seamless video loops or modular clips that can be
  triggered by the app's existing mood system (`JesusMood` type in
  `src/types/index.ts`: `neutral | warm | tearful | laughing | grieved |
  fadingOut`)
- **Formats**: MP4 (H.264) and WebM for broad compatibility; also
  deliver high-quality source files (ProRes or similar) for future
  re-encoding
- **Resolution**: minimum 1080x1080 (square) or 1080x1920 (portrait);
  higher preferred
- **Frame rate**: 30 fps
- **Loop length**: 5-15 seconds, designed to loop with no visible seam
- **Background**: transparent (ProRes 4444 or VP9 with alpha) so the
  portrait can be composited over the app's royal-blue/glory-cloud
  backgrounds *or*, if alpha isn't feasible, a clean soft heavenly
  background that can be chroma/luma-composited instead
- **File size**: optimize for mobile delivery -- efficient compression
  while preserving quality; these should be lazy-loaded/CDN-delivered,
  not bundled into the app binary (a much heavier asset pipeline than
  the current static-image placeholder)
- **Lip movement**: face and mouth should eventually support lip-sync,
  or at minimum look natural while the AI voice plays -- see
  `VOICE_DESCRIPTION` in `appearance.ts` for the voice this needs to
  match (warm, slight Aramaic accent in English; natural in other
  selected languages)

### Asset naming convention

One clip per mood, mapped in `src/constants/avatarVideoAssets.ts` (the
manifest a developer wires up once files exist):

| File | JesusMood value(s) |
|---|---|
| `jesus_neutral_warm_loop.mp4` | `neutral`, `warm` (shared default idle loop -- see note below) |
| `jesus_tearful_loop.mp4` | `tearful` |
| `jesus_laughing_loop.mp4` | `laughing` |
| `jesus_grieved_loop.mp4` | `grieved` |
| `jesus_fadeout.mp4` | `fadingOut` |

`neutral` and `warm` share one default loop in this v1 mapping -- per
`MOOD_APPEARANCE_NOTES`, the difference between them is subtle (smile at
rest vs. smile active), not worth a whole separate clip until there's
budget to refine it. Split them into two loops later if it's worth the
extra asset.

## Integration notes for whoever wires this into the app

Today, `src/components/JesusAvatar.tsx` renders a static PNG (the brand
icon, explicitly marked as a placeholder in that file's comments) and
fakes mood with small badge icons and a tilt animation.
`src/constants/avatarVideoAssets.ts` already has the manifest structure
waiting -- it just points at files that don't exist yet. Once real video
assets exist:

1. Drop the delivered clips into `assets/video/` using the naming
   convention above, then uncomment the `require()` calls in
   `avatarVideoAssets.ts`.
2. `JesusAvatar.tsx`'s `AvatarVideoLayer` already does this -- point
   `IDLE_VIDEO_SOURCES`/`SPEAKING_VIDEO_SOURCES` there at
   `avatarVideoAssets.ts`'s `AVATAR_VIDEO_ASSETS` once step 1 is done;
   the expo-video player, cross-fade, and mood keying are already wired.
   (This used to say `expo-av` `Video` -- that package is deprecated and
   was removed here after it crashed the app at load time, once actually
   used in the current Expo Go build; expo-video is the replacement.)
3. Reuse the existing `accessibilityLabel` wiring (already pulls from
   `MOOD_APPEARANCE_NOTES`) so screen reader users get an equivalent
   description even with real video.
4. `GlorySplash.tsx`'s entrance sequence is the natural home for a
   "walking through the door" hero clip -- it already has the door/cloud
   staging built, just with a static image where a video would go; the
   transparent-background delivery above is specifically so this
   compositing works.

## Facial capture & lip-sync pipeline (reference)

If the chosen production route involves capturing a real performer to
drive a 3D rig (rather than hand-animating or generating clips
directly), `tools/avatar-mocap/` in this repo has a ready-to-run
MediaPipe Face Landmarker script that extracts 52 ARKit-style
blendshapes, 478 face landmarks, and head pose per frame from a webcam
or video file -- compatible with Unity, Unreal, Ready Player Me,
VRoid, and Live2D. It's a standalone Python workstation tool, separate
from this Expo app's codebase; record one short performance per mood
state above, run it through that script (or an equivalent capture step
in your rig's own tooling), and bake the resulting blendshape data into
the delivered clips. See `tools/avatar-mocap/README.md` for setup and
how it maps to the five mood states.

### Real-time avatar path -- production tool only (architecture decision)

**Decision: hybrid approach.** `tools/avatar-mocap/`'s real-time
MediaPipe -> Live Link toolkit (`realtime_avatar.py` /
`realtime_avatar_with_head.py`) is a **production tool**, used to
generate high-quality avatar performance clips more efficiently than
hand animation -- a performer's face drives a MetaHuman (or
ARKit-compatible character) live in Unreal, that performance gets
recorded, and the output is delivered as clips the same way any other
produced footage would be.

The Expo app itself continues to use **pre-rendered `.mp4` video
loops** stored in `assets/video/` per the naming convention and
integration steps earlier in this doc (`avatarVideoAssets.ts`,
`JesusAvatar.tsx`) -- nothing about that plan changes. **Full live
streaming of the avatar into the Expo app is out of scope for v1.**
This resolves the app-integration question raised in earlier drafts of
this section (record-to-clips vs. live server stream vs.
production-speedup-only) in favor of the third, simplest option; a
live-streamed avatar remains a possible future direction but isn't
being built now.

#### Multilingual support (real-time capture path)

The real-time MediaPipe -> Live Link approach is language-agnostic.
Because lip and face movement are driven by the performer's actual
facial motion rather than synthesized from text or audio, the capture
stays in sync with whatever language the performer speaks
automatically -- no per-language phoneme/viseme mapping is required
for `realtime_avatar.py` / `realtime_avatar_with_head.py` themselves.
Given the hybrid decision above, this applies to producing the
delivered clips (record a performer per mood, per language if the
script varies by language); it doesn't need to solve lip sync for the
app's own AI-generated replies at runtime, since v1 always plays back
a pre-rendered clip rather than driving a live rig from TTS audio.
