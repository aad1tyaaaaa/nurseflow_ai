# Nurseflow CV Mobility Module

Standalone Computer Vision pipeline that monitors a patient's room camera,
classifies mobility states using pose estimation, and posts structured events
to the Nurseflow backend Fall Risk Engine.

```
Camera feed  ──►  Pose estimation  ──►  State classifier  ──►  POST /fall-risk/mobility-event
                 (MediaPipe / mock)     (lying/sitting/standing/
                                         unstable_standing/bed_exit_attempt)
```

## Responsibility

This module **only detects and classifies movement**.
All risk evaluation, scoring, and alert generation live in the backend.

## Supported mobility states

| state                  | description                                    |
|------------------------|------------------------------------------------|
| `lying`                | patient horizontal on bed                      |
| `sitting`              | torso vertical, hips on bed                    |
| `standing`             | full vertical posture, stable                  |
| `unstable_standing`    | standing with excessive sway (balance loss)    |
| `bed_exit_attempt`     | transition sitting→standing near bed boundary  |
| `unsteady_gait`        | walking with irregular step rhythm             |
| `repositioning`        | small posture shift while lying                |

## Install

```powershell
cd cv_module
pip install -r requirements.txt
```

> MediaPipe and OpenCV are optional. If they are not installed, the detector
> automatically falls back to **simulation mode**, which is useful for demos
> and CI.

## Run

Get a JWT from the backend first (`POST /api/v1/auth/login`), then:

```powershell
# Simulation — cycles through mobility states and posts events
python run_detector.py `
  --patient-id <uuid> `
  --token <jwt> `
  --simulate

# Real camera (requires opencv-python + mediapipe)
python run_detector.py `
  --patient-id <uuid> `
  --token <jwt> `
  --camera 0
```

## Event payload

```json
{
  "patient_id": "0a0ef8cd-f87b-4cdb-8f13-6ab682aaaf6c",
  "event_type": "unstable_standing",
  "confidence": 0.87,
  "timestamp": "2026-04-24T02:13:00Z",
  "source": "camera_cv"
}
```
