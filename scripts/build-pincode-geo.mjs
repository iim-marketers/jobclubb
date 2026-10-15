// Source: India Post's pincode.csv, mirrored at https://github.com/dropdevrahul/pincodes-india
import { readFileSync, writeFileSync } from "node:fs";

const source = process.argv[2];
if (!source) {
  console.error("Usage: node scripts/build-pincode-geo.mjs path/to/pincode.csv");
  process.exit(1);
}

const DISTRICT_KM = 150;
const SUSPECT_KM = 250;
const CLUSTER_KM = 25;
const OUTLIER_KM = 15;

// [latMin, latMax, lngMin, lngMax]
const STATE_BOUNDS = {
  "ANDAMAN AND NICOBAR ISLANDS": [6.7, 13.7, 92.2, 94],
  "ANDHRA PRADESH": [12.6, 19.2, 76.7, 84.8],
  "ARUNACHAL PRADESH": [26.6, 29.5, 91.5, 97.4],
  ASSAM: [24.1, 28, 89.7, 96.1],
  BIHAR: [24.3, 27.6, 83.3, 88.3],
  CHANDIGARH: [30.6, 30.8, 76.6, 76.9],
  CHHATTISGARH: [17.8, 24.1, 80.2, 84.4],
  DELHI: [28.4, 28.9, 76.8, 77.4],
  GOA: [14.9, 15.8, 73.6, 74.4],
  GUJARAT: [20.1, 24.7, 68.1, 74.5],
  HARYANA: [27.6, 31, 74.4, 77.6],
  "HIMACHAL PRADESH": [30.4, 33.3, 75.5, 79],
  "JAMMU AND KASHMIR": [32.2, 37.1, 72.5, 77],
  JHARKHAND: [21.9, 25.4, 83.3, 87.9],
  KARNATAKA: [11.5, 18.5, 74, 78.6],
  KERALA: [8.2, 12.8, 74.8, 77.4],
  LADAKH: [32.3, 36, 75.3, 80.3],
  LAKSHADWEEP: [8, 12.4, 71.6, 74],
  "MADHYA PRADESH": [21, 26.9, 74, 82.8],
  MAHARASHTRA: [15.6, 22.1, 72.6, 80.9],
  MANIPUR: [23.8, 25.7, 93, 94.8],
  MEGHALAYA: [25, 26.1, 89.8, 92.8],
  MIZORAM: [21.9, 24.6, 92.2, 93.5],
  NAGALAND: [25.2, 27.1, 93.3, 95.3],
  ODISHA: [17.8, 22.6, 81.4, 87.5],
  PUDUCHERRY: [10.7, 16.8, 75.4, 82.3],
  PUNJAB: [29.5, 32.6, 73.8, 77],
  RAJASTHAN: [23, 30.2, 69.4, 78.3],
  SIKKIM: [27, 28.2, 88, 88.95],
  "TAMIL NADU": [8, 13.6, 76.2, 80.4],
  TELANGANA: [15.8, 19.95, 77.2, 81.4],
  "THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU": [20, 20.8, 70.8, 73.3],
  TRIPURA: [22.9, 24.6, 91.1, 92.4],
  "UTTAR PRADESH": [23.8, 30.5, 77, 84.7],
  UTTARAKHAND: [28.7, 31.5, 77.5, 81.1],
  "WEST BENGAL": [21.5, 27.3, 85.8, 89.9],
};

const OVERRIDES = {
  201301: [28.575, 77.32],
  201303: [28.566, 77.345],
  201313: [28.544, 77.333],
  201315: [28.468, 77.497],
  201316: [28.588, 77.395],
  201317: [28.525, 77.36],
  500089: [17.405, 78.38],
  600132: [12.968, 80.118],
  133010: [30.338, 76.84],
  160025: [30.71, 76.715],
  160071: [30.703, 76.706],
  413007: [17.672, 75.906],
  492018: [21.16, 81.79],
  570033: [12.287, 76.611],
  585107: [17.33, 76.836],
  695038: [8.52, 76.97],
  711110: [22.6, 88.31],
  800021: [25.61, 85.12],
  800024: [25.607, 85.083],
  826010: [23.83, 86.38],
};

const DISTRICT_ANCHORS = {
  "UTTAR PRADESH|FIROZABAD": [27.15, 78.4],
};

const REMOTE_DISTRICTS = new Set(["LAKSHADWEEP|LAKSHADWEEP DISTRICT"]);

const PAD = 0.3;
const inState = (state, p) => {
  const b = STATE_BOUNDS[state];
  if (!b) return p[0] > 6 && p[0] < 37.5 && p[1] > 68 && p[1] < 97.5;
  return p[0] > b[0] - PAD && p[0] < b[1] + PAD && p[1] > b[2] - PAD && p[1] < b[3] + PAD;
};

const km = ([lat1, lng1], [lat2, lng2]) => {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 12_742 * Math.asin(Math.sqrt(h));
};

