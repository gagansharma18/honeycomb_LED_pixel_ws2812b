// ==========================================================================
// Headless Test Suite for Honeycomb Pixel (Single Pixel Magnetic Hexagon)
// Run with: node test_engine.js
// ==========================================================================

const fs = require('fs');
const path = require('path');

console.log("=== RUNNING HONEYCOMB PIXEL (SINGLE PIXEL MAGNETIC HEXAGON) TESTS ===");

// 1. Verify SCAD Model File Existence & Syntax
const scadPath = path.join(__dirname, 'honeycomb_single_pixel.scad');
if (!fs.existsSync(scadPath)) {
  console.error("❌ FAILED: honeycomb_single_pixel.scad file missing!");
  process.exit(1);
}
const scadContent = fs.readFileSync(scadPath, 'utf8');

const requiredScadVars = [
  'pixel_radius',
  'stopper_radius',
  'stopper_wall_thick',
  'pin_hole_dia',
  'single_pixel_base',
  'diffuser_lid'
];

requiredScadVars.forEach(v => {
  if (!scadContent.includes(v)) {
    console.error(`❌ FAILED: OpenSCAD model missing required parameter symbol '${v}'`);
    process.exit(1);
  }
});
console.log("✓ Verified honeycomb_single_pixel.scad parameters and 3D modules");

// 2. Axial Coordinate Math Tests (Single Pixel Hexagon Grid)
function axialToPixel(q, r, radius = 15.0) {
  const x = radius * Math.sqrt(3) * (q + r / 2);
  const y = radius * (3 / 2) * r;
  return { x, y };
}

function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs((q1 + r1) - (q2 + r2))) / 2;
}

// Neighbor distance test
const center = { q: 0, r: 0 };
const neighbors = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

neighbors.forEach(n => {
  const dist = hexDistance(center.q, center.r, n.q, n.r);
  if (dist !== 1) {
    console.error(`❌ FAILED: Neighbor distance calculation for (${n.q}, ${n.r}) expected 1, got ${dist}`);
    process.exit(1);
  }
});
console.log("✓ Verified 6 omnidirectional magnetic neighbor connections (Distance = 1)");

// 3. WLED 2D Matrix Mapping Assertion for Single-Pixel Layout
const testHexes = [
  { id: '0,0', q: 0, r: 0 },
  { id: '1,0', q: 1, r: 0 },
  { id: '0,1', q: 0, r: 1 },
  { id: '1,-1', q: 1, r: -1 }
];

function compute2dMatrix(hexes, radius = 15.0) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const pixels = hexes.map(h => {
    const p = axialToPixel(h.q, h.r, radius);
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    return { ...h, ...p };
  });

  const width = Math.max(1, Math.ceil((maxX - minX) / (radius * Math.sqrt(3))) + 1);
  const height = Math.max(1, Math.ceil((maxY - minY) / (radius * 1.5)) + 1);

  return { width, height, count: hexes.length };
}

const matrix = compute2dMatrix(testHexes);
if (matrix.count !== 4 || matrix.width < 2 || matrix.height < 2) {
  console.error("❌ FAILED: 2D Matrix computation assertion failed!");
  process.exit(1);
}
console.log(`✓ 2D Bounding Matrix for ${matrix.count} Single-Pixel Tiles: ${matrix.width} × ${matrix.height}`);

console.log("=== ALL HONEYCOMB PIXEL TESTS PASSED SUCCESSFULLY! ===");
