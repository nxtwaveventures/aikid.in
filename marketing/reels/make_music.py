"""Original, royalty-free 15s kids' jingle for the Story Lab Reels.

Marimba-style melody + soft bass + shaker, C major, 120 bpm, with a 1s fade-out.
Pure standard library, so it runs anywhere: python3 make_music.py jingle.wav
"""
import math
import random
import struct
import sys
import wave

SR = 44100
BPM = 120
BEAT = 60 / BPM
LENGTH = 15.0

NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def freq(name: str) -> float:
    """'C5' -> Hz"""
    pitch, octave = name[:-1], int(name[-1])
    return NOTE[pitch] * 2 ** (octave - 4)


# (note, beats) — a bouncy, sing-song phrase that repeats with a different ending
PHRASE_A = [("C5", .5), ("E5", .5), ("G5", .5), ("E5", .5), ("A5", .5), ("G5", .5), ("E5", 1),
            ("D5", .5), ("F5", .5), ("A5", .5), ("F5", .5), ("G5", 1), ("R", 1)]
PHRASE_B = [("C5", .5), ("E5", .5), ("G5", .5), ("C6", .5), ("B5", .5), ("G5", .5), ("A5", 1),
            ("G5", .5), ("E5", .5), ("D5", .5), ("E5", .5), ("C5", 1.5), ("R", .5)]
MELODY = PHRASE_A + PHRASE_B + PHRASE_A + PHRASE_B
BASS = ["C3", "C3", "F3", "G3", "C3", "A2", "F2", "G2"] * 2  # one note per 2 beats

n = int(SR * LENGTH)
buf = [0.0] * n


def add_tone(start: float, dur: float, f: float, amp: float, decay: float, harmonics=((1, 1.0), (4, .25), (10, .06))):
    s0 = int(start * SR)
    length = int(min(dur + .6, LENGTH - start) * SR)
    for i in range(length):
        idx = s0 + i
        if idx >= n:
            break
        t = i / SR
        env = math.exp(-t * decay) * min(1.0, t * 400)  # fast attack, marimba-like decay
        v = sum(a * math.sin(2 * math.pi * f * h * t) for h, a in harmonics)
        buf[idx] += amp * env * v


# melody
t = 0.0
for name, beats in MELODY:
    dur = beats * BEAT
    if name != "R" and t < LENGTH:
        add_tone(t, dur, freq(name), .22, 6.0)
    t += dur

# bass (soft, rounder tone)
for i, name in enumerate(BASS):
    start = i * 2 * BEAT
    if start < LENGTH:
        add_tone(start, 2 * BEAT, freq(name), .20, 2.5, harmonics=((1, 1.0), (2, .3)))

# shaker on off-beats
random.seed(7)
for k in range(int(LENGTH / (BEAT / 2))):
    if k % 2 == 1:
        s0 = int(k * BEAT / 2 * SR)
        for i in range(int(.06 * SR)):
            if s0 + i < n:
                buf[s0 + i] += .05 * math.exp(-i / SR * 60) * (random.random() * 2 - 1)

# 1s fade-out, normalise
fade = int(1.0 * SR)
for i in range(fade):
    buf[n - fade + i] *= 1 - i / fade
peak = max(abs(x) for x in buf) or 1
buf = [x / peak * .8 for x in buf]

out = sys.argv[1] if len(sys.argv) > 1 else "jingle.wav"
with wave.open(out, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(x * 32767)) for x in buf))
print(f"wrote {out}")
