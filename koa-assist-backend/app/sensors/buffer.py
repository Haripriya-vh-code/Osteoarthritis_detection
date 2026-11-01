from collections import defaultdict
import threading
from typing import List, Dict, Any

class SensorDataBuffer:
    def __init__(self, target_window_size: int = 100):
        self.target_window_size = target_window_size
        self._buffers: Dict[str, List[Dict[str, float]]] = defaultdict(list)
        self._lock = threading.Lock()

    def add_reading(self, session_uid: str, reading: Dict[str, float]) -> int:
        with self._lock:
            self._buffers[session_uid].append(reading)
            return len(self._buffers[session_uid])

    def get_sample_count(self, session_uid: str) -> int:
        with self._lock:
            return len(self._buffers[session_uid])

    def is_ready(self, session_uid: str) -> bool:
        with self._lock:
            return len(self._buffers[session_uid]) >= self.target_window_size

    def get_and_clear_buffer(self, session_uid: str) -> List[Dict[str, float]]:
        with self._lock:
            samples = self._buffers.pop(session_uid, [])
            return samples

# Global singleton buffer instance
sensor_buffer = SensorDataBuffer(target_window_size=100)