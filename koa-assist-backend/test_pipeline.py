import os
import sys

print("1. Testing Imports...")
try:
    import cv2
    import numpy as np
    import pandas as pd
    import joblib
    import mediapipe as mp

    mp_pose = mp.solutions.pose
    print("   Imports successful!")
except Exception as e:
    print(f"   IMPORT FAILED: {e}")
    sys.exit(1)

print("2. Testing MediaPipe Initialization...")
try:
    pose = mp_pose.Pose(static_image_mode=False)
    print("   MediaPipe Pose initialized successfully!")
    pose.close()
except Exception as e:
    print(f"   MEDIAPIPE INIT FAILED: {e}")
    sys.exit(1)

print("3. Testing Video Processing Function...")
try:
    from app.video.services import VideoGaitService
    print("   VideoGaitService imported successfully!")
except Exception as e:
    print(f"   SERVICE IMPORT FAILED: {e}")
    sys.exit(1)

print("\n--- ALL PRE-FLIGHT CHECKS PASSED ---")