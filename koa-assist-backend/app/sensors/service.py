import os
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "..")
)

MODEL_FILE = os.path.join(
    PROJECT_ROOT,
    "models_store",
    "koa_hardware_model.pkl"
)

FEATURE_FILE = os.path.join(
    PROJECT_ROOT,
    "models_store",
    "hardware_feature_names.pkl"
)


# ============================================================
# SENSOR CONFIGURATION
# ============================================================

SENSORS = ["LB", "LF", "RF"]

SIGNALS = [
    "acc_x",
    "acc_y",
    "acc_z",
    "gyr_x",
    "gyr_y",
    "gyr_z"
]


# ============================================================
# LOAD MODEL
# ============================================================

if not os.path.exists(MODEL_FILE):
    raise FileNotFoundError(
        f"Sensor model not found at: {MODEL_FILE}"
    )

if not os.path.exists(FEATURE_FILE):
    raise FileNotFoundError(
        f"Sensor feature file not found at: {FEATURE_FILE}"
    )


sensor_model = joblib.load(MODEL_FILE)
sensor_feature_names = joblib.load(FEATURE_FILE)


# ============================================================
# FIND COLUMN
# ============================================================

def find_column(df: pd.DataFrame, sensor: str, signal: str):

    target = (
        f"{sensor}_{signal}"
        .replace("_", "")
        .replace(" ", "")
        .lower()
    )

    for col in df.columns:

        normalized = (
            str(col)
            .replace("_", "")
            .replace(" ", "")
            .lower()
        )

        if normalized == target:
            return col

    return None


# ============================================================
# CALCULATE FEATURES
# ============================================================

def calculate_features(df: pd.DataFrame) -> pd.DataFrame:

    features = {}

    # --------------------------------------------------------
    # Process each sensor
    # --------------------------------------------------------

    for sensor in SENSORS:

        sensor_data = {}

        # ----------------------------------------------------
        # Get six MPU6050 channels
        # ----------------------------------------------------

        for signal in SIGNALS:

            col = find_column(
                df,
                sensor,
                signal
            )

            if col is None:
                raise ValueError(
                    f"Missing column: {sensor}_{signal}"
                )

            sensor_data[signal] = pd.to_numeric(
                df[col],
                errors="coerce"
            )

        # ----------------------------------------------------
        # Temporary dataframe
        # ----------------------------------------------------

        temp = pd.DataFrame(sensor_data)

        # Remove invalid values
        temp = temp.replace(
            [np.inf, -np.inf],
            np.nan
        )

        temp = temp.dropna()

        # ----------------------------------------------------
        # Minimum sample requirement
        # ----------------------------------------------------

        if len(temp) < 100:
            raise ValueError(
                f"Not enough valid samples for {sensor}. "
                f"At least 100 valid samples are required."
            )

        # ----------------------------------------------------
        # ACCELERATION MAGNITUDE
        # ----------------------------------------------------

        acc_mag = np.sqrt(
            temp["acc_x"] ** 2 +
            temp["acc_y"] ** 2 +
            temp["acc_z"] ** 2
        )

        # ----------------------------------------------------
        # GYROSCOPE MAGNITUDE
        # ----------------------------------------------------

        gyr_mag = np.sqrt(
            temp["gyr_x"] ** 2 +
            temp["gyr_y"] ** 2 +
            temp["gyr_z"] ** 2
        )

        # ----------------------------------------------------
        # ALL 8 SIGNALS
        # ----------------------------------------------------

        signals = {

            "acc_x": temp["acc_x"],
            "acc_y": temp["acc_y"],
            "acc_z": temp["acc_z"],

            "gyr_x": temp["gyr_x"],
            "gyr_y": temp["gyr_y"],
            "gyr_z": temp["gyr_z"],

            "acc_mag": acc_mag,
            "gyr_mag": gyr_mag
        }

        # ----------------------------------------------------
        # 7 STATISTICAL FEATURES PER SIGNAL
        # ----------------------------------------------------

        for signal_name, values in signals.items():

            features[
                f"{sensor}_{signal_name}_mean"
            ] = values.mean()

            features[
                f"{sensor}_{signal_name}_std"
            ] = values.std()

            features[
                f"{sensor}_{signal_name}_rms"
            ] = np.sqrt(
                np.mean(values ** 2)
            )

            features[
                f"{sensor}_{signal_name}_min"
            ] = values.min()

            features[
                f"{sensor}_{signal_name}_max"
            ] = values.max()

            features[
                f"{sensor}_{signal_name}_range"
            ] = (
                values.max() -
                values.min()
            )

            features[
                f"{sensor}_{signal_name}_median"
            ] = values.median()

    # --------------------------------------------------------
    # Convert to dataframe
    # --------------------------------------------------------

    return pd.DataFrame([features])


