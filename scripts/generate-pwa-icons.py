from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / "public" / "favicon.ico").convert("RGBA")


def save_icon(name: str, size: int, maskable: bool = False) -> None:
    if maskable:
        canvas = Image.new("RGBA", (size, size), "#dc2626")
        artwork = ImageOps.contain(source, (round(size * 0.68), round(size * 0.68)), Image.Resampling.LANCZOS)
        x = (size - artwork.width) // 2
        y = (size - artwork.height) // 2
        canvas.alpha_composite(artwork, (x, y))
    else:
        canvas = ImageOps.contain(source, (size, size), Image.Resampling.LANCZOS)
    canvas.save(ROOT / "public" / name, "PNG", optimize=True)


save_icon("icon-180.png", 180)
save_icon("icon-192.png", 192)
save_icon("icon-512.png", 512)
save_icon("icon-maskable-512.png", 512, maskable=True)
