"""
Records BluDoku's enthusiastic voice clips with Kokoro, an open-source
(Apache 2.0) text-to-speech model that runs locally.

Setup (once):
    python -m venv kokoro-env
    kokoro-env/Scripts/python -m pip install kokoro-onnx soundfile
    Download kokoro-v1.0.onnx and voices-v1.0.bin from
    https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

Run:
    kokoro-env/Scripts/python scripts/make-voices.py <folder with the model files> [voice]
    node scripts/trim-sounds.mjs
"""

import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

LINES = {
    # Finding a cat: enthusiasm builds as more cats are found.
    "find-1a": "Nice!",
    "find-1b": "Yes!",
    "find-1c": "Ooh!",
    "find-1d": "Good one!",
    "find-2a": "Wow!",
    "find-2b": "Amazing!",
    "find-2c": "Fantastic!",
    "find-2d": "Brilliant!",
    "find-3a": "Incredible!",
    "find-3b": "Unbelievable!",
    "find-3c": "Spectacular!",
    "find-3d": "Phenomenal!",
    # Winning.
    "win-a": "You did it! Absolutely incredible!",
    "win-b": "Oh my gosh! You're a genius!",
    "win-c": "Purrfect! Simply legendary!",
    "win-d": "Wow, wow, wow! You're amazing!",
}

model_dir = Path(sys.argv[1])
voice = sys.argv[2] if len(sys.argv) > 2 else "af_heart"
out_dir = Path(__file__).resolve().parent.parent / "public" / "sounds"

kokoro = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))
for name, text in LINES.items():
    samples, rate = kokoro.create(text, voice=voice, speed=1.05, lang="en-us")
    # Normalize loudness so every clip plays at a similar volume.
    peak = float(np.max(np.abs(samples))) or 1.0
    samples = samples / peak * 0.9
    sf.write(out_dir / f"{name}.wav", samples, rate, subtype="PCM_16")
    print(f"recorded {name}: {len(samples) / rate:.2f}s")
