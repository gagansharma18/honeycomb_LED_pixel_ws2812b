// ==========================================================================
// Honeycomb Pixel — Interactive Web Engine & Exporters
// Single-Pixel Hexagon 3-Wire Magnetic Interconnect Application Logic
// Repository: https://github.com/gagansharma18/honeycomb_LED_pixel_ws2812b
// ==========================================================================

// --------------------------------------------------------------------------
// 1. GLOBAL REACTIVE APP STATE
// --------------------------------------------------------------------------
const AppState = {
  orientation: 'pointy', // 'pointy' | 'flat'
  hexRadius: 32,         // Visual radius on canvas (Pixels)
  physicalRadius: 15.0,  // Physical 3D radius (15mm)
  currentTool: 'add',    // 'add' | 'select' | 'delete'
  hexagons: [],          // Array of { id, q, r }
  wiringChain: [],       // Array of hex IDs in sequential wire order
  selectedHexIds: new Set(),
  
  // Viewport Pan & Zoom
  panX: 0,
  panY: 0,
  zoom: 1.0,
  isPanning: false,
  dragStartX: 0,
  dragStartY: 0,
  hoverAxial: null,

  historyStack: [],
  redoStack: []
};

// --------------------------------------------------------------------------
// 2. HEXAGONAL MATHEMATICS ENGINE
// --------------------------------------------------------------------------
const HexMath = {
  POINTY_DIRECTIONS: [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ],

  axialToPixel(q, r, radius, orientation = 'pointy') {
    if (orientation === 'pointy') {
      const x = radius * Math.sqrt(3) * (q + r / 2);
      const y = radius * (3 / 2) * r;
      return { x, y };
    } else {
      const x = radius * (3 / 2) * q;
      const y = radius * Math.sqrt(3) * (r + q / 2);
      return { x, y };
    }
  },

  pixelToAxial(px, py, radius, orientation = 'pointy') {
    let q, r;
    if (orientation === 'pointy') {
      q = (Math.sqrt(3)/3 * px - 1/3 * py) / radius;
      r = (2/3 * py) / radius;
    } else {
      q = (2/3 * px) / radius;
      r = (-1/3 * px + Math.sqrt(3)/3 * py) / radius;
    }
    return this.cubeRound(this.axialToCube(q, r));
  },

  axialToCube(q, r) {
    return { x: q, y: -q - r, z: r };
  },

  cubeRound(cube) {
    let rx = Math.round(cube.x);
    let ry = Math.round(cube.y);
    let rz = Math.round(cube.z);

    const xDiff = Math.abs(rx - cube.x);
    const yDiff = Math.abs(ry - cube.y);
    const zDiff = Math.abs(rz - cube.z);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }
    return { q: rx, r: rz };
  },

  getHexCorners(cx, cy, radius, orientation = 'pointy') {
    const corners = [];
    const startAngle = orientation === 'pointy' ? 30 : 0;
    for (let i = 0; i < 6; i++) {
      const angleRad = (Math.PI / 180) * (startAngle + i * 60);
      corners.push({
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad)
      });
    }
    return corners;
  }
};

// --------------------------------------------------------------------------
// 3. CANVAS RENDERER & INTERACTIVE VIEWPORT ENGINE
// --------------------------------------------------------------------------
let canvas, ctx;

