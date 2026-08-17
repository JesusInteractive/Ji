"""
Facial motion capture + lip-sync/expression blendshape extraction, using
MediaPipe Face Landmarker (Tasks API).

Production tool for whoever is capturing performance data to drive the
Jesus avatar (see ../../docs/jesus-video-portrait-brief.md and
../../src/constants/avatarVideoAssets.ts) -- either to drive a 3D rig
that gets rendered out to the video loops described in that brief, or as
the front end of a future real-time avatar. This is a standalone Python
tool that runs on a workstation; it is NOT part of the React
Native/Expo app itself (no Python runtime on mobile) and has no
dependency on the app code.

Outputs 52 ARKit-style blendshapes per frame plus 478 face landmarks and
a 4x4 head-pose transformation matrix -- compatible with Unity, Unreal,
Ready Player Me, VRoid, Live2D, and similar rigs.

Quick start:
    pip install -r requirements.txt
    wget -O face_landmarker_v2_with_blendshapes.task \\
      https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
    python face_landmarker_capture.py
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import time

# -------------------------------------------------
# 1. Download the model once (or put the .task file next to the script)
# -------------------------------------------------
# wget -O face_landmarker_v2_with_blendshapes.task \
#   https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
MODEL_PATH = "face_landmarker_v2_with_blendshapes.task"

# -------------------------------------------------
# 2. Initialize MediaPipe Face Landmarker
# -------------------------------------------------
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,          # or IMAGE / LIVE_STREAM
    output_face_blendshapes=True,                   # critical for lip sync & expressions
    output_facial_transformation_matrixes=True,     # head pose (rotation + translation)
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5
)
detector = vision.FaceLandmarker.create_from_options(options)

# -------------------------------------------------
# 3. Important blendshape names for Lip Sync
# -------------------------------------------------
LIP_SYNC_BLENDSHAPES = [
    "jawOpen",
    "mouthClose",
    "mouthFunnel",
    "mouthPucker",
    "mouthSmileLeft", "mouthSmileRight",
    "mouthFrownLeft", "mouthFrownRight",
    "mouthStretchLeft", "mouthStretchRight",
    "mouthLowerDownLeft", "mouthLowerDownRight",
    "mouthUpperUpLeft", "mouthUpperUpRight",
    "mouthRollLower", "mouthRollUpper",
    "mouthShrugLower", "mouthShrugUpper",
    "mouthPressLeft", "mouthPressRight",
    "mouthLeft", "mouthRight",
    "tongueOut"
]

# -------------------------------------------------
# 4. Main capture loop
# -------------------------------------------------
cap = cv2.VideoCapture(0)          # 0 = webcam, or path to video file
# cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
# cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

fps_counter = 0
start_time = time.time()

print("Press 'q' to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Convert to MediaPipe Image
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    # Run detection
    detection_result = detector.detect_for_video(mp_image, int(time.time() * 1000))

    # -------------------------------------------------
    # Facial Motion Capture + Lip Sync data
    # -------------------------------------------------
    if detection_result.face_landmarks:
        landmarks = detection_result.face_landmarks[0]          # 478 points
        blendshapes = detection_result.face_blendshapes[0]      # 52 ARKit blendshapes
        transform_matrix = detection_result.facial_transformation_matrixes[0]  # 4x4 head pose

        # --- Extract lip-sync relevant values ---
        lip_data = {}
        for bs in blendshapes:
            if bs.category_name in LIP_SYNC_BLENDSHAPES:
                lip_data[bs.category_name] = bs.score

        # Most useful single value for simple lip sync
        jaw_open = next((bs.score for bs in blendshapes if bs.category_name == "jawOpen"), 0.0)

        # Head rotation (from transformation matrix)
        # You can convert the 4x4 matrix to Euler angles if needed

        # Example: print key values every 30 frames
        if fps_counter % 30 == 0:
            print(f"jawOpen: {jaw_open:.3f} | mouthSmile: "
                  f"{(lip_data.get('mouthSmileLeft',0)+lip_data.get('mouthSmileRight',0))/2:.3f}")

        # -------------------------------------------------
        # Draw landmarks (optional visualization)
        # -------------------------------------------------
        h, w, _ = frame.shape
        for lm in landmarks:
            x, y = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

        # Draw jawOpen value on screen
        cv2.putText(frame, f"jawOpen: {jaw_open:.2f}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

    # FPS
    fps_counter += 1
    if time.time() - start_time >= 1.0:
        fps = fps_counter / (time.time() - start_time)
        fps_counter = 0
        start_time = time.time()
        cv2.putText(frame, f"FPS: {fps:.1f}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    cv2.imshow("Facial Mocap + Lip Sync (MediaPipe)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
detector.close()


# -------------------------------------------------
# How to use the data for actual Lip Sync / Avatar
# -------------------------------------------------
def apply_to_avatar(blendshapes):
    """Example: drive a 3D character that has ARKit blendshapes."""
    for bs in blendshapes:
        name = bs.category_name
        value = bs.score          # 0.0 -> 1.0
        # Map to your engine
        # Unity:  skinnedMesh.SetBlendShapeWeight(index, value * 100)
        # Unreal: MorphTarget
        # Three.js / Ready Player Me: mesh.morphTargetInfluences[index] = value
        # Live2D / VRoid: corresponding parameter
        if name == "jawOpen":
            # strongest lip-sync driver
            pass
