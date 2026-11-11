#!/usr/bin/env python3
"""
Make small versions of the botanical plates for the plant cards on the main page.

    python3 tools/make-thumbs.py

For every images/plants/<name>.jpg it writes images/plants/thumbs/<name>.jpg
(320 px wide, about 25-35 KB). Existing thumbnails are only remade when the plate
is newer. Uses macOS's built-in `sips`, so nothing needs installing.
"""
import glob
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'images', 'plants')
DST = os.path.join(SRC, 'thumbs')
WIDTH = 320

os.makedirs(DST, exist_ok=True)
made = 0
plates = sorted(glob.glob(os.path.join(SRC, '*.jpg')))
for plate in plates:
    thumb = os.path.join(DST, os.path.basename(plate))
    if os.path.exists(thumb) and os.path.getmtime(thumb) >= os.path.getmtime(plate):
        continue
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '55',
                    '--resampleWidth', str(WIDTH), plate, '--out', thumb],
                   check=True, capture_output=True)
    made += 1

# Remove thumbnails whose plate no longer exists
names = {os.path.basename(p) for p in plates}
removed = 0
for thumb in glob.glob(os.path.join(DST, '*.jpg')):
    if os.path.basename(thumb) not in names:
        os.remove(thumb)
        removed += 1

print('%d thumbnails made, %d removed, %d plates in total.' % (made, removed, len(plates)))
