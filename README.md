# ⬡ Honeycomb Pixel — 3-Wire Magnetic Interconnect WS2812B Hexagon Module

> **Repository**: [https://github.com/gagansharma18/honeycomb_LED_pixel_ws2812b](https://github.com/gagansharma18/honeycomb_LED_pixel_ws2812b)  
> **Target Firmware**: WLED (v0.14+ / v0.15+ / v16), FastLED, ESP32, Arduino  
> **Concept**: Omnidirectional Single-Pixel Hexagon Tile with **3-wire magnetic pogo-pin contacts on all 6 perimeter faces**.

---

## 🌟 Concept & Mechanical Architecture

**Honeycomb Pixel** is a modular hardware system where every single WS2812B / SK6812 RGB LED pixel is housed in its own 3D printable hexagonal tile. 

### Key Innovations:
1. **🌐 6-Face Omnidirectional Magnetic Snap**:
   - Each pixel module can snap onto **ANY of the 6 outer faces** of adjacent pixels.
2. **🧲 3-Wire Conductive Magnetic Contact Triad per Face**:
   - **Pin 1**: `VCC (+5V Power)`
   - **Pin 2**: `DATA (Signal)`
   - **Pin 3**: `GND (Ground)`
   - When two tiles touch face-to-face, 3 spring-loaded pogo pins align automatically, passing power and data signals across your custom arrangement.
3. **💡 Internal Driver & LED Cavity**:
   - Accommodates standard 5050 RGB WS2812B LEDs or $10\text{mm}$ to $12\text{mm}$ round LED PCB star boards.
   - Internal wire channels connect the 6 perimeter contact triads to the central LED driver.
4. **✨ Snap-Fit Top Diffuser**:
   - Translucent top lid snaps into place over the LED bed for smooth light dispersion.

---

## 🛠️ OpenSCAD 3D Parametric CAD Model (`honeycomb_single_pixel.scad`)

The project includes a fully parametric 3D OpenSCAD model ([`honeycomb_single_pixel.scad`](file:///Users/gagansharma/Documents/GitHub/honeycomb_LED_pixel_ws2812b/honeycomb_single_pixel.scad)) ready for 3D printing on Bambu Studio, Cura, or PrusaSlicer.

### Default Parametric Specs:
- **Outer Tile Radius**: `15.00mm` (Flat-to-Flat = `25.98mm`)
- **Tile Height**: `10.00mm`
- **Wall Thickness**: `1.60mm`
- **Base Floor Thickness**: `1.80mm`
- **LED Tray Level**: `4.00mm`
- **Pogo Socket Diameter**: `3.10mm` (For $3\text{mm}$ magnetic pogo pins or cylindrical magnets)
- **Pogo Contact Pitch**: `4.50mm` (Spacing between VCC, DATA, and GND pins)
- **Diffuser Recess**: `1.50mm` (Snap-fit lip)

---

## 💻 Web App Editor & Visualizer (`index.html`)

Launch `index.html` in any browser to open the interactive canvas editor:
- **Place & Drag Single Pixels**: Click to add single-pixel tiles to the honeycomb workspace.
- **Magnetic Auto-Snap**: Pixels automatically snap face-to-face onto neighbor cells.
- **Auto-Wiring Solvers**: Route data signals using Serpentine, Spiral, or Custom wiring paths.
- **Live FX Simulator**: Simulate 2D Plasma, Matrix Rain, Starfield, and Fire effects in real time.
- **1-Click WLED Sync**: Push matrix mapping and segment configs directly to WLED controllers over Wi-Fi.

---

## 🧪 Running Unit Tests

Run headless tests using Node.js:
```bash
node test_engine.js
```

---

## 📄 License
MIT License. Free for open source 3D printing and DIY LED hardware projects.
