from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SIZE = 128


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle((6, 6, 122, 122), radius=26, fill="#101820")
    draw.rounded_rectangle((14, 14, 114, 114), radius=21, outline="#2DD4BF", width=3)

    draw.polygon([(64, 24), (96, 38), (91, 78), (64, 105), (37, 78), (32, 38)], fill="#E2E8F0")
    draw.polygon([(64, 34), (84, 43), (81, 70), (64, 89), (47, 70), (44, 43)], fill="#0F766E")

    for y in (49, 61, 73):
        draw.rounded_rectangle((50, y, 78, y + 5), radius=2, fill="#CCFBF1")

    draw.line((42, 92, 86, 36), fill="#FACC15", width=6)
    draw.line((42, 92, 86, 36), fill="#854D0E", width=2)

    image.save(ASSETS / "icon.png")


if __name__ == "__main__":
    main()