# ============================================================
# READ SENSOR CSV
# ============================================================

def read_sensor_csv(file_path: str) -> pd.DataFrame:

    # --------------------------------------------------------
    # First try tab-separated format
    # --------------------------------------------------------

    df = pd.read_csv(
        file_path,
        sep="\t"
    )

    # --------------------------------------------------------
    # If everything came as one column, try comma format
    # --------------------------------------------------------

    if len(df.columns) == 1:

        df = pd.read_csv(
            file_path,
            sep=","
        )

    if len(df.columns) == 1:
        raise ValueError(
            "Could not detect CSV columns. "
            "Expected a tab-separated or comma-separated CSV."
        )

    return df


# ============================================================
# PREDICTION
# ============================================================

def predict_koa(file_path: str) -> Dict[str, Any]:

    print("\n========================================")
    print("       SENSOR KOA ANALYSIS")
    print("========================================")

    # --------------------------------------------------------
    # Read sensor data
    # --------------------------------------------------------

    df = read_sensor_csv(file_path)

    print(
        "Samples received:",
        len(df)
    )

    print(
        "Columns received:",
        list(df.columns)
    )

    # --------------------------------------------------------
    # Calculate 168 features
    # --------------------------------------------------------

    X = calculate_features(df)

    print(
        "Features generated:",
        X.shape[1]
    )

    print(
        "Features expected:",
        len(sensor_feature_names)
    )

    # --------------------------------------------------------
    # Check feature names
    # --------------------------------------------------------

    missing = (
        set(sensor_feature_names)
        - set(X.columns)
    )

    extra = (
        set(X.columns)
        - set(sensor_feature_names)
    )

    print(
        "Missing features:",
        len(missing)
    )

    print(
        "Extra features:",
        len(extra)
    )

    # --------------------------------------------------------
    # Stop if required features are missing
    # --------------------------------------------------------

    if missing:

        missing_features = sorted(
            list(missing)
        )

        raise ValueError(
            "Sensor feature mismatch. "
            f"Missing features: {missing_features}"
        )

    # --------------------------------------------------------
    # Arrange exact training order
    # --------------------------------------------------------

    X = X[sensor_feature_names]

    # --------------------------------------------------------
    # Check for invalid model input
    # --------------------------------------------------------

    if X.isnull().any().any():

        raise ValueError(
            "Generated sensor features contain "
            "invalid values."
        )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    prediction = sensor_model.predict(X)[0]

    probabilities = sensor_model.predict_proba(X)[0]

    # --------------------------------------------------------
    # Get class probabilities safely
    # --------------------------------------------------------

    class_probabilities = {
        int(cls): float(prob)
        for cls, prob in zip(
            sensor_model.classes_,
            probabilities
        )
    }

    healthy_probability = class_probabilities.get(
        0,
        0.0
    )

    koa_probability = class_probabilities.get(
        1,
        0.0
    )

    # --------------------------------------------------------
    # Convert prediction
    # --------------------------------------------------------

    prediction_int = int(prediction)

    if prediction_int == 1:
        prediction_label = "Possible KOA Risk"
    else:
        prediction_label = "Healthy"

    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    result = {

        "prediction": prediction_label,

        "prediction_class": prediction_int,

        "oa_risk_score": koa_probability,

        "confidence": max(
            healthy_probability,
            koa_probability
        ),

        "healthy_probability": healthy_probability,

        "koa_probability": koa_probability,

        "samples_received": int(len(df)),

        "features_generated": int(X.shape[1]),

        "status": "success"
    }

    print("\n================================")
    print("       KOA SCREENING RESULT")
    print("================================")

    print(
        "Prediction:",
        prediction_label
    )

    print(
        f"Healthy probability: "
        f"{healthy_probability * 100:.2f}%"
    )

    print(
        f"KOA probability: "
        f"{koa_probability * 100:.2f}%"
    )

    print("================================\n")

    return result