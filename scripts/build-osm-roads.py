"""Rasterize mapped roads from a pinned Geofabrik Jiangsu extract.

Run from the repository root: python scripts/build-osm-roads.py
Requires pyshp and Pillow. Install pyshp into ignored local-data/python/.
Keep the downloaded source archive in ignored local-data/ as
jiangsu-261030-free.shp.zip; only the derived display texture is committed.
"""

import io
import hashlib
import json
import sys
import zipfile
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "local-data" / "python"))
import shapefile  # noqa: E402

ARCHIVE = ROOT / "local-data" / "jiangsu-261030-free.shp.zip"
ARCHIVE_SHA256 = "2c594551a2fbce6a0e2a83f4ff1f3047d957fac04f007e1c817b7d8fa8f3d871"
BOUNDS = (119.78, 30.66, 121.52, 32.14)  # west, south, east, north
SIZE = 4096

# These are cartographic classes, not measured traffic or actual illumination.
STYLES = {
    "motorway": (4, (255, 191, 110, 240)),
    "trunk": (4, (255, 190, 107, 230)),
    "primary": (3, (255, 200, 130, 220)),
    "secondary": (2, (255, 209, 156, 178)),
    "tertiary": (1, (255, 223, 184, 142)),
    "residential": (1, (255, 225, 195, 100)),
    "unclassified": (1, (255, 221, 184, 85)),
    "living_street": (1, (255, 225, 195, 100)),
    "motorway_link": (2, (255, 191, 110, 175)),
    "trunk_link": (2, (255, 190, 107, 175)),
    "primary_link": (2, (255, 200, 130, 155)),
    "secondary_link": (1, (255, 209, 156, 125)),
    "tertiary_link": (1, (255, 223, 184, 110)),
}


def pixel(lon, lat):
    return (
        round((lon - BOUNDS[0]) / (BOUNDS[2] - BOUNDS[0]) * (SIZE - 1)),
        round((BOUNDS[3] - lat) / (BOUNDS[3] - BOUNDS[1]) * (SIZE - 1)),
    )


def draw_roads():
    actual_hash = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    if actual_hash != ARCHIVE_SHA256:
        raise ValueError(f"Jiangsu source archive hash mismatch: {actual_hash}")
    core = Image.new("RGBA", (SIZE, SIZE))
    drawing = ImageDraw.Draw(core, "RGBA")
    counts = Counter()

    with zipfile.ZipFile(ARCHIVE) as archive:
        stem = "gis_osm_roads_free_1"
        streams = {ext: io.BytesIO(archive.read(f"{stem}.{ext}")) for ext in ("shp", "shx", "dbf")}
        reader = shapefile.Reader(**streams, encoding="utf-8")
        for item in reader.iterShapeRecords(bbox=BOUNDS):
            road_class = item.record[2]
            style = STYLES.get(road_class)
            if not style:
                continue
            width, color = style
            points = item.shape.points
            breaks = list(item.shape.parts) + [len(points)]
            for start, end in zip(breaks, breaks[1:]):
                segment = [pixel(lon, lat) for lon, lat in points[start:end]]
                if len(segment) >= 2:
                    drawing.line(segment, fill=color, width=width, joint="curve")
                    counts[road_class] += 1

    # A soft halo makes the mapped network legible at city scale. It is an
    # illustration effect, not a claim that street lights were observed.
    glow = core.filter(ImageFilter.GaussianBlur(2.1))
    glow.putalpha(glow.getchannel("A").point(lambda alpha: round(alpha * 0.6)))
    result = Image.alpha_composite(glow, core)
    result = result.quantize(colors=96, method=Image.Quantize.FASTOCTREE)
    tile_edges = [0, 1365, 2730, SIZE]
    tile_dir = ROOT / "public" / "road-night"
    tile_dir.mkdir(exist_ok=True)
    for row in range(3):
        for col in range(3):
            result.crop((tile_edges[col], tile_edges[row], tile_edges[col + 1], tile_edges[row + 1])).save(
                tile_dir / f"road-{col}-{row}.png", optimize=True
            )
    metadata = {
        "source": "OpenStreetMap contributors via Geofabrik Jiangsu 2026-10-30",
        "source_url": "https://download.geofabrik.de/asia/china/jiangsu.html",
        "license": "ODbL 1.0",
        "source_archive_sha256": ARCHIVE_SHA256,
        "bounds": BOUNDS,
        "texture_size": SIZE,
        "tile_edges": tile_edges,
        "rendering": "Road positions and classes are mapped; colors and glow are illustrative, not measured night lighting or traffic.",
        "road_segments_by_class": dict(counts),
    }
    (ROOT / "public" / "suzhou-roads-metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(metadata["road_segments_by_class"])


if __name__ == "__main__":
    draw_roads()