const median = (values) => {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const centre = (points) => [median(points.map((p) => p[0])), median(points.map((p) => p[1]))];

// Junk readings (e.g. Vadodara's rural offices all at latitude 15.5934) can
// outnumber real ones, so a plain median lands on the junk.
const districtCentre = (district, points) => {
  let anchor = DISTRICT_ANCHORS[district];
  if (!anchor) {
    let best = 0;
    for (const p of points) {
      const near = points.filter((q) => km(p, q) <= CLUSTER_KM).length;
      if (near > best) [anchor, best] = [p, near];
    }
  }
  const kept = points.filter((p) => km(p, anchor) <= DISTRICT_KM);
  return kept.length ? centre(kept) : anchor;
};

// Some offices store degrees-minutes-seconds digits as a decimal, e.g.
// 22.3434 meaning 22°34'34" (22.576).
const fromDms = (raw) => {
  const [deg, frac = ""] = raw.split(".");
  const mm = Number(frac.slice(0, 2));
  const ss = Number(`${frac.slice(2, 4) || "0"}.${frac.slice(4) || "0"}`);
  if (frac.length < 2 || mm >= 60 || ss >= 60) return null;
  return Number(deg) + mm / 60 + ss / 3600;
};

const parseLine = (line) => {
  const cols = [];
  let field = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      cols.push(field);
      field = "";
    } else field += ch;
  }
  cols.push(field);
  return cols;
};

const [header, ...lines] = readFileSync(source, "utf8").replace(/^﻿/, "").split(/\r?\n/);
const col = Object.fromEntries(parseLine(header).map((name, i) => [name.trim(), i]));

const offices = [];
for (const line of lines) {
  if (!line.trim()) continue;
  const cols = parseLine(line);
  const pincode = cols[col.Pincode]?.trim();
  if (!/^[1-8]\d{5}$/.test(pincode)) continue;
  const state = cols[col.StateName].trim().toUpperCase();
  const lat = cols[col.Latitude]?.trim() ?? "";
  const lng = cols[col.Longitude]?.trim() ?? "";
  const valid = (p) => p[0] !== null && p[1] !== null && Number.isFinite(p[0]) && Number.isFinite(p[1]) && inState(state, p);
  const literal = [Number(lat), Number(lng)];
  const swapped = [literal[1], literal[0]];
  const dms = [fromDms(lat), fromDms(lng)];
  const plain = [literal, swapped].find(valid) ?? null;
  offices.push({
    pincode,
    district: `${state}|${cols[col.District].trim().toUpperCase()}`,
    plain,
    readings: [literal, swapped, dms].filter(valid),
  });
}

const byDistrict = new Map();
for (const o of offices) {
  if (o.plain) byDistrict.set(o.district, [...(byDistrict.get(o.district) ?? []), o.plain]);
}
const centres = new Map([...byDistrict].map(([d, points]) => [d, districtCentre(d, points)]));

const byPincode = new Map();
for (const o of offices) {
  const ref = centres.get(o.district);
  if (!ref) continue;
  const entry = byPincode.get(o.pincode) ?? { district: o.district, ref, points: [] };
  byPincode.set(o.pincode, entry);
  if (!o.readings.length) continue;
  const best = o.readings.toSorted((a, b) => km(a, ref) - km(b, ref))[0];
  if (km(best, ref) <= DISTRICT_KM) entry.points.push(best);
}

const round = (n) => +n.toFixed(3);
const geo = {};
for (const [pincode, { ref, points }] of [...byPincode].sort(([a], [b]) => a.localeCompare(b))) {
  if (OVERRIDES[pincode]) {
    geo[pincode] = OVERRIDES[pincode];
    continue;
  }
  if (!points.length) {
    geo[pincode] = [round(ref[0]), round(ref[1]), 1];
    continue;
  }
  // Densest cluster wins; a two-two split goes to the side nearer the
  // district centre.
  const clusters = points.map((p) => ({
    kept: points.filter((q) => km(p, q) <= OUTLIER_KM),
    offset: km(p, ref),
  }));
  const { kept } = clusters.toSorted(
    (a, b) => b.kept.length - a.kept.length || a.offset - b.offset,
  )[0];
  const avg = (i) => kept.reduce((sum, p) => sum + p[i], 0) / kept.length;
  geo[pincode] = [round(avg(0)), round(avg(1))];
}

writeFileSync("src/server/jobs/pincode-geo.json", JSON.stringify(geo));
const approx = Object.values(geo).filter((p) => p.length === 3).length;
console.log(`Wrote ${Object.keys(geo).length} pincodes, ${approx} placed by district.`);

const byPrefix = new Map();
for (const [pincode, { district }] of byPincode) {
  const prefix = pincode.slice(0, 3);
  byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), { district, point: geo[pincode] }]);
}
const prefixCounts = new Map();
for (const o of offices) {
  const counts = prefixCounts.get(o.district) ?? new Map();
  counts.set(o.pincode.slice(0, 3), (counts.get(o.pincode.slice(0, 3)) ?? 0) + 1);
  prefixCounts.set(o.district, counts);
}
for (const [district, ref] of centres) {
  if (DISTRICT_ANCHORS[district] || REMOTE_DISTRICTS.has(district)) continue;
  const [prefix] = [...prefixCounts.get(district)].toSorted((a, b) => b[1] - a[1])[0];
  const others = (byPrefix.get(prefix) ?? []).filter((p) => p.district !== district);
  if (others.length < 3) continue;
  const neighbours = centre(others.map((p) => p.point));
  const off = km(ref, neighbours);
  if (off > SUSPECT_KM) {
    console.warn(
      `Check ${district}, add to DISTRICT_ANCHORS if wrong: centre ${ref.map(round)} is ${Math.round(off)} km from other ${prefix}xxx pincodes at ${neighbours.map(round)}`,
    );
  }
}
