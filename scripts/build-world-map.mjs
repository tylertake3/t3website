/* Turns the world-atlas country outlines into flat SVG paths, once, at author
   time. The site ships the finished paths only: no mapping library reaches the
   browser and nothing is fetched at runtime.

   Run with: node scripts/build-world-map.mjs   */
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { feature, merge } from 'topojson-client';
import { geoNaturalEarth1, geoPath } from 'd3-geo';

const require = createRequire(import.meta.url);
const topology = require('world-atlas/countries-110m.json');

const WIDTH = 1000;

const countries = feature(topology, topology.objects.countries);

/* One decimal place is already sub-pixel at this size, and it roughly halves
   the amount of path data the page has to carry. */
const round = (d) => d.replace(/(\d+)\.(\d)\d+/g, '$1.$2');

/* The backdrop is the world's coastline as a single shape rather than 177
   separate countries: the internal borders are never drawn, so carrying them
   would be dead weight. Individual outlines are kept only for the countries
   that get highlighted. */
/* Antarctica adds a heavy band across the foot of every world map and says
   nothing here, so it is dropped. The rest is merged into a single coastline
   so no internal borders are carried in the path data. */
const mainland = topology.objects.countries.geometries.filter(
  (g) => g.properties.name !== 'Antarctica'
);
const landShape = merge(topology, mainland);

/* Natural Earth: the usual compromise projection, keeping country shapes
   recognisable without Mercator's polar exaggeration. */
const projection = geoNaturalEarth1().fitWidth(WIDTH, landShape);
const path = geoPath(projection);
const [[, minY], [, maxY]] = path.bounds(landShape);
const HEIGHT = Math.ceil(maxY - minY);
projection.translate([projection.translate()[0], projection.translate()[1] - minY]);

const land = round(path(landShape) || '');

const shapes = countries.features
  .map((f) => ({ id: String(f.id), name: f.properties.name, d: round(path(f) || '') }))
  .filter((c) => c.d);

/* Where the agency has worked. Every entry gets a marker; the country it sits
   in gets filled. `territory` is what the headline count counts: England,
   Wales and Scotland each count, while Los Angeles and New York are two
   markers in one country. Coordinates are [longitude, latitude]. */
const PLACES = [
  { name: 'England', country: '826', at: [-1.5, 52.5] },
  { name: 'Wales', country: '826', at: [-3.6, 52.3] },
  { name: 'Scotland', country: '826', at: [-4.2, 56.5] },
  { name: 'Ireland', country: '372', at: [-8.0, 53.3] },
  { name: 'France', country: '250', at: [2.3, 46.7] },
  { name: 'Spain', country: '724', at: [-3.7, 40.2] },
  { name: 'Portugal', country: '620', at: [-8.2, 39.5] },
  { name: 'Italy', country: '380', at: [12.5, 42.5] },
  { name: 'Greece', country: '300', at: [22.0, 39.0] },
  { name: 'Germany', country: '276', at: [10.4, 51.2] },
  { name: 'Austria', country: '040', at: [14.5, 47.6] },
  { name: 'Hungary', country: '348', at: [19.5, 47.2] },
  { name: 'Czech Republic', country: '203', at: [15.5, 49.8] },
  { name: 'Bulgaria', country: '100', at: [25.5, 42.7] },
  { name: 'Norway', country: '578', at: [9.0, 61.0] },
  { name: 'Iceland', country: '352', at: [-19.0, 64.9] },
  { name: 'Malta', country: '470', at: [14.4, 35.9] },
  { name: 'Turkey', country: '792', at: [35.2, 39.0] },
  { name: 'Morocco', country: '504', at: [-7.1, 31.8] },
  { name: 'Kenya', country: '404', at: [37.9, 0.0] },
  { name: 'Bahrain', country: '048', at: [50.6, 26.0] },
  { name: 'Abu Dhabi', country: '784', at: [54.4, 24.4], territory: 'United Arab Emirates' },
  { name: 'Los Angeles', country: '840', at: [-118.2, 34.1], territory: 'United States' },
  { name: 'New York', country: '840', at: [-74.0, 40.7], territory: 'United States' },
  { name: 'Bahamas', country: '044', at: [-77.4, 25.0] },
  { name: 'Dominican Republic', country: '214', at: [-70.2, 18.7] },
];

const points = PLACES.map((p) => {
  const [x, y] = projection(p.at);
  return { name: p.name, country: p.country, x: +x.toFixed(1), y: +y.toFixed(1) };
});

const countryCount = new Set(PLACES.map((p) => p.territory ?? p.name)).size;

/* The picture is cropped to the part of the world actually worked in, with
   room around it. Drawing the whole globe would hand a third of the frame to
   empty ocean and to Asia, where there is nothing to show. Land outside the
   crop is clipped by the frame rather than removed from the data. */
const xs = points.map((p) => p.x);
const ys = points.map((p) => p.y);
const padX = WIDTH * 0.075;
const padTop = HEIGHT * 0.14;
const padBottom = HEIGHT * 0.16;
const view = {
  x: +Math.max(0, Math.min(...xs) - padX).toFixed(1),
  y: +Math.max(0, Math.min(...ys) - padTop).toFixed(1),
  width: +Math.min(WIDTH, Math.max(...xs) + padX - Math.max(0, Math.min(...xs) - padX)).toFixed(1),
  height: +Math.min(HEIGHT, Math.max(...ys) + padBottom - Math.max(0, Math.min(...ys) - padTop)).toFixed(1),
};

const worked = [...new Set(PLACES.map((p) => p.country))];
const missing = worked.filter((id) => !shapes.some((s) => s.id === id));

const highlighted = shapes.filter((c) => worked.includes(c.id));

await writeFile(
  'src/data/world-map.json',
  JSON.stringify({ width: WIDTH, height: HEIGHT, view, land, shapes: highlighted, points, worked, countryCount }, null, 0) + '\n'
);

const size = (land.length + JSON.stringify(highlighted).length) / 1024;
console.log(
  `wrote src/data/world-map.json — coastline plus ${highlighted.length} highlighted countries ` +
    `(${Math.round(size)}KB of paths), ${points.length} markers, ${countryCount} countries, ` +
    `cropped to ${view.width}x${view.height} of ${WIDTH}x${HEIGHT}`
);
if (missing.length) {
  console.log(
    `note: no outline at this resolution for ${missing.join(', ')} — those places show as a point only`
  );
}