function initCanvas() {
  canvas = document.getElementById('mainCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Default Pan to Center
  AppState.panX = canvas.width / 2;
  AppState.panY = canvas.height / 2;

  // Add Initial Seed Hexagon
  if (AppState.hexagons.length === 0) {
    AppState.hexagons.push({ id: '0,0', q: 0, r: 0 });
    AppState.wiringChain.push('0,0');
  }

  // Canvas Mouse & Wheel Event Handlers
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  renderCanvas();
}

function screenToWorld(sx, sy) {
  const rect = canvas.getBoundingClientRect();
  const px = (sx - rect.left) * window.devicePixelRatio;
  const py = (sy - rect.top) * window.devicePixelRatio;

  const wx = (px - AppState.panX) / AppState.zoom;
  const wy = (py - AppState.panY) / AppState.zoom;
  return { x: wx, y: wy };
}

function onMouseDown(e) {
  if (e.button === 1 || e.shiftKey) { // Middle click or Shift+Drag to Pan
    AppState.isPanning = true;
    AppState.dragStartX = e.clientX;
    AppState.dragStartY = e.clientY;
    return;
  }

  const world = screenToWorld(e.clientX, e.clientY);
  const hexAxial = HexMath.pixelToAxial(world.x, world.y, AppState.hexRadius, AppState.orientation);
  const hexId = `${hexAxial.q},${hexAxial.r}`;

  if (AppState.currentTool === 'add') {
    const exists = AppState.hexagons.some(h => h.id === hexId);
    if (!exists) {
      pushHistory();
      AppState.hexagons.push({ id: hexId, q: hexAxial.q, r: hexAxial.r });
      AppState.wiringChain.push(hexId);
      updateTelemetry();
    }
  } else if (AppState.currentTool === 'select') {
    if (AppState.selectedHexIds.has(hexId)) {
      AppState.selectedHexIds.delete(hexId);
    } else {
      AppState.selectedHexIds.clear();
      AppState.selectedHexIds.add(hexId);
    }
    updateTelemetry();
  } else if (AppState.currentTool === 'delete') {
    const idx = AppState.hexagons.findIndex(h => h.id === hexId);
    if (idx !== -1) {
      pushHistory();
      AppState.hexagons.splice(idx, 1);
      AppState.wiringChain = AppState.wiringChain.filter(id => id !== hexId);
      AppState.selectedHexIds.delete(hexId);
      updateTelemetry();
    }
  }
}

function onMouseMove(e) {
  if (AppState.isPanning) {
    const dx = (e.clientX - AppState.dragStartX) * window.devicePixelRatio;
    const dy = (e.clientY - AppState.dragStartY) * window.devicePixelRatio;
    AppState.panX += dx;
    AppState.panY += dy;
    AppState.dragStartX = e.clientX;
    AppState.dragStartY = e.clientY;
    return;
  }

  const world = screenToWorld(e.clientX, e.clientY);
  AppState.hoverAxial = HexMath.pixelToAxial(world.x, world.y, AppState.hexRadius, AppState.orientation);
}

function onMouseUp() {
  AppState.isPanning = false;
}

function onWheel(e) {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = Math.min(Math.max(0.3, AppState.zoom * zoomFactor), 4.0);

  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * window.devicePixelRatio;
  const mouseY = (e.clientY - rect.top) * window.devicePixelRatio;

  AppState.panX = mouseX - (mouseX - AppState.panX) * (newZoom / AppState.zoom);
  AppState.panY = mouseY - (mouseY - AppState.panY) * (newZoom / AppState.zoom);
  AppState.zoom = newZoom;
}

function renderLoop() {
  renderCanvas();
  requestAnimationFrame(renderLoop);
}

function renderCanvas() {
  if (!ctx) return;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background Grid Matrix Dots
  ctx.fillStyle = 'rgba(0, 242, 254, 0.04)';
  const gridStep = 40 * AppState.zoom;
  for (let x = 0; x < canvas.width; x += gridStep) {
    for (let y = 0; y < canvas.height; y += gridStep) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // World Space Transformation
  ctx.translate(AppState.panX, AppState.panY);
  ctx.scale(AppState.zoom, AppState.zoom);

  // Render Inter-Hexagon Data Wiring Vector Lines
  if (AppState.wiringChain.length > 1) {
    const hexMap = new Map(AppState.hexagons.map(h => [h.id, h]));
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
    ctx.lineWidth = 3 / AppState.zoom;
    ctx.beginPath();
    for (let i = 0; i < AppState.wiringChain.length - 1; i++) {
      const h1 = hexMap.get(AppState.wiringChain[i]);
      const h2 = hexMap.get(AppState.wiringChain[i + 1]);
      if (h1 && h2) {
        const p1 = HexMath.axialToPixel(h1.q, h1.r, AppState.hexRadius, AppState.orientation);
        const p2 = HexMath.axialToPixel(h2.q, h2.r, AppState.hexRadius, AppState.orientation);
        if (i === 0) ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();
  }

  // Render Hexagon Single Pixel Tiles
  AppState.hexagons.forEach((hex, index) => {
    const p = HexMath.axialToPixel(hex.q, hex.r, AppState.hexRadius, AppState.orientation);
    const corners = HexMath.getHexCorners(p.x, p.y, AppState.hexRadius, AppState.orientation);
    const isSelected = AppState.selectedHexIds.has(hex.id);

    // Fill Tile Body
    ctx.beginPath();
    corners.forEach((c, i) => i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y));
    ctx.closePath();

    ctx.fillStyle = isSelected ? 'rgba(0, 242, 254, 0.25)' : 'rgba(13, 22, 42, 0.85)';
    ctx.fill();

    ctx.strokeStyle = isSelected ? '#00f2fe' : 'rgba(0, 242, 254, 0.5)';
    ctx.lineWidth = (isSelected ? 3.5 : 2) / AppState.zoom;
    ctx.stroke();

    // Render 3 Magnetic Pogo Contact Indicators on all 6 faces
    for (let i = 0; i < 6; i++) {
      const c1 = corners[i];
      const c2 = corners[(i + 1) % 6];
      const midX = (c1.x + c2.x) / 2;
      const midY = (c1.y + c2.y) / 2;

      // 3 Magnetic Contact Dots (VCC Red, DATA Cyan, GND Blue)
      const dx = (c2.x - c1.x) * 0.15;
      const dy = (c2.y - c1.y) * 0.15;

      // Pin 1: VCC Red
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(midX - dx, midY - dy, 2 / AppState.zoom, 0, Math.PI * 2);
      ctx.fill();

      // Pin 2: DATA Cyan
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.arc(midX, midY, 2 / AppState.zoom, 0, Math.PI * 2);
      ctx.fill();

      // Pin 3: GND Blue
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(midX + dx, midY + dy, 2 / AppState.zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    // LED Index Label
    const wireIndex = AppState.wiringChain.indexOf(hex.id);
    if (wireIndex !== -1) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, 13 / AppState.zoom)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${wireIndex}`, p.x, p.y);
    }
  });

  // Hover Ghost Preview (When adding new single pixels)
  if (AppState.currentTool === 'add' && AppState.hoverAxial) {
    const hoverId = `${AppState.hoverAxial.q},${AppState.hoverAxial.r}`;
    const exists = AppState.hexagons.some(h => h.id === hoverId);
    if (!exists) {
      const p = HexMath.axialToPixel(AppState.hoverAxial.q, AppState.hoverAxial.r, AppState.hexRadius, AppState.orientation);
      const corners = HexMath.getHexCorners(p.x, p.y, AppState.hexRadius, AppState.orientation);

      ctx.beginPath();
      corners.forEach((c, i) => i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y));
      ctx.closePath();

      ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#00f2fe';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2 / AppState.zoom;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
}

// --------------------------------------------------------------------------
// 4. HISTORY UNDO & REDO ENGINE
// --------------------------------------------------------------------------
function pushHistory() {
  AppState.historyStack.push({
    hexagons: JSON.parse(JSON.stringify(AppState.hexagons)),
    wiringChain: [...AppState.wiringChain]
  });
  if (AppState.historyStack.length > 50) AppState.historyStack.shift();
  AppState.redoStack = [];
}

function undo() {
  if (AppState.historyStack.length === 0) return;
  AppState.redoStack.push({
    hexagons: JSON.parse(JSON.stringify(AppState.hexagons)),
    wiringChain: [...AppState.wiringChain]
  });
  const state = AppState.historyStack.pop();
  AppState.hexagons = state.hexagons;
  AppState.wiringChain = state.wiringChain;
  updateTelemetry();
}

function redo() {
  if (AppState.redoStack.length === 0) return;
  AppState.historyStack.push({
    hexagons: JSON.parse(JSON.stringify(AppState.hexagons)),
    wiringChain: [...AppState.wiringChain]
  });
  const state = AppState.redoStack.pop();
  AppState.hexagons = state.hexagons;
  AppState.wiringChain = state.wiringChain;
  updateTelemetry();
}

// --------------------------------------------------------------------------
// 5. TELEMETRY & UI UPDATES
// --------------------------------------------------------------------------
function updateTelemetry() {
  const count = AppState.hexagons.length;
  const countEl = document.getElementById('statPixelCount');
  if (countEl) countEl.textContent = `${count} Tiles`;

  const powerEl = document.getElementById('statMaxPower');
  if (powerEl) {
    const watts = (count * 0.30).toFixed(2);
    const amps = (count * 0.06).toFixed(2);
    powerEl.textContent = `${watts} W (${amps} A @ 5V)`;
  }
}

// --------------------------------------------------------------------------
// 6. CAD & WLED EXPORTERS
// --------------------------------------------------------------------------
const CadExporter = {
  generateSinglePixelOpenScad(options = {}) {
    const r = options.pixel_radius || 16.0;
    const h = options.tile_height || 10.5;
    const wall = options.wall_thickness || 1.6;
    const baseFloor = options.base_floor || 1.8;
    const ledChamberHeight = options.led_chamber_height || 4.5;
    const stopperRadius = options.stopper_radius || 10.5;
    const pinHoleDia = options.pin_hole_dia || 1.25;
    const pinPitch = options.pin_contact_pitch || 2.54;

    let scad = `// ==========================================================================\n`;
    scad += `// Honeycomb Pixel — 3-Pin Female Header Single-Pixel Hexagon Tile\n`;
    scad += `// Parametric 3D OpenSCAD Model with Inner Stopper Walls & Pin Holes\n`;
    scad += `// Repository: https://github.com/gagansharma18/honeycomb_LED_pixel_ws2812b\n`;
    scad += `// ==========================================================================\n\n`;

    scad += `pixel_radius        = ${r.toFixed(2)};\n`;
    scad += `tile_height         = ${h.toFixed(2)};\n`;
    scad += `wall_thickness      = ${wall.toFixed(2)};\n`;
    scad += `base_floor          = ${baseFloor.toFixed(2)};\n`;
    scad += `stopper_radius      = ${stopperRadius.toFixed(2)};\n`;
    scad += `stopper_wall_thick  = 1.60;\n`;
    scad += `led_chamber_height  = ${ledChamberHeight.toFixed(2)};\n`;
    scad += `header_pitch        = ${pinPitch.toFixed(2)};\n`;
    scad += `header_body_width   = 8.20;\n`;
    scad += `header_body_height  = 3.00;\n`;
    scad += `pin_hole_dia        = ${pinHoleDia.toFixed(2)};\n`;
    scad += `pin_contact_pitch   = ${pinPitch.toFixed(2)};\n`;
    scad += `diffuser_recess     = 1.50;\n`;
    scad += `diffuser_thickness  = 1.40;\n\n`;

    scad += `r_outer   = pixel_radius;\n`;
    scad += `r_outer_in= pixel_radius - wall_thickness;\n`;
    scad += `a_outer   = r_outer * sqrt(3)/2;\n`;
    scad += `a_stopper = stopper_radius * sqrt(3)/2;\n\n`;

    scad += `module single_pixel_base() {\n`;
    scad += `  difference() {\n`;
    scad += `    rotate([0, 0, 30]) cylinder(r = r_outer, h = tile_height, $fn = 6);\n`;
    scad += `    translate([0, 0, led_chamber_height]) rotate([0, 0, 30]) cylinder(r = r_outer_in, h = tile_height + 1, $fn = 6);\n`;
    scad += `    translate([0, 0, tile_height - diffuser_recess]) rotate([0, 0, 30]) cylinder(r = r_outer - wall_thickness/2, h = diffuser_recess + 0.1, $fn = 6);\n`;
    scad += `    translate([0, 0, base_floor]) rotate([0, 0, 30]) cylinder(r = stopper_radius - stopper_wall_thick, h = led_chamber_height - base_floor + 0.1, $fn = 6);\n\n`;
    scad += `    for (angle = [0 : 60 : 300]) {\n`;
    scad += `      rotate([0, 0, angle]) {\n`;
    scad += `        translate([a_outer - (a_outer - a_stopper)/2, 0, (base_floor + led_chamber_height) / 2]) {\n`;
    scad += `          cube([a_outer - a_stopper + 0.1, header_body_width, header_body_height], center = true);\n`;
    scad += `        }\n`;
    scad += `        translate([a_stopper, 0, (base_floor + led_chamber_height) / 2]) {\n`;
    scad += `          translate([0, -pin_contact_pitch, 0]) rotate([0, 90, 0]) cylinder(d = pin_hole_dia, h = 6.0, center = true, $fn = 24);\n`;
    scad += `          translate([0, 0, 0]) rotate([0, 90, 0]) cylinder(d = pin_hole_dia, h = 6.0, center = true, $fn = 24);\n`;
    scad += `          translate([0, pin_contact_pitch, 0]) rotate([0, 90, 0]) cylinder(d = pin_hole_dia, h = 6.0, center = true, $fn = 24);\n`;
    scad += `        }\n`;
    scad += `      }\n`;
    scad += `    }\n`;
    scad += `  }\n`;
    scad += `}\n\n`;
    scad += `single_pixel_base();\n`;

    return scad;
  }
};

const WledExporter = {
  generateLedmap(hexagons, wiringChain) {
    if (hexagons.length === 0) return JSON.stringify({ n: "Honeycomb_Pixel", w: 0, h: 0, map: [] }, null, 2);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const pixelCoords = hexagons.map(h => {
      const p = HexMath.axialToPixel(h.q, h.r, AppState.hexRadius, AppState.orientation);
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      return { id: h.id, x: p.x, y: p.y };
    });

    const stepX = AppState.hexRadius * Math.sqrt(3);
    const stepY = AppState.hexRadius * 1.5;

    const width = Math.max(1, Math.ceil((maxX - minX) / stepX) + 1);
    const height = Math.max(1, Math.ceil((maxY - minY) / stepY) + 1);

    const grid = Array(height).fill(null).map(() => Array(width).fill(-1));
    const wireMap = new Map(wiringChain.map((id, index) => [id, index]));

    pixelCoords.forEach(p => {
      const col = Math.min(width - 1, Math.max(0, Math.round((p.x - minX) / stepX)));
      const row = Math.min(height - 1, Math.max(0, Math.round((p.y - minY) / stepY)));
      const ledIdx = wireMap.has(p.id) ? wireMap.get(p.id) : -1;
      grid[row][col] = ledIdx;
    });

    return JSON.stringify({
      n: "Honeycomb_Single_Pixel_Map",
      w: width,
      h: height,
      map: grid.flat()
    }, null, 2);
  }
};

// --------------------------------------------------------------------------
// 7. INITIALIZATION & UI EVENT BINDINGS
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();

  // Tool buttons (Add, Select, Delete)
  const toolBtns = document.querySelectorAll('.tool-btn');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.currentTool = btn.dataset.tool;
    });
  });

  // Canvas Toolbar Buttons
  const btnZoomIn = document.getElementById('btnZoomIn');
  if (btnZoomIn) btnZoomIn.addEventListener('click', () => AppState.zoom = Math.min(4.0, AppState.zoom * 1.25));

  const btnZoomOut = document.getElementById('btnZoomOut');
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => AppState.zoom = Math.max(0.3, AppState.zoom * 0.8));

  const btnResetView = document.getElementById('btnResetView');
  if (btnResetView) {
    btnResetView.addEventListener('click', () => {
      AppState.zoom = 1.0;
      AppState.panX = canvas.width / 2;
      AppState.panY = canvas.height / 2;
    });
  }

  // Export Button Modal Trigger
  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const ledmap = WledExporter.generateLedmap(AppState.hexagons, AppState.wiringChain);
      const scad = CadExporter.generateSinglePixelOpenScad();

      const blob = new Blob([scad], { type: 'text/x-scad' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'honeycomb_single_pixel.scad';
      a.click();

      console.log("WLED Ledmap JSON:\n", ledmap);
      alert(`Exported WLED ledmap.json to Console!\nDownloaded honeycomb_single_pixel.scad model.`);
    });
  }

  // Keyboard Shortcuts (Undo, Redo, Delete)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      redo();
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }
  });
});
