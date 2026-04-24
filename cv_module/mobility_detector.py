"""
Mobility detection pipeline.

Converts camera frames into structured mobility events. When MediaPipe and
OpenCV are installed, uses real pose estimation; otherwise runs in simulation
mode, cycling through representative states so the full stack remains
demoable without GPU/camera hardware.

The detector only *describes* movement. Risk scoring and alerting live in the
backend Fall Risk Engine.
"""
from __future__ import annotations

import math
import random
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Deque, Iterator, Optional

try:  # pragma: no cover - optional deps
    import cv2  # type: ignore
    import mediapipe as mp  # type: ignore
    _HAS_CV = True
except Exception:  # pragma: no cover
    cv2 = None  # type: ignore
    mp = None  # type: ignore
    _HAS_CV = False


# ---------------------------------------------------------------------------
# Event type
# ---------------------------------------------------------------------------

MOBILITY_STATES = (
    "lying",
    "sitting",
    "standing",
    "unstable_standing",
    "bed_exit_attempt",
    "unsteady_gait",
    "repositioning",
)


@dataclass
class MobilityEvent:
    event_type: str
    confidence: float
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_payload(self, patient_id: str) -> dict:
        return {
            "patient_id": patient_id,
            "event_type": self.event_type,
            "confidence": round(self.confidence, 3),
            "timestamp": self.timestamp.isoformat(),
            "source": "camera_cv",
        }


# ---------------------------------------------------------------------------
# Pose-based classifier (real CV path)
# ---------------------------------------------------------------------------

class PoseMobilityClassifier:
    """
    Classifies mobility states from MediaPipe Pose landmarks.

    Heuristics are intentionally simple and explainable:
      * torso_angle      — angle of shoulder→hip vector from vertical
      * hip_y            — normalized hip height (0 top, 1 bottom of frame)
      * ankle_y          — normalized ankle height
      * sway             — short-window std-dev of torso angle (balance proxy)
    """

    def __init__(self, history: int = 15):
        self._torso_angles: Deque[float] = deque(maxlen=history)
        self._hip_ys: Deque[float] = deque(maxlen=history)
        self._last_state: str = "lying"

    # landmark indices per MediaPipe Pose
    _L_SHOULDER, _R_SHOULDER = 11, 12
    _L_HIP, _R_HIP = 23, 24
    _L_ANKLE, _R_ANKLE = 27, 28

    def classify(self, landmarks) -> MobilityEvent:
        def mid(a, b):
            return ((a.x + b.x) / 2, (a.y + b.y) / 2, (a.visibility + b.visibility) / 2)

        ls, rs = landmarks[self._L_SHOULDER], landmarks[self._R_SHOULDER]
        lh, rh = landmarks[self._L_HIP], landmarks[self._R_HIP]
        la, ra = landmarks[self._L_ANKLE], landmarks[self._R_ANKLE]

        sx, sy, svis = mid(ls, rs)
        hx, hy, hvis = mid(lh, rh)
        ax, ay, avis = mid(la, ra)

        # Angle from vertical (0 = upright, 90 = horizontal)
        dx, dy = hx - sx, hy - sy
        torso_angle = math.degrees(math.atan2(abs(dx), abs(dy) + 1e-6))

        self._torso_angles.append(torso_angle)
        self._hip_ys.append(hy)

        # Sway = short-window std dev of torso angle
        if len(self._torso_angles) >= 5:
            mean = sum(self._torso_angles) / len(self._torso_angles)
            sway = math.sqrt(sum((a - mean) ** 2 for a in self._torso_angles) / len(self._torso_angles))
        else:
            sway = 0.0

        # Visibility-weighted confidence
        conf = min(1.0, max(0.0, (svis + hvis + avis) / 3))

        # Decision tree
        if torso_angle > 55:
            # Torso close to horizontal
            if len(self._torso_angles) >= 5 and sway > 4:
                state = "repositioning"
            else:
                state = "lying"
        elif torso_angle > 30:
            state = "sitting"
        else:
            # Upright
            standing = ay > hy + 0.15  # ankles clearly below hips
            if standing and sway > 8:
                state = "unstable_standing"
            elif standing and self._last_state in ("sitting", "lying"):
                state = "bed_exit_attempt"
            elif standing:
                state = "standing"
            else:
                state = "sitting"

        # Gait heuristic: alternating ankle oscillation while standing
        if state == "standing" and len(self._hip_ys) >= 10:
            hip_range = max(self._hip_ys) - min(self._hip_ys)
            if hip_range > 0.08 and sway > 5:
                state = "unsteady_gait"

        self._last_state = state
        return MobilityEvent(event_type=state, confidence=conf)


