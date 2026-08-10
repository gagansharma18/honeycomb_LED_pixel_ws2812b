# ⬡ Honeycomb Pixel — Comprehensive Project Status & AI Handover Document

> **Quick AI Resume Directive**:  
> This document is a self-contained snapshot of the **Honeycomb Pixel (Single-Pixel 3-Wire Interconnect Tile)** project. If you are an AI coding assistant (Claude, ChatGPT, Cursor, Gemini, Copilot, Antigravity), read this entire file to instantly understand the exact project status, mechanical models, file architecture, and how to continue development without losing any context.

---

## 📌 1. Project Overview & Context

- **Repository**: [`git@github.com:gagansharma18/honeycomb_LED_pixel_ws2812b.git`](https://github.com/gagansharma18/honeycomb_LED_pixel_ws2812b.git)
- **Local Directory**: `/Users/gagansharma/Documents/GitHub/honeycomb_LED_pixel_ws2812b`
- **Technology Stack**:
  - **3D CAD Engine**: OpenSCAD Parametric Geometry (`honeycomb_single_pixel.scad`)
  - **Core Web Logic**: Modern Vanilla JavaScript (ES6+ Modules / Hexagonal Math Engine)
  - **Rendering**: HTML5 High-DPI Interactive Canvas (Pointy & Flat hexagon orientations, pogo/header contact indicators, wiring vectors)
  - **Styling**: Cyberpunk Dark Glassmorphism CSS3 (Neon Cyan & Blue theme, responsive sidebars, floating docks)
  - **Dependencies**: **Zero** external runtime dependencies. Runs directly in any browser and tests headlessly with `node test_engine.js`.
- **Target Hardware**:
  - **Single-Pixel Hexagon Modules**: WS2812B / SK6812 5050 RGB LEDs mounted on $10\text{mm}$ circular mini button PCBs.
  - **Interconnect**: 3-Pin $2.54\text{mm}$ Pitch Female Header Connectors on all 6 perimeter faces.
  - **WLED Controller**: ESP8266 / ESP32 running WLED (v0.14+ / v0.15+ / v16) with 2D `ledmap.json`.

---

## 🛠️ 2. Mechanical Architecture & 3D OpenSCAD Model

The 3D CAD model ([`honeycomb_single_pixel.scad`](file:///Users/gagansharma/Documents/GitHub/honeycomb_LED_pixel_ws2812b/honeycomb_single_pixel.scad)) is engineered specifically for **Single-Pixel Modular Hexagon Tiles** with **3-pin female header interconnects**.

```
                  [ OUTER FACE SLOT ]
             (Female Connector Body Slides In)
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  3-Pin Female Plastic Body       │ ◄── Stopped by Stopper Wall!
        └──────────────────────────────────┘
    ═══════════════════╗      ╔═══════════════════  ◄── INNER STOPPER WALL
                       ║  ||  ║
                       ║  ||  ║  ◄── 3 Pin Holes (1.25mm)
                       ║  ||  ║
    ═══════════════════╝      ╚═══════════════════
                         │  ||  │
                         │  ||  │
                         ▼  ▼  ▼
            [ CENTRAL INNER LED CHAMBER ]
     (3 Metal Solder Pins Protrude into Chamber — 
       Super Easy to Solder Wires to the LED!)
```

### Key Mechanical Design Principles:
1. **🌐 Omnidirectional 6-Face Interconnect**:
   - Each hexagon tile features connector slots on **all 6 perimeter faces**.
2. **🛡️ Inner Stopper Walls (`stopper_radius = 10.50mm`)**:
   - An inner hexagon wall encloses the central LED chamber.
   - When a 3-pin female header is inserted into an outer face slot ($8.2\text{mm} \times 3.0\text{mm}$), its **black plastic body presses firmly against the inner stopper wall**, preventing the connector from being pushed any further inside.
3. **📍 3 Pin Pass-Through Holes per Face (`pin_hole_dia = 1.25mm`)**:
   - 3 round pin holes ($D = 1.25\text{mm}$ at $2.54\text{mm}$ pitch) pass through each face of the stopper wall.
   - The metal solder pins protruding from the back of the female header slide straight through the holes into the central LED chamber, providing **maximum room for easy soldering of copper wires** to the circular LED PCB.
4. **✨ Snap-Fit Top Diffuser Lid**:
   - Translucent top cover plate (`diffuser_lid()`) with $0.20\text{mm}$ snap-fit clearance.

### Parametric Dimensions Table:
| Parameter | Value | Description |
| :--- | :--- | :--- |
| `pixel_radius` | **`16.00mm`** | Outer hexagon radius (Flat-to-Flat = `27.71mm`) |
| `tile_height` | **`10.50mm`** | Total housing height |
| `wall_thickness` | **`1.60mm`** | Outer wall thickness |
| `base_floor` | **`1.80mm`** | Base plate thickness |
| `stopper_radius` | **`10.50mm`** | Radius of inner stopper wall |
| `header_body_width` | **`8.20mm`** | Width of female header plastic slot |
| `header_body_height` | **`3.00mm`** | Height of female header plastic slot |
| `pin_hole_dia` | **`1.25mm`** | Diameter of 3 pin pass-through holes |
| `pin_contact_pitch` | **`2.54mm`** | Standard 0.1" pitch (VCC, DATA, GND) |

---

## 📂 3. Repository File Structure & Architecture

```
honeycomb_LED_pixel_ws2812b/
├── honeycomb_single_pixel.scad  # Parametric 3D OpenSCAD model (Stopper walls & pin holes)
├── index.html                   # HTML5 Web Application layout, canvas viewport & sidebars
├── style.css                    # Cyberpunk dark theme, glassmorphism, responsive grid
├── app.js                       # HexMath, AppState, Interactive Canvas Engine, WLED & CAD Exporters
├── test_engine.js               # Headless Node.js test runner & assertions
├── README.md                    # Project overview, hardware assembly & 3D specs
└── PROJECT_PROGRESS_AND_HANDOVER.md  # (This file) Complete AI Context & Resume Guide
```

### Breakdown of `app.js`:
1. **`AppState`**: Single reactive state container holding hexagons, wiring chain, selection state, pan/zoom vectors, tool modes (`add`, `select`, `delete`), and history stacks.
2. **`HexMath`**: Pointy & flat axial coordinate projections, distance calculations, and corner generators.
3. **`Canvas Renderer`**: Interactive HTML5 canvas rendering loop displaying glowing hexagon tiles, 3 contact pin indicators per face, wire vectors, LED index numbers, and hover ghost previews.
4. **`CadExporter`**: Generates matching 3D OpenSCAD model code on demand.
5. **`WledExporter`**: Converts custom single-pixel arrangements into WLED 2D `ledmap.json` format.

---

## 🧪 4. Testing & Verification

All test suites run headlessly with Node.js:
```bash
node test_engine.js
```

### Test Verification Output:
- `✓ Verified honeycomb_single_pixel.scad parameters and 3D modules`
- `✓ Verified 6 omnidirectional magnetic neighbor connections (Distance = 1)`
- `✓ 2D Bounding Matrix for Single-Pixel Tiles (Verified)`
- `=== ALL HONEYCOMB PIXEL TESTS PASSED SUCCESSFULLY! ===`

---

## 🚀 5. How to Run Locally

1. **Start Local HTTP Server**:
   ```bash
   cd /Users/gagansharma/Documents/GitHub/honeycomb_LED_pixel_ws2812b
   python3 -m http.server 8282
   ```
2. **Open in Web Browser**:
   Navigate to [`http://localhost:8282/`](http://localhost:8282/)
3. **Run Unit Tests**:
   ```bash
   node test_engine.js
   ```

---

**Current Project Status**: Complete, fully verified, unit-tested, and ready for production deployment & 3D printing.
