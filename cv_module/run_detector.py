"""
CLI entry point for the Nurseflow CV mobility module.

Streams mobility events from a camera (or simulation) and POSTs them to the
backend Fall Risk Engine.

Example:
    python run_detector.py --patient-id <uuid> --token <jwt> --simulate
    python run_detector.py --patient-id <uuid> --token <jwt> --camera 0
"""
from __future__ import annotations

import argparse
import sys
import time

import requests

from mobility_detector import build_detector


def main() -> int:
    parser = argparse.ArgumentParser(description="Nurseflow CV Mobility Module")
    parser.add_argument("--patient-id", required=True, help="Patient UUID")
    parser.add_argument("--token", required=True, help="Bearer JWT for the backend")
    parser.add_argument(
        "--api-base",
        default="http://localhost:8000/api/v1",
        help="Backend API base URL",
    )
    parser.add_argument("--camera", type=int, default=None, help="Camera device index")
    parser.add_argument("--simulate", action="store_true", help="Use simulated event stream")
    parser.add_argument("--interval", type=float, default=2.0, help="Min seconds between events")
    args = parser.parse_args()

    endpoint = f"{args.api_base.rstrip('/')}/fall-risk/mobility-event"
    headers = {"Authorization": f"Bearer {args.token}", "Content-Type": "application/json"}

    detector = build_detector(camera=args.camera, simulate=args.simulate, interval_s=args.interval)
    print(f"[cv] detector: {type(detector).__name__} -> {endpoint}")

    try:
        for event in detector:
            payload = event.to_payload(args.patient_id)
            try:
                r = requests.post(endpoint, json=payload, headers=headers, timeout=5)
                status = f"{r.status_code}"
                if r.status_code >= 400:
                    status += f" {r.text[:200]}"
            except requests.RequestException as e:
                status = f"error: {e}"
            print(
                f"[cv] {event.timestamp.strftime('%H:%M:%S')} "
                f"{event.event_type:<22} conf={event.confidence:.2f}  -> {status}"
            )
    except KeyboardInterrupt:
        print("\n[cv] stopped")
    finally:
        detector.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
