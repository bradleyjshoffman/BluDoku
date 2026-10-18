"""
Cuts a single recording of all the cheers into BluDoku's voice clips.

Record the 11 lines in order with about a one-second pause between them:
    Nice! · Good one! · Yay! · Brilliant! · Wow! · Amazing! · Fantastic! ·
    Spectacular! · Incredible! · Unbelievable! · INSANE!

Run (needs numpy, soundfile and imageio-ffmpeg; any audio format works):
    python scripts/split-recording.py "path/to/Recording.m4a"
Then bump VOICE_VERSION in src/lib/sound.ts so phones fetch the new clips.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf

# In recording order: mildest first, "INSANE!" last.
NAMES = [f"cheer-{n}" for n in range(10, 0, -1)] + ["win"]
RATE = 24000
OUT = Path(__file__).resolve().parent.parent / "public" / "sounds"


def load(path: str) -> np.ndarray:
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "in.wav"
        subprocess.run(
            [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y",
             "-i", path, "-ac", "1", "-ar", str(RATE), str(wav)],
            check=True,
        )
        audio, _ = sf.read(wav)
    return audio


def find_lines(audio: np.ndarray) -> list[tuple[int, int]]:
    """Sample ranges of each spoken line, found by looking for pauses."""
    frame = int(RATE * 0.02)
    n = len(audio) // frame
    rms = np.sqrt(np.mean(audio[: n * frame].reshape(n, frame) ** 2, axis=1))
    db = 20 * np.log10(rms + 1e-9)
    threshold = max(np.percentile(db, 15) + 12, db.max() - 38)
    voiced = db > threshold
    segments, start, end, gap = [], None, 0, 0
    for i, v in enumerate(voiced):
        if v:
            start = i if start is None else start
            end, gap = i, 0
        elif start is not None:
            gap += 1
            if gap >= 15:  # 0.3 s of quiet ends a line
                segments.append((start, end))
                start = None
    if start is not None:
        segments.append((start, end))
    segments = [(s, e) for s, e in segments if e - s >= 5]  # drop clicks under 0.1 s
    return [(s * frame, (e + 1) * frame) for s, e in segments]


audio = load(sys.argv[1])
lines = find_lines(audio)
if len(lines) < len(NAMES):
    sys.exit(f"Found {len(lines)} lines but need {len(NAMES)}. Leave clearer pauses between lines.")
# If a line was re-done, keep the last takes.
lines = lines[-len(NAMES):]

peaks = [float(np.max(np.abs(audio[s:e]))) for s, e in lines]
loudest = max(peaks)
pre, post, fade = int(0.08 * RATE), int(0.1 * RATE), int(0.012 * RATE)
for name, (s, e), peak in zip(NAMES, lines, peaks):
    clip = audio[max(0, s - pre) : min(len(audio), e + post)].copy()
    # Lift quiet lines halfway toward the loudest, keeping some of the build-up.
    gain = 0.9 / loudest * np.sqrt(loudest / peak)
    clip = np.clip(clip * gain, -1, 1)
    ramp = np.linspace(0, 1, fade)
    clip[:fade] *= ramp
    clip[-fade:] *= ramp[::-1]
    sf.write(OUT / f"{name}.wav", clip, RATE, subtype="PCM_16")
    print(f"{name}: {len(clip) / RATE:.2f}s")
