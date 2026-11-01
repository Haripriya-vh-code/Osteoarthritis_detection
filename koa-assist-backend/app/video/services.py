import os
import cv2
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from scipy.signal import savgol_filter, find_peaks
from ultralytics import YOLO

from app.ml_core.model_loader import model_registry

import logging

logger = logging.getLogger("koa_assist")


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

MODELS_DIR = os.path.join(BASE_DIR, "models_store")
YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "yolov8s-pose.pt")


class VideoGaitService:

    # ---------------------------------------------------------
    # YOLO model loader
    # ---------------------------------------------------------

    _yolo_model = None

    @classmethod
    def get_yolo_model(cls):
        if cls._yolo_model is None:
            if not os.path.exists(YOLO_MODEL_PATH):
                raise FileNotFoundError(
                    f"YOLO pose model not found at: {YOLO_MODEL_PATH}"
                )

            logger.info(
                f"Loading YOLO pose model from {YOLO_MODEL_PATH}"
            )

            cls._yolo_model = YOLO(YOLO_MODEL_PATH)

        return cls._yolo_model

    # ---------------------------------------------------------
    # Joint angle
    # ---------------------------------------------------------

    @staticmethod
    def calculate_joint_angle(a, b, c) -> float:
        ba = np.array(a) - np.array(b)
        bc = np.array(c) - np.array(b)

        n1 = np.linalg.norm(ba)
        n2 = np.linalg.norm(bc)

        if n1 < 1e-8 or n2 < 1e-8:
            return np.nan

        cosine_angle = np.clip(
            np.dot(ba, bc) / (n1 * n2),
            -1.0,
            1.0
        )

        return float(
            np.degrees(
                np.arccos(cosine_angle)
            )
        )

    # ---------------------------------------------------------
    # YOLO pose validation
    # ---------------------------------------------------------

    @staticmethod
    def is_pose_valid_yolo(kpts, image_height):

        try:
            y_sh = min(
                kpts[5][1],
                kpts[6][1]
            )

            y_hip = max(
                kpts[11][1],
                kpts[12][1]
            )

            l_knee_y = kpts[13][1]
            l_ankle_y = kpts[15][1]

            r_knee_y = kpts[14][1]
            r_ankle_y = kpts[16][1]

            body_height = abs(
                max(l_ankle_y, r_ankle_y) - y_sh
            )

            if body_height < 40:
                return False

            if y_sh >= y_hip:
                return False

            min_segment_length = body_height * 0.05

            if (
                abs(l_ankle_y - l_knee_y)
                < min_segment_length
                and
                abs(r_ankle_y - r_knee_y)
                < min_segment_length
            ):
                return False

            lower_body_confs = [
                kpts[11][2],
                kpts[12][2],
                kpts[13][2],
                kpts[14][2],
                kpts[15][2],
                kpts[16][2]
            ]

            if np.mean(lower_body_confs) < 0.35:
                return False

            return True

        except Exception:
            return False

    # ---------------------------------------------------------
    # Cadence
    # ---------------------------------------------------------

    @staticmethod
    def robust_cadence_estimation(
        angles,
        fps: float
    ) -> Tuple[float, float]:

        angles_clean = angles[~np.isnan(angles)]

        if len(angles_clean) < fps:
            return np.nan, np.nan

        min_distance = int(0.3 * fps)

        prominence_val = max(
            1.0,
            np.ptp(angles_clean) * 0.08
        )

        peaks, _ = find_peaks(
            angles_clean,
            distance=min_distance,
            prominence=prominence_val
        )

        if len(peaks) >= 2:

            cycle_times = np.diff(peaks) / fps

            mean_cycle = float(
                np.mean(cycle_times)
            )

            cadence = float(
                60.0 / mean_cycle
            )

            if cadence < 60.0:
                cadence *= 2.0

            return cadence, mean_cycle

        return np.nan, np.nan

    # ---------------------------------------------------------
    # Comprehensive metrics
    # ---------------------------------------------------------

    @classmethod
    def extract_comprehensive_metrics(
        cls,
        df: pd.DataFrame,
        side: str,
        fps: float,
        scale_factor_cm: float = 1.0
    ) -> Dict[str, float]:

        knee_col = f"Knee_{side}_Clean"
        hip_col = f"Hip_{side}_Flexion_Clean"
        ankle_y_col = f"Ankle_{side}_Y_Clean"

        if (
            scale_factor_cm > 2.0
            or scale_factor_cm < 0.3
        ):
            scale_factor_cm = 1.0

        empty_metrics = {
            k: np.nan
            for k in [
                "Knee_ROM_Degrees",
                "Max_Knee_Flexion",
                "Min_Knee_Flexion",
                "Mean_Knee_Angle",
                "Knee_Angle_Variability_Std",
                "Mean_Angular_Velocity",
                "Peak_Angular_Velocity",
                "Cadence_Steps_Min",
                "Gait_Cycle_Duration_s",
                "Hip_ROM_Degrees",
                "Max_Hip_Flexion",
                "Max_Ankle_Height_cm",
                "Ankle_Vertical_Displacement_cm"
            ]
        }

        if (
            df.empty
            or knee_col not in df.columns
            or len(df[knee_col].dropna()) == 0
        ):
            return empty_metrics

        valid_angles = (
            df[knee_col]
            .dropna()
            .to_numpy()
        )

        hip_angles = (
            df[hip_col]
            .dropna()
            .to_numpy()
            if hip_col in df.columns
            else np.array([])
        )

        ankle_heights = (
            df[ankle_y_col]
            .dropna()
            .to_numpy()
            if ankle_y_col in df.columns
            else np.array([])
        )

        rom = float(np.ptp(valid_angles))
        max_flex = float(np.max(valid_angles))
        min_flex = float(np.min(valid_angles))
        mean_angle = float(np.mean(valid_angles))
        angle_std = float(np.std(valid_angles))

        velocity = np.gradient(
            df[knee_col].to_numpy(),
            1 / fps
        )

        valid_velocity = velocity[
            ~np.isnan(velocity)
        ]

        mean_vel = (
            float(np.mean(np.abs(valid_velocity)))
            if len(valid_velocity) > 0
            else np.nan
        )

        max_vel = (
            float(np.max(np.abs(valid_velocity)))
            if len(valid_velocity) > 0
            else np.nan
        )

        cadence, mean_cycle = (
            cls.robust_cadence_estimation(
                df[knee_col].to_numpy(),
                fps
            )
        )

        hip_rom = (
            float(np.ptp(hip_angles))
            if len(hip_angles) > 0
            else np.nan
        )

        hip_max_flex = (
            float(np.max(hip_angles))
            if len(hip_angles) > 0
            else np.nan
        )

        if len(ankle_heights) > 0:

            max_ankle_val = float(
                np.max(ankle_heights)
                * scale_factor_cm
            )

            max_ankle_height = (
                max_ankle_val
                if max_ankle_val <= 40.0
                else np.nan
            )

            ankle_vertical_disp = float(
                np.ptp(ankle_heights)
                * scale_factor_cm
            )

        else:
            max_ankle_height = np.nan
            ankle_vertical_disp = np.nan

        return {
            "Knee_ROM_Degrees": rom,
            "Max_Knee_Flexion": max_flex,
            "Min_Knee_Flexion": min_flex,
            "Mean_Knee_Angle": mean_angle,
            "Knee_Angle_Variability_Std": angle_std,
            "Mean_Angular_Velocity": mean_vel,
            "Peak_Angular_Velocity": max_vel,
            "Cadence_Steps_Min": cadence,
            "Gait_Cycle_Duration_s": mean_cycle,
            "Hip_ROM_Degrees": hip_rom,
            "Max_Hip_Flexion": hip_max_flex,
            "Max_Ankle_Height_cm": max_ankle_height,
            "Ankle_Vertical_Displacement_cm": ankle_vertical_disp
        }

    # ---------------------------------------------------------
    # Extract features from video using YOLO
    # ---------------------------------------------------------

    @classmethod
    def extract_features_from_video(
        cls,
        video_path: str,
        pose_model
    ) -> pd.DataFrame:

        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(
                f"Could not open video file: {video_path}"
            )

        fps = cap.get(cv2.CAP_PROP_FPS)

        if not fps or fps <= 0:
            fps = 30.0

        total_frames = int(
            cap.get(cv2.CAP_PROP_FRAME_COUNT)
        )

        raw_records = []
        valid_body_heights = []

        for frame_idx in range(total_frames):

            ret, frame = cap.read()

            if not ret:
                break

            h, w, _ = frame.shape

            # EXACT 20%-80% horizontal crop
            cropped_frame = frame[
                :,
                int(w * 0.20):int(w * 0.80)
            ]

            ch, cw, _ = cropped_frame.shape

            results = pose_model(
                cropped_frame,
                verbose=False
            )

            row = {
                "frame": frame_idx,
                "time_s": frame_idx / fps,
                "valid_pose": False
            }

            try:

                if (
                    results
                    and results[0].keypoints is not None
                    and results[0].keypoints.data is not None
                    and len(results[0].keypoints.data) > 0
                ):

                    kpts = (
                        results[0]
                        .keypoints
                        .data[0]
                        .cpu()
                        .numpy()
                    )

                    if cls.is_pose_valid_yolo(
                        kpts,
                        ch
                    ):

                        body_height = abs(
                            max(
                                kpts[15][1],
                                kpts[16][1]
                            )
                            -
                            min(
                                kpts[5][1],
                                kpts[6][1]
                            )
                        )

                        valid_body_heights.append(
                            body_height
                        )

                        # YOLO keypoints
                        l_sh = kpts[5][:2]
                        r_sh = kpts[6][:2]

                        l_hip = kpts[11][:2]
                        r_hip = kpts[12][:2]

                        l_knee = kpts[13][:2]
                        r_knee = kpts[14][:2]

                        l_ankle = kpts[15][:2]
                        r_ankle = kpts[16][:2]

                        # Knee angles
                        row["Knee_Left_Raw"] = (
                            180.0
                            -
                            cls.calculate_joint_angle(
                                l_hip,
                                l_knee,
                                l_ankle
                            )
                        )

                        row["Knee_Right_Raw"] = (
                            180.0
                            -
                            cls.calculate_joint_angle(
                                r_hip,
                                r_knee,
                                r_ankle
                            )
                        )

                        # Hip flexion
                        row["Hip_Left_Flexion_Raw"] = max(
                            0.0,
                            180.0
                            -
                            cls.calculate_joint_angle(
                                l_sh,
                                l_hip,
                                l_knee
                            )
                        )

                        row["Hip_Right_Flexion_Raw"] = max(
                            0.0,
                            180.0
                            -
                            cls.calculate_joint_angle(
                                r_sh,
                                r_hip,
                                r_knee
                            )
                        )

                        # Ankle vertical position
                        row["Ankle_Left_Y"] = float(
                            ch - l_ankle[1]
                        )

                        row["Ankle_Right_Y"] = float(
                            ch - r_ankle[1]
                        )

                        row["valid_pose"] = True

            except Exception as e:
                logger.debug(
                    f"Frame {frame_idx} processing failed: {e}"
                )

            raw_records.append(row)

        cap.release()

        # -----------------------------------------------------
        # Scale factor
        # -----------------------------------------------------

        if valid_body_heights:

            scale_factor = (
                170.0
                /
                np.mean(valid_body_heights)
            )

        else:
            scale_factor = 1.0

        df = pd.DataFrame(raw_records)

        target_columns = [
            "Knee_Left_Raw",
            "Knee_Right_Raw",
            "Hip_Left_Flexion_Raw",
            "Hip_Right_Flexion_Raw",
            "Ankle_Left_Y",
            "Ankle_Right_Y"
        ]

        # -----------------------------------------------------
        # Interpolation + Savitzky-Golay
        # -----------------------------------------------------

        for col in target_columns:

            if col not in df.columns:
                df[col] = np.nan

            df[col] = df[col].interpolate(
                method="linear",
                limit_direction="both"
            )

            clean_col = (
                col.replace("_Raw", "")
                + "_Clean"
            )

            valid_sub = df[col].dropna()

            num_valid = len(valid_sub)

            polyorder = 2

            if num_valid > polyorder:

                win_len = min(
                    15,
                    num_valid
                )

                if win_len % 2 == 0:
                    win_len = max(
                        3,
                        win_len - 1
                    )

                if win_len > polyorder:

                    df[clean_col] = np.nan

                    df.loc[
                        valid_sub.index,
                        clean_col
                    ] = savgol_filter(
                        valid_sub.values,
                        window_length=win_len,
                        polyorder=polyorder
                    )

                else:
                    df[clean_col] = df[col]

            else:
                df[clean_col] = df[col]

        # -----------------------------------------------------
        # Left/right metrics
        # -----------------------------------------------------

        left_m = cls.extract_comprehensive_metrics(
            df,
            "Left",
            fps,
            scale_factor
        )

        right_m = cls.extract_comprehensive_metrics(
            df,
            "Right",
            fps,
            scale_factor
        )

        # -----------------------------------------------------
        # Symmetry
        # -----------------------------------------------------

        symmetry_keys = [
            "Knee_ROM_Degrees",
            "Max_Knee_Flexion",
            "Min_Knee_Flexion",
            "Mean_Knee_Angle",
            "Knee_Angle_Variability_Std",
            "Mean_Angular_Velocity",
            "Peak_Angular_Velocity",
            "Hip_ROM_Degrees",
            "Max_Hip_Flexion",
            "Max_Ankle_Height_cm",
            "Ankle_Vertical_Displacement_cm"
        ]

        si_list = [
            abs(
                left_m[k] - right_m[k]
            )
            /
            (
                (left_m[k] + right_m[k])
                / 2.0
            )
            * 100.0
            for k in symmetry_keys
            if (
                not np.isnan(left_m[k])
                and not np.isnan(right_m[k])
                and (left_m[k] + right_m[k]) > 0
            )
        ]

        mean_symmetry_diff = (
            float(np.mean(si_list))
            if si_list
            else np.nan
        )

        # IMPORTANT:
        # The trained model uses LEFT-side metrics
        # + Mean_Symmetry_Diff_%

        case_summary = {
            **left_m,
            "Mean_Symmetry_Diff_%": mean_symmetry_diff
        }

        return pd.DataFrame([case_summary])

    # ---------------------------------------------------------
    # Complete processing + prediction
    # ---------------------------------------------------------

    @classmethod
    def process_video_and_predict(
        cls,
        video_path: str
    ) -> Dict[str, Any]:

        if not os.path.exists(video_path):
            raise FileNotFoundError(
                f"Video file not found at path: {video_path}"
            )

        logger.info(
            f"Starting gait analysis: {video_path}"
        )

        # YOLO model
        yolo_model = cls.get_yolo_model()

        # Extract exact trained features
        features_df = cls.extract_features_from_video(
            video_path,
            yolo_model
        )

        # Get trained RF bundle
        gait_bundle = (
            model_registry.get_gait_bundle()
        )

        trained_model = gait_bundle["model"]
        trained_scaler = gait_bundle["scaler"]
        feature_columns = gait_bundle["features"]

        if trained_model is None:
            raise RuntimeError(
                "KOA gait Random Forest model could not be loaded."
            )

        if trained_scaler is None:
            raise RuntimeError(
                "KOA gait scaler could not be loaded."
            )

        if feature_columns is None:
            raise RuntimeError(
                "KOA gait feature columns could not be loaded."
            )

        # -----------------------------------------------------
        # EXACT feature alignment used during Colab inference
        # -----------------------------------------------------

        inference_features = features_df.copy()

        inference_features = (
            inference_features
            .reindex(columns=feature_columns)
        )

        # IMPORTANT:
        # Do NOT fill missing features with zero.
        if inference_features.isna().any().any():

            missing_features = (
                inference_features.columns[
                    inference_features.isna().any()
                ].tolist()
            )

            raise ValueError(
                "Some required biomechanical features "
                "could not be extracted from this video: "
                + ", ".join(missing_features)
            )

        # -----------------------------------------------------
        # Scaling
        # -----------------------------------------------------

        X_new_scaled = trained_scaler.transform(
            inference_features
        )

        # -----------------------------------------------------
        # Prediction
        # -----------------------------------------------------

        prediction = trained_model.predict(
            X_new_scaled
        )[0]

        probabilities = (
            trained_model
            .predict_proba(X_new_scaled)[0]
        )

        classes = trained_model.classes_

        confidence_dict = dict(
            zip(classes, probabilities)
        )

        prediction_confidence = (
            confidence_dict[prediction]
        )

        # Safely obtain KOA probability
        koa_probability = confidence_dict.get(
            "KOA"
        )

        if koa_probability is None:
            koa_probability = 0.0

        # -----------------------------------------------------
        # Clean feature values for JSON
        # -----------------------------------------------------

        case_summary = features_df.iloc[0].to_dict()

        clean_case_summary = {}

        for key, value in case_summary.items():

            if value is None:
                clean_case_summary[key] = None

            elif isinstance(value, (float, np.floating)):

                if np.isnan(value):
                    clean_case_summary[key] = None
                else:
                    clean_case_summary[key] = round(
                        float(value),
                        4
                    )

            else:
                clean_case_summary[key] = value

        logger.info(
            f"Gait prediction: {prediction} "
            f"(confidence={prediction_confidence:.4f})"
        )

        return {
            "prediction": str(prediction),
            "oa_risk_score": round(
                float(koa_probability),
                4
            ),
            "confidence": round(
                float(prediction_confidence),
                4
            ),
            "biomechanical_features": clean_case_summary
        }