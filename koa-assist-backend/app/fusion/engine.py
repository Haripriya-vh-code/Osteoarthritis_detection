def get_severity(score):

    if score < 20:
        return "Normal"

    elif score < 40:
        return "Mild"

    elif score < 60:
        return "Moderate"

    elif score < 80:
        return "Severe"

    return "Critical"


def get_confidence(
    xray_score,
    video_score,
    sensor_score,
    questionnaire_score
):

    count = sum([
        xray_score is not None,
        video_score is not None,
        sensor_score is not None,
        questionnaire_score is not None
    ])

    if count == 4:
        return 99

    elif count == 3:
        return 95

    elif count == 2:
        return 85

    elif count == 1:
        return 70

    return 0


def get_recommendation(score):

    if score < 20:
        return (
            "No significant osteoarthritis detected. "
            "Maintain an active lifestyle."
        )

    elif score < 40:
        return (
            "Mild osteoarthritis indicators detected. "
            "Regular exercise and monitoring advised."
        )

    elif score < 60:
        return (
            "Moderate osteoarthritis indicators detected. "
            "Physiotherapy and lifestyle modifications recommended."
        )

    elif score < 80:
        return (
            "Severe osteoarthritis indicators detected. "
            "Orthopedic consultation recommended."
        )

    return (
        "Critical osteoarthritis risk detected. "
        "Immediate specialist evaluation advised."
    )


def fuse_scores(
    xray_score=None,
    video_score=None,
    sensor_score=None,
    questionnaire_score=None,
    xray_conf=None,
    video_conf=None,
    sensor_conf=None,
    questionnaire_conf=None
):

    weights = {
        "xray": 0.40,
        "video": 0.25,
        "sensor": 0.15,
        "questionnaire": 0.20
    }

    weighted_sum = 0
    total_weight = 0
    modalities_used = 0

    if xray_score is not None:
        weighted_sum += xray_score * weights["xray"]
        total_weight += weights["xray"]
        modalities_used += 1

    if video_score is not None:
        weighted_sum += video_score * weights["video"]
        total_weight += weights["video"]
        modalities_used += 1

    if sensor_score is not None:
        weighted_sum += sensor_score * weights["sensor"]
        total_weight += weights["sensor"]
        modalities_used += 1
    if questionnaire_score is not None:
         weighted_sum += questionnaire_score * weights["questionnaire"]
         total_weight += weights["questionnaire"]
         modalities_used += 1
    if total_weight == 0:
        raise ValueError("No modality data available")

    final_score = weighted_sum / total_weight

    confidence = get_confidence(
        xray_score,
        video_score,
        sensor_score,
        questionnaire_score
    )

    return {
        "overall_koa_score": round(final_score, 2),
        "severity": get_severity(final_score),
        "confidence": confidence,
        "modalities_used": modalities_used,
        "recommendation": get_recommendation(final_score)
    }