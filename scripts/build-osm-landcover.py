"""Create the display layer from the pinned Geofabrik Jiangsu shapefile archive.

Run from the repository root: python scripts/build-osm-landcover.py
Requires pyshp and shapely. The archive and optional local pyshp installation
are kept in local-data/, which is excluded from Git.
"""
import io
import json
import sys
import warnings
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'local-data' / 'python'))
import shapefile  # noqa: E402
from shapely.geometry import box, mapping, shape  # noqa: E402

ARCHIVE = ROOT / 'local-data' / 'jiangsu-261027-free.shp.zip'
BOUNDS = (119.78, 30.66, 121.52, 32.14)
clip = box(*BOUNDS)
features = []
counts = Counter()
warnings.filterwarnings('ignore')

with zipfile.ZipFile(ARCHIVE) as archive:
    for stem, kinds in [('gis_osm_water_a_free_1', {'water', 'riverbank', 'reservoir'}),
                        ('gis_osm_landuse_a_free_1', {'forest'})]:
        streams = {ext: io.BytesIO(archive.read(stem + '.' + ext)) for ext in ('shp', 'shx', 'dbf')}
        reader = shapefile.Reader(**streams, encoding='utf-8')
        for item in reader.iterShapeRecords(bbox=BOUNDS):
            kind = item.record[2]
            if kind not in kinds:
                continue
            try:
                geom = shape(item.shape.__geo_interface__)
                if not geom.is_valid:
                    geom = geom.buffer(0)
                geom = geom.intersection(clip).simplify(0.00008, preserve_topology=True)
                if geom.is_empty or geom.area < 0.000003 or geom.geom_type not in ('Polygon', 'MultiPolygon'):
                    continue
                features.append({'type': 'Feature', 'properties': {'kind': 'forest' if kind == 'forest' else 'water',
                                  'name': item.record[3] or '', 'osm_id': item.record[0]}, 'geometry': mapping(geom)})
                counts[kind] += 1
            except Exception:
                counts['invalid'] += 1

output = {'type': 'FeatureCollection', 'metadata': {
    'source': 'OpenStreetMap contributors via Geofabrik Jiangsu 2026-10-27',
    'license': 'ODbL 1.0', 'source_url': 'https://download.geofabrik.de/asia/china/jiangsu.html',
    'note': 'Incomplete mapped coverage; simplified for display'}, 'features': features}
with (ROOT / 'public' / 'suzhou-landcover-osm.geojson').open('w', encoding='utf-8') as stream:
    json.dump(output, stream, ensure_ascii=False, separators=(',', ':'))
print(dict(counts))
