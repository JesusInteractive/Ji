"""
Real-time avatar driver with head rotation -- MediaPipe Face Landmarker
-> official Live Link Face protocol (via PyLiveLinkFace) -> Unreal
Engine or Blender.

Superset of realtime_avatar.py in this same directory: same 52 ARKit
blendshapes, plus head Yaw/Pitch/Roll extracted from MediaPipe's
facial_transformation_matrixes and mapped onto Live Link's
HeadYaw/HeadPitch/HeadRoll. Same standalone-workstation-tool caveat as
the rest of tools/avatar-mocap/ -- see README.md for how this fits the
project's chosen real-time-avatar direction and the open
app-integration question that direction raises.

Also applies exponential-moving-average smoothing to every blendshape
and head-rotation value before sending, to cut down webcam/tracking
jitter -- raw per-frame MediaPipe output is noisy enough to read as a
twitchy rig otherwise. Tune SMOOTHING_FACTOR below: lower = smoother
but laggier, higher = snappier but more jitter. This is the complete,
recommended script for this project's real-time-avatar path -- see
README.md's Blender rigging notes (existing addon or manual shape-key
+ driver setup) for the non-MetaHuman side.

Also streams per-eye rotation (LeftEyeYaw/Pitch/Roll,
RightEyeYaw/Pitch/Roll). MediaPipe doesn't give a per-eye
transformation matrix the way it does for the head, so eye yaw/pitch
are derived from the four directional eyeLookUp/Down/In/Out
blendshapes per eye (out-minus-in for yaw, up-minus-down for pitch);
eye roll isn't estimated by this pipeline and is sent as 0. The exact
FaceBlendShape enum member names for eye rotation
(LeftEyeYaw/LeftEyePitch/LeftEyeRoll/RightEyeYaw/RightEyePitch/RightEyeRoll)
follow the same naming pattern as HeadYaw/HeadPitch/HeadRoll below --
verify them against your installed pylivelinkface version if you hit
an AttributeError, since this repo hasn't run the package to confirm
the exact names.

Setup: same as realtime_avatar.py (pip install -r requirements.txt,
download the .task model). Tune HEAD_ROTATION_SCALE / EYE_ROTATION_SCALE
below if movement reads too weak/strong once you see it driving a rig;
flip a sign in matrix_to_euler()'s output, or in the eye yaw/pitch
calculation, if an axis is inverted for your target rig.
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import socket
import time
from pylivelinkface import PyLiveLinkFace, FaceBlendShape

# ====================== CONFIG ======================
UDP_IP = "127.0.0.1"          # Unreal / Blender machine IP
UDP_PORT = 11111
CAMERA_ID = 0
MODEL_PATH = "face_landmarker_v2_with_blendshapes.task"
HEAD_ROTATION_SCALE = 1.0     # increase if head movement feels too weak
EYE_ROTATION_SCALE = 1.0      # increase if eye movement feels too weak
SMOOTHING_FACTOR = 0.5        # 0..1 -- lower = smoother/laggier, higher = snappier/jitterier
# ====================================================

# Eye-rotation FaceBlendShape enum members, resolved once at import
# time so a missing/renamed member fails fast with a clear message
# instead of crashing mid-stream. See module docstring.
_EYE_ROTATION_SHAPES = {}
for _name in ("LeftEyeYaw", "LeftEyePitch", "LeftEyeRoll",
              "RightEyeYaw", "RightEyePitch", "RightEyeRoll"):
    _shape = getattr(FaceBlendShape, _name, None)
    if _shape is None:
        print(f"WARNING: FaceBlendShape.{_name} not found in your pylivelinkface "
              f"version -- eye-rotation streaming for that channel will be skipped. "
              f"Check the installed package's enum for the correct member name.")
    _EYE_ROTATION_SHAPES[_name] = _shape

# Running exponential-moving-average state, keyed by blendshape name
# (or "_pitch" / "_yaw" / "_roll" for head rotation). Populated lazily
# so the first frame just passes through.
_smoothed_values = {}


def smooth(key, new_value):
    """Exponential moving average: blends new_value with the last
    smoothed value for `key` using SMOOTHING_FACTOR, and returns the
    result. Cuts down frame-to-frame webcam/tracking jitter."""
    prev = _smoothed_values.get(key)
    value = new_value if prev is None else (
        SMOOTHING_FACTOR * new_value + (1 - SMOOTHING_FACTOR) * prev
    )
    _smoothed_values[key] = value
    return value


def matrix_to_euler(matrix_4x4):
    """Convert a 4x4 transformation matrix to Euler angles (radians).
    Returns: pitch, yaw, roll"""
    R = matrix_4x4[:3, :3]
    sy = np.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
    singular = sy < 1e-6
    if not singular:
        pitch = np.arctan2(R[2, 1], R[2, 2])
        yaw = np.arctan2(-R[2, 0], sy)
        roll = np.arctan2(R[1, 0], R[0, 0])
    else:
        pitch = np.arctan2(-R[1, 2], R[1, 1])
        yaw = np.arctan2(-R[2, 0], sy)
        roll = 0
    return pitch, yaw, roll


base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    output_face_blendshapes=True,
    output_facial_transformation_matrixes=True,  # required for head rotation
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
detector = vision.FaceLandmarker.create_from_options(options)

py_face = PyLiveLinkFace()
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

BLENDSHAPE_MAP = {
    "browDownLeft": FaceBlendShape.BrowDownLeft,
    "browDownRight": FaceBlendShape.BrowDownRight,
    "browInnerUp": FaceBlendShape.BrowInnerUp,
    "browOuterUpLeft": FaceBlendShape.BrowOuterUpLeft,
    "browOuterUpRight": FaceBlendShape.BrowOuterUpRight,
    "cheekPuff": FaceBlendShape.CheekPuff,
    "cheekSquintLeft": FaceBlendShape.CheekSquintLeft,
    "cheekSquintRight": FaceBlendShape.CheekSquintRight,
    "eyeBlinkLeft": FaceBlendShape.EyeBlinkLeft,
    "eyeBlinkRight": FaceBlendShape.EyeBlinkRight,
    "eyeLookDownLeft": FaceBlendShape.EyeLookDownLeft,
    "eyeLookDownRight": FaceBlendShape.EyeLookDownRight,
    "eyeLookInLeft": FaceBlendShape.EyeLookInLeft,
    "eyeLookInRight": FaceBlendShape.EyeLookInRight,
    "eyeLookOutLeft": FaceBlendShape.EyeLookOutLeft,
    "eyeLookOutRight": FaceBlendShape.EyeLookOutRight,
    "eyeLookUpLeft": FaceBlendShape.EyeLookUpLeft,
    "eyeLookUpRight": FaceBlendShape.EyeLookUpRight,
    "eyeSquintLeft": FaceBlendShape.EyeSquintLeft,
    "eyeSquintRight": FaceBlendShape.EyeSquintRight,
    "eyeWideLeft": FaceBlendShape.EyeWideLeft,
    "eyeWideRight": FaceBlendShape.EyeWideRight,
    "jawForward": FaceBlendShape.JawForward,
    "jawLeft": FaceBlendShape.JawLeft,
    "jawOpen": FaceBlendShape.JawOpen,
    "jawRight": FaceBlendShape.JawRight,
    "mouthClose": FaceBlendShape.MouthClose,
    "mouthDimpleLeft": FaceBlendShape.MouthDimpleLeft,
    "mouthDimpleRight": FaceBlendShape.MouthDimpleRight,
    "mouthFrownLeft": FaceBlendShape.MouthFrownLeft,
    "mouthFrownRight": FaceBlendShape.MouthFrownRight,
    "mouthFunnel": FaceBlendShape.MouthFunnel,
    "mouthLeft": FaceBlendShape.MouthLeft,
    "mouthLowerDownLeft": FaceBlendShape.MouthLowerDownLeft,
    "mouthLowerDownRight": FaceBlendShape.MouthLowerDownRight,
    "mouthPressLeft": FaceBlendShape.MouthPressLeft,
    "mouthPressRight": FaceBlendShape.MouthPressRight,
    "mouthPucker": FaceBlendShape.MouthPucker,
    "mouthRight": FaceBlendShape.MouthRight,
    "mouthRollLower": FaceBlendShape.MouthRollLower,
    "mouthRollUpper": FaceBlendShape.MouthRollUpper,
    "mouthShrugLower": FaceBlendShape.MouthShrugLower,
    "mouthShrugUpper": FaceBlendShape.MouthShrugUpper,
    "mouthSmileLeft": FaceBlendShape.MouthSmileLeft,
    "mouthSmileRight": FaceBlendShape.MouthSmileRight,
    "mouthStretchLeft": FaceBlendShape.MouthStretchLeft,
    "mouthStretchRight": FaceBlendShape.MouthStretchRight,
    "mouthUpperUpLeft": FaceBlendShape.MouthUpperUpLeft,
    "mouthUpperUpRight": FaceBlendShape.MouthUpperUpRight,
    "noseSneerLeft": FaceBlendShape.NoseSneerLeft,
    "noseSneerRight": FaceBlendShape.NoseSneerRight,
    "tongueOut": FaceBlendShape.TongueOut,
}

print(f"Streaming blendshapes + head rotation (smoothed) -> {UDP_IP}:{UDP_PORT}")
print("Press 'q' to quit")

cap = cv2.VideoCapture(CAMERA_ID)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect_for_video(mp_image, int(time.time() * 1000))

    if result.face_blendshapes:
        for shape in FaceBlendShape:
            py_face.set_blendshape(shape, 0.0)

        blendshapes = {bs.category_name: bs.score for bs in result.face_blendshapes[0]}

        for name, score in blendshapes.items():
            if name in BLENDSHAPE_MAP:
                py_face.set_blendshape(BLENDSHAPE_MAP[name], smooth(name, score))

        if result.facial_transformation_matrixes:
            mat = np.array(result.facial_transformation_matrixes[0]).reshape(4, 4)
            pitch, yaw, roll = matrix_to_euler(mat)
            pitch, yaw, roll = smooth("_pitch", pitch), smooth("_yaw", yaw), smooth("_roll", roll)
            py_face.set_blendshape(FaceBlendShape.HeadPitch, np.clip(pitch * HEAD_ROTATION_SCALE, -1.0, 1.0))
            py_face.set_blendshape(FaceBlendShape.HeadYaw, np.clip(yaw * HEAD_ROTATION_SCALE, -1.0, 1.0))
            py_face.set_blendshape(FaceBlendShape.HeadRoll, np.clip(roll * HEAD_ROTATION_SCALE, -1.0, 1.0))
            cv2.putText(frame, f"Pitch: {pitch:.2f}  Yaw: {yaw:.2f}  Roll: {roll:.2f}",
                        (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        # --- Eye rotation (derived from directional look blendshapes;
        # MediaPipe has no per-eye transformation matrix) ---
        left_yaw = (blendshapes.get("eyeLookOutLeft", 0.0) - blendshapes.get("eyeLookInLeft", 0.0))
        left_pitch = (blendshapes.get("eyeLookUpLeft", 0.0) - blendshapes.get("eyeLookDownLeft", 0.0))
        right_yaw = (blendshapes.get("eyeLookInRight", 0.0) - blendshapes.get("eyeLookOutRight", 0.0))
        right_pitch = (blendshapes.get("eyeLookUpRight", 0.0) - blendshapes.get("eyeLookDownRight", 0.0))

        left_yaw = smooth("_eyeYawL", left_yaw)
        left_pitch = smooth("_eyePitchL", left_pitch)
        right_yaw = smooth("_eyeYawR", right_yaw)
        right_pitch = smooth("_eyePitchR", right_pitch)

        eye_values = {
            "LeftEyeYaw": left_yaw, "LeftEyePitch": left_pitch, "LeftEyeRoll": 0.0,
            "RightEyeYaw": right_yaw, "RightEyePitch": right_pitch, "RightEyeRoll": 0.0,
        }
        for shape_name, value in eye_values.items():
            shape = _EYE_ROTATION_SHAPES.get(shape_name)
            if shape is not None:
                py_face.set_blendshape(shape, np.clip(value * EYE_ROTATION_SCALE, -1.0, 1.0))

        cv2.putText(frame, f"EyeYaw L/R: {left_yaw:.2f}/{right_yaw:.2f}  "
                            f"EyePitch L/R: {left_pitch:.2f}/{right_pitch:.2f}",
                    (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        sock.sendto(py_face.encode(), (UDP_IP, UDP_PORT))

        jaw = blendshapes.get("jawOpen", 0.0)
        cv2.putText(frame, f"jawOpen: {jaw:.2f}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        cv2.putText(frame, "Streaming + Head + Eye Rotation", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow("Real-time Avatar (Blendshapes + Head Rotation)", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
sock.close()
detector.close()
print("Stopped.")
