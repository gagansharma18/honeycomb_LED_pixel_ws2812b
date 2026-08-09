// ==========================================================================
// Honeycomb Pixel — 3-Pin Female Header Single-Pixel Hexagon Tile
// OpenSCAD Model with Inner Stopper Walls & 3-Pin Pass-Through Holes
// Repository: https://github.com/gagansharma18/honeycomb_LED_pixel_ws2812b
// ==========================================================================

// --------------------------------------------------------------------------
// 1. PARAMETRIC USER DIMENSIONS (All values in millimeters)
// --------------------------------------------------------------------------
pixel_radius        = 16.00; // Outer radius of single hexagon tile (flat-to-flat = 27.71mm)
tile_height         = 10.50; // Total height of housing
wall_thickness      = 1.60;  // Outer perimeter wall thickness
base_floor          = 1.80;  // Solid bottom base floor thickness

// Inner Stopper Wall & Central LED Chamber Specs
stopper_radius      = 10.50; // Radius of inner hexagon stopper wall
stopper_wall_thick  = 1.60;  // Thickness of inner stopper wall
led_chamber_height  = 4.50;  // Height of central LED chamber floor

// 3-Pin Female Header Specs (Matching standard 2.54mm 3-pin female connectors)
header_pitch        = 2.54;  // Standard 2.54mm (0.1") pin pitch
header_body_width   = 8.20;  // Outer slot width for female plastic body (8.2mm)
header_body_height = 3.00;  // Outer slot height for female plastic body (3.0mm)

// 3 Pin Holes on Inner Stopper Wall (Pins slide through; plastic body stops)
pin_hole_dia        = 1.25;  // Diameter of pin holes for header pins (1.25mm)
pin_contact_pitch   = 2.54;  // Center-to-center pitch between 3 pin holes

// Snap-Fit Top Diffuser Lid Specs
diffuser_recess     = 1.50;  // Recessed lip depth for snap-fit diffuser lid
diffuser_thickness  = 1.40;  // Thickness of translucent top diffuser cap
diffuser_clearance  = 0.20;  // Snap-fit clearance for 3D printing

// --------------------------------------------------------------------------
// 2. DERIVED GEOMETRY CALCULATIONS
// --------------------------------------------------------------------------
r_outer   = pixel_radius;
r_outer_in= pixel_radius - wall_thickness;
a_outer   = r_outer * sqrt(3)/2;   // Outer face apothem (distance to outer face)
a_stopper = stopper_radius * sqrt(3)/2; // Inner stopper wall apothem

// --------------------------------------------------------------------------
// 3. SINGLE PIXEL BASE HOUSING MODULE (INNER STOPPER WALLS + PIN HOLES)
// --------------------------------------------------------------------------
module single_pixel_base() {
  difference() {
    // 1. Solid Outer Hexagon Body
    rotate([0, 0, 30])
      cylinder(r = r_outer, h = tile_height, $fn = 6);

    // 2. Upper Light Chamber (Above LED bed level)
    translate([0, 0, led_chamber_height])
      rotate([0, 0, 30])
        cylinder(r = r_outer_in, h = tile_height + 1, $fn = 6);

    // 3. Recessed Lip for Snap-Fit Top Diffuser Lid
    translate([0, 0, tile_height - diffuser_recess])
      rotate([0, 0, 30])
        cylinder(r = r_outer - wall_thickness/2, h = diffuser_recess + 0.1, $fn = 6);

    // 4. Central LED Chamber (Space inside inner stopper wall where LED resides)
    translate([0, 0, base_floor])
      rotate([0, 0, 30])
        cylinder(r = stopper_radius - stopper_wall_thick, h = led_chamber_height - base_floor + 0.1, $fn = 6);

    // 5. Outer Slots & Inner Stopper Wall Pin Holes on all 6 faces
    for (angle = [0 : 60 : 300]) {
      rotate([0, 0, angle]) {
        
        // A) Outer Connector Slot (Holds 3-pin female connector body up to stopper wall)
        translate([a_outer - (a_outer - a_stopper)/2, 0, (base_floor + led_chamber_height) / 2]) {
          cube([a_outer - a_stopper + 0.1, header_body_width, header_body_height], center = true);
        }

        // B) 3 Pin Holes in Inner Stopper Wall (Open pins slide through into LED chamber)
        translate([a_stopper, 0, (base_floor + led_chamber_height) / 2]) {
          // Pin 1: VCC (+5V)
          translate([0, -pin_contact_pitch, 0])
            rotate([0, 90, 0])
              cylinder(d = pin_hole_dia, h = stopper_wall_thick * 4, center = true, $fn = 24);

          // Pin 2: DATA (Signal)
          translate([0, 0, 0])
            rotate([0, 90, 0])
              cylinder(d = pin_hole_dia, h = stopper_wall_thick * 4, center = true, $fn = 24);

          // Pin 3: GND (Ground)
          translate([0, pin_contact_pitch, 0])
            rotate([0, 90, 0])
              cylinder(d = pin_hole_dia, h = stopper_wall_thick * 4, center = true, $fn = 24);
        }
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
// 5. COMBINED ASSEMBLY PREVIEW WITH 3-PIN FEMALE CONNECTORS
// --------------------------------------------------------------------------
module single_pixel_assembly(explode = false) {
  offset_z = explode ? 14 : 0;

  // Base Housing
  color([0.15, 0.20, 0.30, 1.0])
    single_pixel_base();

  // Circular WS2812B Mini PCB Module inside central chamber
  translate([0, 0, base_floor + 0.2]) {
    color([0.95, 0.95, 0.95, 1.0])
      cylinder(d = 10.0, h = 1.40, $fn = 48);

    translate([0, 0, 1.40])
      color([1.0, 1.0, 1.0, 1.0])
        cube([5.0, 5.0, 1.60], center = true);
  }

  // Snap-Fit Top Diffuser Lid
  translate([0, 0, tile_height - diffuser_recess + offset_z])
    color([0.95, 0.95, 1.00, 0.75])
      diffuser_lid();
}

// Render Main Base Housing for STL Export
single_pixel_base();

// Uncomment to preview full exploded assembly in OpenSCAD:
// single_pixel_assembly(explode = true);
