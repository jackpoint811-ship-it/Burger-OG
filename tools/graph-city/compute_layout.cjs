/* ============================================================================
   BURGERS.EXE · CIUDAD DEL GRAFO 3D — PR1 (contrato de datos)
   compute_layout.cjs
   Lee graph.json (salida fresca de graphify) y genera viz_data_city.json:
   - colonias (manzanas) = primer segmento de source_file (apps/, docs/, legacy/...)
   - edificios = comunidades, con altura ∝ nº de nodos y base ∝ hub degree
   - nodos = ventanas en pisos (hubs arriba), hojas (degree<=1) al sótano
   - enlaces con coordenadas 3D de extremos
   Salida: .graphify/viz_data_city.json  (inline en graph_city.html)
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const SEED = 20260812;
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);

const INPUT = process.argv[2] || path.join(__dirname, '..', '..', 'graphify-out', 'graph.json');
const graph = JSON.parse(fs.readFileSync(path.resolve(INPUT), 'utf8'));
const nodes = graph.nodes;
const links = graph.links;

/* ---------- grados ---------- */
const deg = {};
nodes.forEach(n => { deg[n.id] = 0; });
links.forEach(l => {
  if (deg[l.source] !== undefined) deg[l.source]++;
  if (deg[l.target] !== undefined) deg[l.target]++;
});

/* ---------- colonia (carpeta raíz) por nodo ---------- */
function colonyOf(n) {
  const sf = n.source_file || '';
  if (!sf) return 'root';
  const seg = sf.split('/');
  if (seg.length === 1) return seg[0].startsWith('.') ? 'root' : seg[0];
  return seg[0];
}

/* ---------- comunidades / edificios ---------- */
const byComm = {};
nodes.forEach(n => { (byComm[n.community] = byComm[n.community] || []).push(n); });
const commIds = Object.keys(byComm).map(Number).sort((a, b) => byComm[b].length - byComm[a].length);

/* colonia dominante por comunidad (mayoría de source_file) */
const commColony = {};
commIds.forEach(c => {
  const counts = {};
  byComm[c].forEach(n => { const k = colonyOf(n); counts[k] = (counts[k] || 0) + 1; });
  commColony[c] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
});

/* ---------- colonias: agrupar, top 12, resto a 'other' ---------- */
const colonyCounts = {};
commIds.forEach(c => { colonyCounts[commColony[c]] = (colonyCounts[commColony[c]] || 0) + byComm[c].length; });
const colonyList = Object.entries(colonyCounts).sort((a, b) => b[1] - a[1]);
const TOP = 12;
const topColonies = colonyList.slice(0, TOP).map(e => e[0]);
const colonyId = {};
topColonies.forEach((c, i) => { colonyId[c] = i; });
if (!colonyId['other']) colonyId['other'] = topColonies.length;

function colonyIdxOfComm(c) { return colonyId[commColony[c]] !== undefined ? colonyId[commColony[c]] : colonyId['other']; }

const colonyNames = [];
const colonyNodeCount = new Array(TOP + 1).fill(0);
const colonyBuildings = Array.from({ length: TOP + 1 }, () => []);
topColonies.forEach((c, i) => {
  colonyNames[i] = c;
  colonyNodeCount[i] = colonyCounts[c];
});
colonyNames[colonyId['other']] = 'other';
colonyNodeCount[colonyId['other']] = colonyList.slice(TOP).reduce((s, e) => s + e[1], 0);

/* ---------- layout de colonias en grid (XZ) ---------- */
const colonyCount = TOP + 1;
const COLS = Math.ceil(Math.sqrt(colonyCount));
const BLOCK = 300;
const colonies = [];
for (let i = 0; i < colonyCount; i++) {
  const cx = ((i % COLS) - (COLS - 1) / 2) * BLOCK;
  const cz = (Math.floor(i / COLS) - (Math.floor(colonyCount / COLS) - 1) / 2) * BLOCK;
  colonies.push({ id: i, name: colonyNames[i], cx, cz, size: colonyNodeCount[i] });
}

/* ---------- edificios por comunidad, con layout grid dentro de colonia ---------- */
const buildings = [];
const buildingByComm = {};
const COL_W = 230, COL_D = 230;
const EDGE = 14;
const nodeIdxById = {};
const nodeArr = [];

