// --- Adjustable Parameters (user can change these) ---
springThickness_in  = 3;    // User-input, mm
strapWidth_in       = 26;   // User-input, mm

// --- Enforce parameter constraints ---
strapWidth      = max(strapWidth_in, 26);                // must be > 26 mm
springThickness = max(3, min(springThickness_in, 5));    // 3 <= springThickness <= 5

// Assemble Model
union() {
    customSpring(springThickness);
    center();
    adjustableStrapAttach(strapWidth);
    springHolder();
}

// Module: Fixation
module fixation() {
    import("./baseFiles/fixation.stl");
}

// Module: Spring
module spring() {
    import("./baseFiles/spring.stl");
}

// Module: Center
module center() {
    import("./baseFiles/center.stl");
}

// Module: Custom Spring with thickness
module customSpring(springThickness = 3) {
    resize([0, 0, springThickness]) spring();
}

// Module: Adjustable width strap attachment part
module adjustableStrapAttach(strapWidth = 26) {
    externalWidth = strapWidth * 32 / 26;

    resize([0, externalWidth, 0])
    difference() {
        fixation();
        cube([25,21,100], center=true);
        cube([16,30,100], center=true);
    }
    // Expanding the strap attachment messes up the circle... This is slightly less ugly
    //translate([11, -5, 0])
    //    cube([2, 10, 5]);
    //translate([-13, -5, 0])
    //    cube([2, 10, 5]);
}

// Module: Central Spring Holder
module springHolder() {
    intersection() {
        fixation();
        union() {
            cube([25,21,100], center=true);
            cube([16,30,100], center=true);
        }
    }
}
