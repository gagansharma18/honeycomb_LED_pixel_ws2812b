// ==========================================================================
// Honeycomb Pixel — 3-Wire Magnetic Interconnect Single-Pixel Tile
// Parametric 3D OpenSCAD Model for WS2812B / SK6812 Single LED Modules
// Repository: https://github.com/gagansharma18/honeycomb_LED_pixel_ws2812b
// ==========================================================================

// --------------------------------------------------------------------------
// 1. PARAMETRIC USER DIMENSIONS (All values in millimeters)
// --------------------------------------------------------------------------
pixel_radius        = 15.00; // Outer radius of single hexagon tile (flat-to-flat = 25.98mm)
tile_height         = 10.00; // Total height of the base housing
wall_thickness      = 1.60;  // Uniform perimeter wall thickness
base_floor          = 1.80;  // Solid bottom base plate thickness
led_tray_height     = 4.00;  // Recessed bed tray height for LED PCB

// Magnetic Contact Specs (3 contacts per face: VCC, DATA, GND)
pogo_socket_dia     = 3.10;  // Socket diameter for 3mm magnets / pogo pins
pogo_socket_depth   = 2.20;  // Depth of socket pockets on perimeter faces
pogo_contact_pitch  = 4.50;  // Center-to-center distance between VCC, DATA, GND contacts

// Central LED Pocket & Diffuser Lid Specs
led_pocket_radius   = 6.50;  // Pocket radius for 5050 RGB LED / 12mm round star board
led_pocket_depth    = 2.20;  // Recessed pocket depth
diffuser_recess     = 1.50;  // Recessed top lip depth for snap-fit diffuser lid
diffuser_thickness  = 1.40;  // Thickness of translucent top diffuser cap
diffuser_clearance  = 0.20;  // Snap-fit clearance for 3D printing

// --------------------------------------------------------------------------
// 2. DERIVED GEOMETRY CALCULATIONS
// --------------------------------------------------------------------------
r_outer = pixel_radius;
r_inner = pixel_radius - wall_thickness;
a_outer = r_outer * sqrt(3)/2; // Apothem (distance to flat face)
a_inner = r_inner * sqrt(3)/2;

// --------------------------------------------------------------------------
// 3. SINGLE PIXEL BASE HOUSING MODULE
// --------------------------------------------------------------------------
module single_pixel_base() {
  difference() {
    // 1. Solid Outer Hexagon Body
    rotate([0, 0, 30])
      cylinder(r = r_outer, h = tile_height, $fn = 6);

    // 2. Main Light Chamber (Upper chamber above LED tray)
    translate([0, 0, led_tray_height])
      rotate([0, 0, 30])
        cylinder(r = r_inner, h = tile_height + 1, $fn = 6);

    // 3. Recessed Top Lip for Snap-Fit Diffuser Lid
    translate([0, 0, tile_height - diffuser_recess])
      rotate([0, 0, 30])
        cylinder(r = r_outer - wall_thickness/2, h = diffuser_recess + 0.1, $fn = 6);

    // 4. Central Pocket for WS2812B 5050 LED / PCB Board
    translate([0, 0, base_floor])
      cylinder(r = led_pocket_radius, h = led_tray_height - base_floor + 0.1, $fn = 6);

    // 5. 18 Magnetic Contact Sockets (3 sockets per face x 6 faces)
    for (angle = [0 : 60 : 300]) {
      rotate([0, 0, angle]) {
        // Outer face center is at x = a_outer
        translate([a_outer, 0, tile_height / 2]) {
          // Contact 1: VCC (+5V)
          translate([0, -pogo_contact_pitch, 0])
            rotate([0, 90, 0])
              cylinder(d = pogo_socket_dia, h = pogo_socket_depth + 0.1, center = true, $fn = 24);

          // Contact 2: DATA (Signal)
          translate([0, 0, 0])
            rotate([0, 90, 0])
              cylinder(d = pogo_socket_dia, h = pogo_socket_depth + 0.1, center = true, $fn = 24);

          // Contact 3: GND (Ground)
          translate([0, pogo_contact_pitch, 0])
            rotate([0, 90, 0])
              cylinder(d = pogo_socket_dia, h = pogo_socket_depth + 0.1, center = true, $fn = 24);
        }

        // Internal Wire Pass-Through Channels leading to Center LED Cavity
        translate([a_inner - 0.1, -pogo_contact_pitch * 1.2, base_floor])
          cube([wall_thickness + 0.2, pogo_contact_pitch * 2.4, led_tray_height - base_floor]);
      }
    }
  }
}

// --------------------------------------------------------------------------
// 4. TRANSLUCENT SNAP-FIT TOP DIFFUSER LID MODULE
// --------------------------------------------------------------------------
module diffuser_lid() {
  r_diff = (r_outer - wall_thickness/2) - diffuser_clearance;
  rotate([0, 0, 30])
    cylinder(r = r_diff, h = diffuser_thickness, $fn = 6);
}

// --------------------------------------------------------------------------
// 5. COMBINED ASSEMBLY PREVIEW
// --------------------------------------------------------------------------
module single_pixel_assembly(explode = false) {
  offset_z = explode ? 12 : 0;

  // Base Housing
  color([0.15, 0.20, 0.30, 1.0])
    single_pixel_base();

  // Simulated 5050 RGB LED PCB
  translate([0, 0, base_floor + 0.2])
    color([0.10, 0.70, 0.40, 1.0])
      cylinder(r = led_pocket_radius - 0.2, h = 1.60, $fn = 24);

  translate([0, 0, base_floor + 1.80])
    color([0.90, 0.90, 0.90, 1.0])
      cube([5.0, 5.0, 1.60], center = true);

  // Snap-Fit Top Diffuser Lid
  translate([0, 0, tile_height - diffuser_recess + offset_z])
    color([0.95, 0.95, 1.00, 0.75])
      diffuser_lid();
}

// Render Main Base Housing for STL Export
single_pixel_base();

// Uncomment to preview full exploded assembly in OpenSCAD:
// single_pixel_assembly(explode = true);
