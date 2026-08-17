"""
Real-time avatar driver -- MediaPipe Face Landmarker -> official Live
Link Face protocol (via PyLiveLinkFace) -> Unreal Engine.

Streams a webcam performer's face as if it were the official iPhone
Live Link Face app, so a MetaHuman (or any ARKit-compatible character)
in Unreal moves in real time with the performer's face. Full 52
ARKit-blendshape mapping.

This is the real-time/live-avatar path, as opposed to the pre-rendered
video-loop path in ../../docs/jesus-video-portrait-brief.md. Choosing
this route is an architecture decision, not just a tooling swap --
Unreal + MetaHuman is a separate render pipeline from the "drop an mp4
into assets/video/" plan the brief currently documents, and would need
its own decision about how the Expo/React Native app receives/displays
the output (e.g. Unreal rendering to a stream/recording that gets
converted to clips, vs. a genuinely live connection, which the mobile
app can't host directly). See the "Real-time avatar path" section
added to the brief for the open questions this raises.

Setup:
    pip install -r requirements.txt   # includes pylivelinkface
    wget -O face_landmarker_v2_with_blendshapes.task \\
      https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
    python realtime_avatar.py

Unreal Engine setup:
    1. Enable plugins: Live Link, Apple ARKit, Apple ARKit Face Support
    2. Window -> Live Link -- a new source should appear once this
       script is running and sending packets
    3. On your MetaHuman (or ARKit character): set the Face component's
       Live Link subject to the one from this script, and make sure the
       Animation Blueprint is using Live Link Pose
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import socket
import time
from pylivelinkface import PyLiveLinkFace, FaceBlendShape

# ====================== CONFIG ======================
UDP_IP = "127.0.0.1"          # change to your Unreal machine's IP if remote
UDP_PORT = 11111
CAMERA_ID = 0
MODEL_PATH = "face_landmarker_v2_with_blendshapes.task"
# ====================================================

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    output_face_blendshapes=True,
    output_facial_transformation_matrixes=True,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
detector = vision.FaceLandmarker.create_from_options(options)

py_face = PyLiveLinkFace()
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# MediaPipe blendshape name -> Live Link FaceBlendShape
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

print(f"Streaming to Unreal at {UDP_IP}:{UDP_PORT}")
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

        for bs in result.face_blendshapes[0]:
            name = bs.category_name
            if name in BLENDSHAPE_MAP:
                py_face.set_blendshape(BLENDSHAPE_MAP[name], bs.score)

        packet = py_face.encode()
        sock.sendto(packet, (UDP_IP, UDP_PORT))

        jaw = next((b.score for b in result.face_blendshapes[0] if b.category_name == "jawOpen"), 0)
        cv2.putText(frame, f"jawOpen: {jaw:.2f}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        cv2.putText(frame, "Streaming to Live Link", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow("Real-time Avatar - MediaPipe -> Live Link", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
sock.close()
detector.close()
print("Stopped.")
