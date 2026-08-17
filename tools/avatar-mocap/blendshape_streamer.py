"""
Real-time blendshape streamer -- MediaPipe Face Landmarker over UDP (JSON)
and/or OSC, for driving a live rig in Unity, Unreal, or Blender (FACE-It)
from a webcam feed.

This is the real-time counterpart to face_landmarker_capture.py in this
same directory: that script is for reviewing/logging capture locally,
this one is for piping the same 52 ARKit blendshapes + head pose to
another process/machine as they're captured. Same caveat as the rest of
tools/avatar-mocap/: standalone workstation tool, not part of the Expo
app.

Setup:
    pip install -r requirements.txt
    (requirements.txt includes python-osc)

Receivers:
    Unity   -> UDP listener (System.Net.Sockets.UdpClient) or an OSC
               plugin (e.g. extOSC)
    Unreal  -> Live Link Face-style plugin, or an OSC plugin
    Blender -> FACE-It, or a small custom Python UDP/OSC receiver script
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import socket
import json
import time
from pythonosc import udp_client  # pip install python-osc

# ====================== CONFIG ======================
MODEL_PATH = "face_landmarker_v2_with_blendshapes.task"
CAMERA_ID = 0
UDP_IP = "127.0.0.1"          # change to target machine IP
UDP_PORT = 11111              # common mocap port
OSC_PORT = 9000               # optional OSC port
SEND_UDP = True
SEND_OSC = True
# ====================================================

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    output_face_blendshapes=True,
    output_facial_transformation_matrixes=True,
    num_faces=1,
)
detector = vision.FaceLandmarker.create_from_options(options)

udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
osc_client = udp_client.SimpleUDPClient(UDP_IP, OSC_PORT) if SEND_OSC else None

cap = cv2.VideoCapture(CAMERA_ID)
print(f"Streaming blendshapes -> UDP {UDP_IP}:{UDP_PORT} | OSC {UDP_IP}:{OSC_PORT}")
print("Press 'q' to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect_for_video(mp_image, int(time.time() * 1000))

    if result.face_blendshapes:
        blendshapes = {
            bs.category_name: round(bs.score, 4)
            for bs in result.face_blendshapes[0]
        }

        if result.facial_transformation_matrixes:
            matrix = result.facial_transformation_matrixes[0]
            blendshapes["_head_matrix"] = matrix.flatten().tolist()

        if SEND_UDP:
            payload = json.dumps(blendshapes).encode("utf-8")
            udp_sock.sendto(payload, (UDP_IP, UDP_PORT))

        if SEND_OSC and osc_client:
            for name, value in blendshapes.items():
                if name != "_head_matrix":
                    osc_client.send_message(f"/face/{name}", value)

        jaw = blendshapes.get("jawOpen", 0.0)
        cv2.putText(frame, f"jawOpen: {jaw:.2f}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

    cv2.imshow("Blendshape Streamer", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
detector.close()