commIds.forEach((c, bi) => {
  const list = byComm[c].slice().sort((a, b) => deg[b.id] - deg[a.id]);
  const size = list.length;
  const hub = deg[list[0].id] || 0;
  const ci = colonyIdxOfComm(c);
  const idxInColony = colonyBuildings[ci].length;
  const colsPerCol = Math.max(1, Math.floor((COL_W - EDGE * 2) / 42));
  const bx = ((idxInColony % colsPerCol) - (colsPerCol - 1) / 2) * 42;
  const bz = (Math.floor(idxInColony / colsPerCol) - Math.floor(colonyBuildings[ci].length / colsPerCol) / 2) * 42;
  const baseW = Math.max(2.2, Math.min(14, Math.log2(1 + hub) * 1.5));
  const baseD = Math.max(2.2, Math.min(12, Math.sqrt(size) * 0.55));
  const height = Math.max(2.5, Math.min(30, Math.pow(size, 0.62)));
  const hue = ((bi * 137.508) % 360);
  const b = {
    id: bi, comm: c, name: byComm[c][0].community_name || ('Community ' + c),
    colony: ci, x: colonies[ci].cx + bx, z: colonies[ci].cz + bz,
    w: +baseW.toFixed(2), d: +baseD.toFixed(2), h: +height.toFixed(2),
    hue: +hue.toFixed(1), size, hub, windows: [], basement: []
  };
  buildings.push(b);
  buildingByComm[c] = b;
  colonyBuildings[ci].push(bi);

  /* ventanas: nodos con degree>=2, ordenados por degree desc (hubs arriba) */
  const W_OFF = 0.55; // separación de la fachada (ventanas "pegadas" al muro)
  list.forEach((n, k) => {
    const d = deg[n.id] || 0;
    const isLeaf = d <= 1;
    const wy = isLeaf ? 0 : 1 - (k / Math.max(1, size)) * 0.92 - 0.04; // hubs arriba (wy alto)
    let wpx = 0, wpz = 0;
    if (isLeaf) {
      const jitterX = (rng() - 0.5) * Math.max(0.2, b.w - 0.9);
      const jitterZ = (rng() - 0.5) * Math.max(0.2, b.d - 0.9);
      wpx = jitterX; wpz = jitterZ;
    } else {
      /* distribución en el perímetro de la fachada, alineado al muro */
      const winN = Math.max(1, list.length);
      const total = 2 * (b.w + b.d);
      const pos = ((k + 0.5) / winN) * total;
      if (pos < b.w) { wpx = pos - b.w / 2; wpz = -(b.d / 2 + W_OFF); }
      else if (pos < b.w + b.d) { wpx = b.w / 2 + W_OFF; wpz = pos - b.w - b.d / 2; }
      else if (pos < 2 * b.w + b.d) { wpx = b.w / 2 - (pos - b.w - b.d); wpz = b.d / 2 + W_OFF; }
      else { wpx = -(b.w / 2 + W_OFF); wpz = b.d / 2 - (pos - 2 * b.w - b.d); }
      wpx = +wpx.toFixed(2); wpz = +wpz.toFixed(2);
    }
    const nodeIdx = nodeArr.length;
    nodeIdxById[n.id] = nodeIdx;
    const wpos = { x: +wpx.toFixed(2), y: +wy.toFixed(3), z: +wpz.toFixed(2) };
    nodeArr.push([
      n.id, n.label || n.id, n.source_file || '', n.file_type || '', d,
      bi, wpos.x, wpos.y, wpos.z, isLeaf ? 1 : 0
    ]);
    if (isLeaf) b.basement.push(nodeIdx); else b.windows.push(nodeIdx);
  });
});

/* ---------- enlaces ---------- */
const relCount = {};
links.forEach(l => { relCount[l.relation] = (relCount[l.relation] || 0) + 1; });
const relList = Object.keys(relCount).sort((a, b) => relCount[b] - relCount[a]);
const relIdx = {};
relList.forEach((r, i) => { relIdx[r] = i; });

const linkArr = [];
links.forEach(l => {
  const s = nodeIdxById[l.source], t = nodeIdxById[l.target];
  if (s === undefined || t === undefined) return;
  linkArr.push([s, t, relIdx[l.relation] === undefined ? 0 : relIdx[l.relation]]);
});

const DATA = {
  n: nodeArr,
  b: buildings.map(x => ({ id: x.id, name: x.name, colony: x.colony, x: +x.x.toFixed(2), z: +x.z.toFixed(2), w: x.w, d: x.d, h: x.h, hue: x.hue, size: x.size, hub: x.hub })),
  col: colonies.map(x => ({ id: x.id, name: x.name, cx: +x.cx.toFixed(1), cz: +x.cz.toFixed(1), size: x.size })),
  l: linkArr,
  rel: relList
};

fs.writeFileSync(path.join(__dirname, 'viz_data_city.json'), JSON.stringify(DATA), 'utf8');
console.log('OK → viz_data_city.json');
console.log('nodos ' + nodeArr.length + ' · enlaces ' + linkArr.length + ' · edificios ' + buildings.length + ' · colonias ' + colonyCount + ' · relaciones ' + relList.join(', '));
console.log('ventanas ' + DATA.n.filter(x => x[9] === 0).length + ' · sótano ' + DATA.n.filter(x => x[9] === 1).length);