# ---------------------------------------------------------------------------
# Camera driver
# ---------------------------------------------------------------------------

class CameraMobilityDetector:
    """Iterator producing MobilityEvents from a live camera feed."""

    def __init__(self, camera_index: int = 0, min_interval_s: float = 1.0):
        if not _HAS_CV:
            raise RuntimeError(
                "opencv-python and mediapipe are required for camera mode. "
                "Install them with `pip install -r cv_module/requirements.txt`, "
                "or use --simulate."
            )
        self._cap = cv2.VideoCapture(camera_index)
        if not self._cap.isOpened():
            raise RuntimeError(f"Could not open camera index {camera_index}")
        self._pose = mp.solutions.pose.Pose(
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._classifier = PoseMobilityClassifier()
        self._min_interval = min_interval_s
        self._last_emit = 0.0
        self._last_state: Optional[str] = None

    def __iter__(self) -> Iterator[MobilityEvent]:
        return self

    def __next__(self) -> MobilityEvent:
        while True:
            ok, frame = self._cap.read()
            if not ok:
                raise StopIteration
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self._pose.process(rgb)
            if not result.pose_landmarks:
                continue
            event = self._classifier.classify(result.pose_landmarks.landmark)

            now = time.time()
            # Throttle: emit on state change OR every min_interval seconds
            if event.event_type != self._last_state or (now - self._last_emit) >= self._min_interval:
                self._last_state = event.event_type
                self._last_emit = now
                return event

    def close(self) -> None:
        try:
            self._cap.release()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Simulation driver (no camera required)
# ---------------------------------------------------------------------------

class SimulatedMobilityDetector:
    """
    Emits a realistic-looking mobility event stream for demos and tests.

    The sequence walks through a plausible patient storyline:
        lying → repositioning → sitting → standing → unstable_standing →
        bed_exit_attempt → unsteady_gait → sitting → lying
    with jittered confidences.
    """

    _SCRIPT = [
        ("lying", 0.95, 3),
        ("repositioning", 0.82, 2),
        ("sitting", 0.88, 2),
        ("standing", 0.85, 2),
        ("unstable_standing", 0.87, 2),
        ("bed_exit_attempt", 0.91, 1),
        ("unsteady_gait", 0.84, 2),
        ("sitting", 0.9, 2),
        ("lying", 0.93, 3),
    ]

    def __init__(self, interval_s: float = 2.0, seed: Optional[int] = None):
        self._interval = interval_s
        self._rng = random.Random(seed)
        self._queue: list[MobilityEvent] = []
        self._build_queue()

    def _build_queue(self) -> None:
        for state, base_conf, repeats in self._SCRIPT:
            for _ in range(repeats):
                jitter = self._rng.uniform(-0.05, 0.05)
                self._queue.append(MobilityEvent(
                    event_type=state,
                    confidence=max(0.0, min(1.0, base_conf + jitter)),
                ))

    def __iter__(self) -> Iterator[MobilityEvent]:
        return self

    def __next__(self) -> MobilityEvent:
        if not self._queue:
            self._build_queue()
        time.sleep(self._interval)
        event = self._queue.pop(0)
        event.timestamp = datetime.now(timezone.utc)
        return event

    def close(self) -> None:
        pass


def build_detector(camera: Optional[int], simulate: bool, interval_s: float = 2.0):
    """Return an appropriate iterator of MobilityEvent."""
    if simulate or not _HAS_CV or camera is None:
        return SimulatedMobilityDetector(interval_s=interval_s)
    return CameraMobilityDetector(camera_index=camera, min_interval_s=interval_s)
