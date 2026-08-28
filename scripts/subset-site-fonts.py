"""Build site-specific WOFF2 files from the ignored original Noto TTF files."""

from pathlib import Path
from tempfile import NamedTemporaryFile

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "font"
OUTPUT_DIR = ROOT / "public" / "fonts"
CONTENT_EXTENSIONS = {".css", ".ts", ".tsx"}


def site_text() -> str:
    text = "".join(chr(codepoint) for codepoint in range(0x20, 0x100))
    for path in sorted((ROOT / "app").rglob("*")):
        if path.is_file() and path.suffix in CONTENT_EXTENSIONS:
            text += path.read_text(encoding="utf-8")
    return text


def build_subset(source: Path, destination: Path, text: str) -> None:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]

    font = TTFont(source)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.flavor = "woff2"

    with NamedTemporaryFile(dir=destination.parent, suffix=".woff2", delete=False) as temp:
        temp_path = Path(temp.name)
    try:
        font.save(temp_path)
        temp_path.replace(destination)
    finally:
        temp_path.unlink(missing_ok=True)

    with TTFont(destination) as built_font, TTFont(source) as source_font:
        if destination.read_bytes()[:4] != b"wOF2":
            raise ValueError(f"Unexpected file signature for {destination}")
        if built_font["OS/2"].usWeightClass != source_font["OS/2"].usWeightClass:
            raise ValueError(f"Weight changed while subsetting {destination}")


def main() -> None:
    text = site_text()
    sources = sorted(SOURCE_DIR.glob("Noto*.ttf"))
    if not sources:
        raise SystemExit(f"No source TTF files found in {SOURCE_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source in sources:
        destination = OUTPUT_DIR / f"{source.stem}.woff2"
        build_subset(source, destination, text)
        with TTFont(destination) as built_font:
            print(
                f"{destination.name}: {destination.stat().st_size:,} bytes, "
                f"{len(built_font.getGlyphOrder()):,} glyphs, "
                f"weight {built_font['OS/2'].usWeightClass}"
            )


if __name__ == "__main__":
    main()
