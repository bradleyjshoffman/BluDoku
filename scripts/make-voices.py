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
Then bump VOICE_VERSION in src/lib/sound.ts so phones fetch the new clips.
"""

import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

# Cheers are fixed by how many cats are left, so every level builds to the same
# climax: "cheer-1" is always the second-to-last cat, "win" is the last cat.
# Each line: (text, speed), at most two words. Later lines are delivered a touch faster.
LINES = {
    "cheer-10": ("Nice!", 1.0),
    "cheer-9": ("Good one!", 1.0),
    "cheer-8": ("Yay!", 1.02),
    "cheer-7": ("Brilliant!", 1.03),
    "cheer-6": ("Wow!", 1.04),
    "cheer-5": ("Amazing!", 1.05),
    "cheer-4": ("Fantastic!", 1.07),
    "cheer-3": ("Spectacular!", 1.08),
    "cheer-2": ("Incredible!", 1.09),
    "cheer-1": ("Unbelievable!", 1.1),
    "win": ("INSANE!", 0.92),
}

model_dir = Path(sys.argv[1])
voice = sys.argv[2] if len(sys.argv) > 2 else "af_heart"
out_dir = Path(__file__).resolve().parent.parent / "public" / "sounds"

kokoro = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))
for name, (text, speed) in LINES.items():
    samples, rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
    # Normalize loudness so every clip plays at a similar volume.
    peak = float(np.max(np.abs(samples))) or 1.0
    samples = samples / peak * 0.9
    sf.write(out_dir / f"{name}.wav", samples, rate, subtype="PCM_16")
    print(f"recorded {name}: {len(samples) / rate:.2f}s")
