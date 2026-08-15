#!/usr/bin/env python3
"""Render a dark terminal PNG from UTF-8 text. Usage: render_terminal_frame.py infile.txt outfile.png"""
import sys
from PIL import Image, ImageDraw, ImageFont

text = open(sys.argv[1], encoding="utf-8").read()
width, height = 1200, 700
img = Image.new("RGB", (width, height), (26, 27, 38))
draw = ImageDraw.Draw(img)
draw.ellipse((16, 14, 32, 30), fill=(255, 95, 86))
draw.ellipse((40, 14, 56, 30), fill=(255, 189, 46))
draw.ellipse((64, 14, 80, 30), fill=(39, 201, 63))
font = None
for path in (
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/SFNSMono.ttf",
    "/Library/Fonts/Menlo.ttc",
):
    try:
        font = ImageFont.truetype(path, 18)
        break
    except OSError:
        continue
if font is None:
    font = ImageFont.load_default()
draw.text((24, 48), text, fill=(230, 237, 243), font=font, spacing=6)
img.save(sys.argv[2])
