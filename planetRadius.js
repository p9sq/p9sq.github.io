// planetRadius.js
// 8-type planet/moon radius calculator — forward (mass→radius) and inverse (radius→mass)

const readline = require("readline");

const EARTH_RADIUS_KM = 6371;
const M_JUP = 317.8; // Earth masses
const R_JUP_RE = 10.9733; // Jupiter mean radius in R_Earth
const AU_M = 1.496e11; // 1 AU in metres
const SIGMA = 5.6704e-8; // Stefan-Boltzmann constant W/m^2/K^4
const L_SUN = 3.828e26; // Solar luminosity in watts
const R_SUN = 6.957e8; // Solar radius in metres
const S_EARTH = 1361.0; // Earth's incident flux in W/m²

// ---------------------------------------------------------------------------
// Calibration anchors (all use volumetric mean radii):
//   Mercury:   0.0553  M_E -> 0.3829 R_E, density 5.427 g/cm³
//   Earth:     1.0     M_E -> 1.0    R_E, density 5.514 g/cm³
//   Tethys:    0.000103 M_E -> 0.0830 R_E  \
//   Rhea:      0.000377 M_E -> 0.1196 R_E   | icy body fit (regression)
//   Callisto:  0.0180  M_E -> 0.3784 R_E   |
//   Titan:     0.0225  M_E -> 0.4043 R_E   |
//   Ganymede:  0.0248  M_E -> 0.4135 R_E  /
//   Triton:    0.00359 M_E -> 0.2120 R_E  \  rocky-icy fit (2-point solve)
//   Europa:    0.00804 M_E -> 0.2451 R_E  /
//   Uranus:    14.54   M_E -> 4.007  R_E, density 1.270 g/cm³
//   Neptune:   17.15   M_E -> 3.883  R_E, density 1.638 g/cm³
//   Saturn:    95.16   M_E -> 9.1402 R_E, density 0.687 g/cm³  <- mean radius
//   Jupiter:   317.83  M_E -> 10.973 R_E, density 1.326 g/cm³  <- mean radius
// ---------------------------------------------------------------------------

const COMPOSITIONS = {
  iron: { label: "Iron planet (Mercury-like)", scale: 0.8, exponent: 0.25 },
  rocky: { label: "Rocky planet (Earth-like)", scale: 1.0, exponent: 0.27 },
  water: { label: "Water/ocean world", scale: 1.26, exponent: 0.27 },
  icyBody: {
    label: "Icy body (Pluto/Titan/Ganymede-like)",
    scale: 1.2335,
    exponent: 0.2948,
  },
  predIcy: {
    label:
      "Predominantly icy (Tethys/Dione/Rhea-like, extended to super-Earths)",
    // Two-segment model:
    //   <= 0.002 M_Earth: calibrated fit from Tethys/Dione/Rhea (scale=1.1013, exp=0.2854)
    //   >  0.002 M_Earth: extended fit for high-ice-fraction bodies (scale=1.41, exp=0.30)
    //     -> at 1 M_Earth: R~1.41 R_E, rho~1.97 g/cm3 (less dense than water world ~2.76)
    //     -> at 10 M_Earth: R~2.81 R_E, rho~2.48 g/cm3
    scale: 1.1013,
    exponent: 0.2854,
    scaleExt: 1.41,
    exponentExt: 0.3,
  },
  rockyIcy: {
    label: "Rocky-icy body (Europa/Triton-like)",
    scale: 0.5838,
    exponent: 0.1799,
  },
  carbonia: {
    label: "Carbon planet (SiC/diamond interior)",
    scale: 1.0357,
    exponent: 0.27,
  },
  miniNeptune: { label: "Mini-Neptune", scale: 1.7, exponent: 0.55 },
  iceGiant: {
    label: "Ice giant (Uranus/Neptune-like)",
    // Power law R = scale * M^exponent.
    // Exponent 0.20 is theoretically motivated by partial electron degeneracy in the
    // high-pressure icy interior (superionic water, compressed H/He): in the
    // non-relativistic degenerate limit pressure scales as rho^(5/3), giving a
    // mass-radius exponent of ~1/5 = 0.20. This flattens the curve compared to a
    // classical envelope-dominated planet (exponent ~0.27-0.30) and is consistent
    // with the Lopez & Fortney (2014) cold theoretical grid at 10% H/He envelope
    // fraction across 10-30 ME.
    // Scale 2.2441 fitted by least squares to anchor points:
    //   [10, 3.50], Uranus (14.54, 4.007), Neptune (17.15, 3.883), [20, 4.05],
    //   [25, 4.25], [30, 4.45]  — theoretical values from Lopez & Fortney 2014.
    // Uranus/Neptune reproduced to within ~4% — unavoidable since they are
    // non-monotonic (Neptune denser despite higher mass), likely due to differing
    // rock/ice ratios rather than a smooth mass-radius trend.
    // Valid range: 10–30 ME. Below 10 ME use Mini-Neptune; above 30 ME use Gas giant.
    scale: 2.2441,
    exponent: 0.2,
  },
  gasGiant: { label: "Gas giant (Saturn/Jupiter-like)", scale: 10.9733 },
  hotJupiter: { label: "Hot Jupiter (irradiation-inflated gas giant)" },
  chthonian: {
    label: "Chthonian planet (stripped gas/ice giant core)",
    scale: 0.9978,
    exponent: 0.3346,
  },
  youngGiant: {
    label: "Young gas giant (Kelvin-Helmholtz contraction, 0.1–13 M_Jupiter)",
    // Two-segment power-law contraction model calibrated against Baraffe et al. (2003)
    // non-irradiated evolutionary tracks. Max error vs. tabulated values: ~3%.
    //
    // R(M, t) uses three anchor radii per mass (in R_Jupiter):
    //   R0: radius at t=0.001 Gyr (1 Myr, very young / still contracting rapidly)
    //   R1: radius at t=0.100 Gyr (transition from rapid to slow contraction)
    //   R2: radius at t=5.0   Gyr (cold equilibrium)
    //
    // Baraffe 2003 calibration points:
    //   1  MJ: 1.30 -> 1.20 -> 1.12 -> 1.02 -> 1.00 (at 1, 10, 100, 1000, 5000 Myr)
    //   5  MJ: 1.55 -> 1.45 -> 1.30 -> 1.18 -> 1.14
    //   13 MJ: 1.70 -> 1.55 -> 1.38 -> 1.25 -> 1.20
    //
    // Sub-Jupiter (<1 MJ): linear blend between Saturn anchor (0.299 MJ, 0.843 RJ at 4.6 Gyr)
    // and Jupiter (1 MJ, 1.00 RJ), with proportionally scaled R0/R1.
  },
};

const TYPE_KEYS = [
  "iron",
  "rocky",
  "water",
  "icyBody",
  "predIcy",
  "rockyIcy",
  "carbonia",
  "miniNeptune",
  "iceGiant",
  "gasGiant",
  "hotJupiter",
  "chthonian",
  "youngGiant",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ---------------------------------------------------------------------------
// HOT JUPITER INFLATION HELPERS
// Based on Thorngren & Fortney (2018) and Sestovic et al. (2018)
//
// Physics summary:
//   - Inflation only occurs above Teq > 1000 K
//   - Heating efficiency ε(Teq) peaks at ~1500 K (~2.5% of incident flux),
//     falls off at both lower and higher temperatures (Ohmic dissipation model)
//   - More massive planets inflate less (Sestovic et al. 2018: 0.37-0.98 Mj
//     most inflated, suppressed above ~1 Mj)
// ---------------------------------------------------------------------------

// Incident flux at planet from stellar luminosity: F = L / (4π a²)
function calcFluxFromL(L_solar, a_AU) {
  return (L_solar * L_SUN) / (4 * Math.PI * Math.pow(a_AU * AU_M, 2));
}

// Incident flux from stellar T_eff and radius: F = σ T⁴ * (R_star/a)²
function calcFluxFromTR(T_eff_K, R_star_Rsun, a_AU) {
  return (
    SIGMA *
    Math.pow(T_eff_K, 4) *
    Math.pow((R_star_Rsun * R_SUN) / (a_AU * AU_M), 2)
  );
}

// Luminosity from T_eff and radius: L = 4π R² σ T⁴ (in L_Sun)
function calcLFromTR(T_eff_K, R_star_Rsun) {
  return (
    (4 *
      Math.PI *
      Math.pow(R_star_Rsun * R_SUN, 2) *
      SIGMA *
      Math.pow(T_eff_K, 4)) /
    L_SUN
  );
}

// Equilibrium temperature from stellar luminosity and orbital distance
// T_eq = (L * (1-A) / (16π σ a²))^0.25
function calcTeq(L_solar, a_AU, albedo) {
  const L = L_solar * L_SUN;
  const a = a_AU * AU_M;
  return Math.pow((L * (1 - albedo)) / (16 * Math.PI * SIGMA * a * a), 0.25);
}

// Heating efficiency ε(Teq) — Gaussian peaked at 1500 K, zero below 1000 K
// Calibrated to Thorngren & Fortney (2018): peak ε ≈ 2.5% at Teq ≈ 1500 K
function heatingEfficiency(Teq) {
  if (Teq < 1000) return 0;
  const peak = 1500; // K
  const sigma = 800; // K — Gaussian width
  return 0.025 * Math.exp(-Math.pow(Teq - peak, 2) / (2 * sigma * sigma));
}

// Mass suppression factor — higher mass planets inflate less
// Sestovic et al. (2018): 0.37-0.98 Mj sweet spot, suppressed above 1 Mj
function massSuppression(massEarth) {
  const mj = massEarth / M_JUP;
  if (mj < 0.37) return 0.5; // sub-Saturn: only partial inflation
  if (mj <= 0.98) return 1.0; // peak inflation range
  return Math.max(0.1, 1.0 - 0.25 * Math.log10(mj)); // gradual suppression
}

// Cold (uninflated) gas giant radius — same model as gasGiant type
function coldGasGiantRadius(massEarth) {
  if (massEarth <= M_JUP) {
    return R_JUP_RE * Math.pow(massEarth / M_JUP, 0.1516);
  }
  return R_JUP_RE * Math.pow(massEarth / M_JUP, -0.0347);
}

// ---------------------------------------------------------------------------
// FORWARD: mass (M_Earth) -> radius (R_Earth)
// ---------------------------------------------------------------------------
function massToRadius(key, mass) {
  const comp = COMPOSITIONS[key];
  let r;

  switch (key) {
    case "predIcy":
      // Two-segment model:
      //   <= 0.002 M_Earth: calibrated fit from Tethys/Dione/Rhea moons
      //   >  0.002 M_Earth: extended fit for larger high-ice-fraction bodies
      //     (less dense and larger radius than the water/ocean world model)
      if (mass <= 0.002) {
        r = comp.scale * Math.pow(mass, comp.exponent);
      } else {
        r = comp.scaleExt * Math.pow(mass, comp.exponentExt);
      }
      break;

    case "rockyIcy":
      // Hard cap: model only valid up to ~0.02 M_Earth (Europa/Triton range).
      // Above this the power law produces physically impossible densities.
      if (mass > 0.02) return null;
      r = comp.scale * Math.pow(mass, comp.exponent);
      break;

    case "miniNeptune":
      r = comp.scale * Math.pow(mass / 5.0, comp.exponent);
      r = Math.max(1.7, Math.min(4.0, r));
      break;

    case "iceGiant":
      if (mass < 10 || mass > 30) return null;
      r = comp.scale * Math.pow(mass, comp.exponent);
      break;

    case "gasGiant":
      if (mass <= M_JUP) {
        // Sub-Jupiter: exponent 0.1516 solved exactly from Saturn+Jupiter mean radii
        r = comp.scale * Math.pow(mass / M_JUP, 0.1516);
      } else {
        // Super-Jupiter: gravity compresses the planet, radius shrinks slightly.
        // Exponent -0.0347 derived from Jupiter (1 M_Jup, 10.973 R_E) and
        // HAT-P-2b (8.45 M_Jup, ~10.19 R_E) — a well-characterised massive hot Jupiter.
        r = comp.scale * Math.pow(mass / M_JUP, -0.0347);
      }
      r = Math.max(7.5, Math.min(13.0, r));
      break;

    default:
      r = comp.scale * Math.pow(mass, comp.exponent);
  }

  // Rocky-icy model is only calibrated for 0.003-0.020 M_Earth (Triton/Europa).
  // Above 0.02 M_Earth the power law collapses to implausible densities.
  // Caller should check for this — massToRadius returns undefined for out-of-range.
  return r;
}

// ---------------------------------------------------------------------------
// INVERSE: radius (R_Earth) -> mass (M_Earth)
//
// General form:  R = scale * mass^exp
//   -> mass = (R / scale)^(1/exp)
//
// Special cases:
//   miniNeptune:  R = scale * (mass/5)^exp
//     -> mass = 5 * (R / scale)^(1/exp)
//
//   iceGiant:     R = scale * (mass/massRef)^exp
//     -> mass = massRef * (R / scale)^(1/exp)
//
//   gasGiant:     R = scale * (mass/M_JUP)^0.1516
//     -> mass = M_JUP * (R / scale)^(1/0.1516)
// ---------------------------------------------------------------------------
function radiusToMass(key, radiusEarth) {
  const comp = COMPOSITIONS[key];
  let mass;
  let warning = null;

  switch (key) {
    case "miniNeptune": {
      if (radiusEarth < 1.7 || radiusEarth > 4.0) {
        warning = `Warning: ${radiusEarth} R_Earth is outside the Mini-Neptune range (1.7-4.0 R_Earth). Result is an extrapolation.`;
      }
      mass = 5.0 * Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      break;
    }

    case "iceGiant": {
      if (radiusEarth < 2.0 || radiusEarth > 6.0) {
        warning = `Warning: ${radiusEarth} R_Earth is outside the Ice giant range (2.0–6.0 R_Earth). Result is an extrapolation.\n   Below ~2.0 R_Earth consider Mini-Neptune; above ~6.0 R_Earth consider Gas giant.`;
      }
      mass = Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      break;
    }

    case "gasGiant": {
      if (radiusEarth < 7.5 || radiusEarth > 13.0) {
        warning = `Warning: ${radiusEarth} R_Earth is outside the Gas giant range (7.5-13.0 R_Earth). Result is an extrapolation.`;
      }
      mass = M_JUP * Math.pow(radiusEarth / comp.scale, 1 / 0.1516);
      break;
    }

    case "predIcy": {
      // Invert the two-segment model.
      // Boundary radius: R at mass=0.002 using the small-body fit.
      const rBoundary = comp.scale * Math.pow(0.002, comp.exponent);
      if (radiusEarth <= rBoundary) {
        // Small-body segment: R = scale * M^exp  ->  M = (R/scale)^(1/exp)
        mass = Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      } else {
        // Extended segment: R = scaleExt * M^expExt  ->  M = (R/scaleExt)^(1/expExt)
        mass = Math.pow(radiusEarth / comp.scaleExt, 1 / comp.exponentExt);
      }
      break;
    }

    default:
      mass = Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
  }

  return { mass, warning };
}

// ---------------------------------------------------------------------------
// Shared density calculation
// Matches Space Engine's density display: scales Earth's mean density by
// the ratio of mass to volume in Earth units (R_Earth = 6378.14 km).
// ---------------------------------------------------------------------------
function calcDensity(massEarth, radiusEarth) {
  const radiusKm = radiusEarth * EARTH_RADIUS_KM;
  const radiusEarths = radiusKm / 6378.14;
  const EARTH_DENSITY = 5.5136; // g/cm^3, Earth's mean density
  return EARTH_DENSITY * (massEarth / Math.pow(radiusEarths, 3));
}

// ---------------------------------------------------------------------------
// Young gas giant internal luminosity (EndogenousHeating)
// Calibrated against Baraffe et al. (2003) cooling tracks.
// Returns luminosity in L_Sun.
//
// Baraffe 2003 log10(L/L_sun) reference points:
//   1  MJ: -3.99(1Myr), -4.42(10Myr), -5.00(100Myr), -5.93(1Gyr), -6.27(5Gyr)
//   5  MJ: -3.56(1Myr), -3.93(10Myr), -4.43(100Myr), -5.19(1Gyr), -5.47(5Gyr)
//   13 MJ: -3.32(1Myr), -3.62(10Myr), -4.05(100Myr), -4.67(1Gyr), -4.98(5Gyr)
// ---------------------------------------------------------------------------
function internalLuminosity(massJupiter, ageGyr) {
  const M = massJupiter;
  const t = Math.max(ageGyr, 0.001);
  // log-linear interpolation: log10(L/Lsun) = A(M) + B(M)*log10(t/Gyr)
  // Coefficients from linear regression on Baraffe tracks; interpolated log-linearly in M.
  const lnScale = Math.log(Math.max(M, 0.1)) / Math.log(13);
  const A = -5.8063 + 1.1865 * lnScale; // -5.8063 at 1 MJ, -4.6198 at 13 MJ
  const B = -0.6455 + 0.1817 * lnScale; // -0.6455 at 1 MJ, -0.4638 at 13 MJ
  return Math.pow(10, A + B * Math.log10(t)); // L_Sun
}

// ---------------------------------------------------------------------------
// Convert internal luminosity to EndogenousHeating temperature (Kelvin)
// SE's EndogenousHeating field takes an effective blackbody temperature derived
// from the planet's internal heat flux: T = (L / (4π R² σ))^(1/4)
// ---------------------------------------------------------------------------
function endogenousTemp(L_Lsun, radiusEarth) {
  const L_W = L_Lsun * L_SUN;
  const R_m = radiusEarth * EARTH_RADIUS_KM * 1e3;
  return Math.pow(L_W / (4 * Math.PI * R_m * R_m * SIGMA), 0.25);
}

// ---------------------------------------------------------------------------
// Young gas giant radius model (Kelvin-Helmholtz contraction)
// Calibrated against Baraffe et al. (2003) non-irradiated cooling tracks.
// Returns radius in R_Earth.
// ---------------------------------------------------------------------------
function youngGiantRadius(massJupiter, ageGyr) {
  const M = massJupiter;
  const t = Math.max(ageGyr, 0.001); // floor at 1 Myr

  // Anchor radii in R_Jupiter — log-linear interpolation between M=1 and M=13;
  // linear blend for M<1 using Saturn (0.299 MJ, 0.843 RJ) as lower anchor.
  let R0, R1, R2;
  if (M >= 1.0) {
    const lnScale = Math.log(Math.min(M, 13)) / Math.log(13);
    R0 = 1.3 + 0.4 * lnScale; // 1.30 at 1 MJ, 1.70 at 13 MJ
    R1 = 1.12 + 0.26 * lnScale; // 1.12 at 1 MJ, 1.38 at 13 MJ
    R2 = 1.0 + 0.2 * lnScale; // 1.00 at 1 MJ, 1.20 at 13 MJ
  } else {
    // Linear blend from M=0.1 to M=1.0, anchored to Saturn at M=0.299
    const f = Math.max(M - 0.1, 0) / 0.9;
    R0 = 1.0 + 0.3 * f;
    R1 = 0.82 + 0.3 * f;
    R2 = 0.72 + 0.28 * f;
  }

  // Cooling exponents derived from anchor radii:
  //   Segment 1 (t <= 0.1 Gyr): rapid contraction, R = R0*(t/0.001)^(-a1)
  //   Segment 2 (t >  0.1 Gyr): slow cooling,     R = R1*(t/0.1)^(-a2)
  const a1 = Math.log(R0 / R1) / Math.log(100); // log(R0/R1) / log(0.1/0.001)
  const a2 = Math.log(R1 / R2) / Math.log(50); // log(R1/R2) / log(5.0/0.1)

  let R;
  if (t <= 0.1) {
    R = R0 * Math.pow(t / 0.001, -a1);
  } else {
    R = R1 * Math.pow(t / 0.1, -a2);
  }

  // Floor at equilibrium radius (prevents extrapolation artefacts for very old ages)
  R = Math.max(R, R2);

  // Convert R_Jupiter -> R_Earth
  return R * R_JUP_RE;
}

// ---------------------------------------------------------------------------
// Smart mass formatter
// Very small masses (e.g. tiny icy moons at 50-200 km) produce values like
// 5.86e-8 M_Earth which toFixed(6) rounds to 0.000000. This formatter
// switches to scientific notation automatically when needed, always
// preserving at least 4 significant figures.
// ---------------------------------------------------------------------------
function formatMass(mass) {
  if (mass === 0) return "0";
  // Below ~5e-7, fixed notation needs 7+ leading zeros — use scientific instead
  if (mass < 5e-7) return mass.toExponential(4);
  // Otherwise use enough decimal places to show 4 significant figures
  const decimals = Math.max(6, Math.ceil(-Math.log10(mass)) + 4);
  return mass.toFixed(decimals);
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function printMenu() {
  console.log("\nChoose planet/moon type:");
  console.log("1) Iron          (Mercury-like, large iron core)");
  console.log("2) Rocky         (Earth-like, silicate mantle)");
  console.log("3) Water/ocean   (ice-rich super-Earth, ocean world)");
  console.log("4) Icy body      (Pluto/Titan/Ganymede-like, ice-dominated)");
  console.log(
    "5) Predominantly icy (Tethys/Dione/Rhea-like, extended to super-Earths)",
  );
  console.log("6) Rocky-icy     (Europa/Triton-like, rock core + ice shell)");
  console.log("7) Carbonia      (carbon-rich, SiC/diamond interior)");
  console.log("8) Mini-Neptune  (K2-18b-like, H/He envelope)");
  console.log("9) Ice giant     (Uranus/Neptune-like)");
  console.log("10) Gas giant    (Saturn/Jupiter-like)");
  console.log(
    "11) Hot Jupiter  (irradiation-inflated, orbiting close to star)",
  );
  console.log("12) Chthonian    (exposed core of stripped gas/ice giant)");
  console.log(
    "13) Young giant  (Kelvin-Helmholtz contraction, 0.1–13 M_Jupiter, age in Gyr)",
  );
}

function askRepeat() {
  rl.question(
    "\nWould you like to calculate another planet? (y/n): ",
    (ans) => {
      if (ans.trim().toLowerCase().startsWith("y")) {
        startCalculation();
      } else {
        console.log("Goodbye!");
        rl.close();
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Chthonian planet input flow
// ---------------------------------------------------------------------------
function askChthonianInputs() {
  console.log(
    "\nChthonian planets are exposed cores of stripped gas/ice giants.",
  );
  console.log("Expected mass range: ~10-150 M_Earth. Density ~5.4-5.5 g/cm3.");

  rl.question("Enter planet mass (in Earth masses): ", (massInput) => {
    const mass = parseFloat(massInput);
    if (isNaN(mass) || mass <= 0) {
      console.log("Invalid mass.");
      return askRepeat();
    }
    if (mass < 5 || mass > 200) {
      console.log(
        "\nNote: " +
          mass +
          " M_Earth is outside the typical chthonian range (10-150 M_Earth).",
      );
    }

    const comp = COMPOSITIONS["chthonian"];
    const radiusEarth = comp.scale * Math.pow(mass, comp.exponent);
    const radiusKm = radiusEarth * EARTH_RADIUS_KM;
    const dens = calcDensity(mass, radiusEarth);

    rl.question(
      "\nEnter stellar luminosity for irradiation context (L_Sun, or Enter to skip): ",
      (lumInput) => {
        if (lumInput.trim() === "") {
          printChthonianResult(mass, radiusEarth, radiusKm, dens, null);
        } else {
          const L_solar = parseFloat(lumInput);
          rl.question("Enter orbital distance (AU): ", (aInput) => {
            const a_AU = parseFloat(aInput);
            if (isNaN(L_solar) || isNaN(a_AU) || L_solar <= 0 || a_AU <= 0) {
              console.log("Invalid stellar inputs — skipping irradiation.");
              printChthonianResult(mass, radiusEarth, radiusKm, dens, null);
            } else {
              const flux = calcFluxFromL(L_solar, a_AU);
              const Teq = calcTeq(L_solar, a_AU, 0.1);
              printChthonianResult(mass, radiusEarth, radiusKm, dens, {
                flux,
                Teq,
                L_solar,
                a_AU,
              });
            }
          });
        }
      },
    );
  });
}

function printChthonianResult(mass, radiusEarth, radiusKm, dens, stellar) {
  console.log(
    "\nType:             Chthonian planet (stripped gas/ice giant core)",
  );
  console.log("Estimated radius: " + radiusKm + " km");
  console.log("In Earth radii:   " + radiusEarth + " R_Earth");
  console.log("Mean density:     " + dens + " g/cm^3");
  console.log(
    "Note: density ~5.4-5.5 g/cm^3 reflects residual compression from former envelope.",
  );
  if (stellar) {
    console.log("\nStellar irradiation context:");
    console.log(
      "  Incident flux:    " +
        stellar.flux / 1e6 +
        " MW/m^2  (" +
        stellar.flux / S_EARTH +
        " S_Earth)",
    );
    console.log("  Equilibrium temp: " + stellar.Teq + " K");
    if (stellar.Teq > 2000) {
      console.log("  Surface likely molten (magma ocean conditions).");
    } else if (stellar.Teq > 1000) {
      console.log(
        "  Extreme irradiation — bare rock surface, no atmosphere expected.",
      );
    }
  }
  askRepeat();
}

// ---------------------------------------------------------------------------
// Hot Jupiter multi-step input flow
// ---------------------------------------------------------------------------
function askHotJupiterInputs() {
  rl.question("Enter planet mass (in Earth masses): ", (massInput) => {
    const mass = parseFloat(massInput);
    if (isNaN(mass) || mass <= 0) {
      console.log("Invalid mass.");
      return askRepeat();
    }

    const massJup = mass / M_JUP;
    if (massJup < 0.1 || massJup > 13) {
      console.log(
        `\n⚠️  ${massJup} M_Jupiter is outside the hot Jupiter range (0.1–13 Mj).`,
      );
      return askRepeat();
    }

    rl.question(
      "Stellar input mode:\n  1) Luminosity (L_Sun)\n  2) T_eff (K) + Radius (R_Sun)\nEnter mode: ",
      (stellarMode) => {
        function proceedWithL(L_solar) {
          rl.question(
            "Enter orbital semi-major axis (in AU, e.g. 0.05): ",
            (aInput) => {
              const a_AU = parseFloat(aInput);
              if (isNaN(a_AU) || a_AU <= 0) {
                console.log("Invalid semi-major axis.");
                return askRepeat();
              }
              rl.question(
                "Enter Bond albedo (0.0-1.0, Enter for default 0.10): ",
                (albInput) => {
                  const A =
                    albInput.trim() === "" || isNaN(parseFloat(albInput))
                      ? 0.1
                      : Math.max(0, Math.min(0.99, parseFloat(albInput)));
                  computeAndPrintHotJupiter(mass, L_solar, a_AU, A);
                },
              );
            },
          );
        }

        if (stellarMode.trim() === "2") {
          rl.question("Enter stellar T_eff (K, e.g. 5778): ", (tInput) => {
            const T_eff = parseFloat(tInput);
            rl.question(
              "Enter stellar radius (R_Sun, e.g. 1.0): ",
              (rInput) => {
                const R_star = parseFloat(rInput);
                if (
                  isNaN(T_eff) ||
                  isNaN(R_star) ||
                  T_eff <= 0 ||
                  R_star <= 0
                ) {
                  console.log("Invalid stellar parameters.");
                  return askRepeat();
                }
                const L_solar = calcLFromTR(T_eff, R_star);
                console.log("  -> Derived luminosity: " + L_solar + " L_Sun");
                proceedWithL(L_solar);
              },
            );
          });
        } else {
          rl.question(
            "Enter stellar luminosity (in L_Sun, e.g. 1.0): ",
            (lumInput) => {
              const L_solar = parseFloat(lumInput);
              if (isNaN(L_solar) || L_solar <= 0) {
                console.log("Invalid luminosity.");
                return askRepeat();
              }
              proceedWithL(L_solar);
            },
          );
        }
      },
    );
  });
}

function computeAndPrintHotJupiter(mass, L_solar, a_AU, A) {
  // Calculate equilibrium temperature
  const Teq = calcTeq(L_solar, a_AU, A);
  const epsilon = heatingEfficiency(Teq);
  const mf = massSuppression(mass);
  const rBase = coldGasGiantRadius(mass);

  // Inflation: ΔR/R = ε(Teq) * massFactor * amplitude
  // Amplitude=18 calibrated to HD 209458b (-1%), TrES-4b (-5%), HAT-P-7b (-7%)
  const inflationFraction = epsilon * mf * 18;
  const rInflatedRaw = rBase * (1 + inflationFraction);

  // Cap at 2.0 Rj (21.95 R_Earth) — physical upper limit for known hot Jupiters.
  // WASP-17b (1.89 Rj) is the most inflated known planet; 2.0 Rj is a safe ceiling.
  const MAX_R_EARTH = 2.0 * R_JUP_RE; // 21.95 R_Earth
  const rFinal = Math.min(rInflatedRaw, MAX_R_EARTH);
  const radiusKm = rFinal * EARTH_RADIUS_KM;
  const density = calcDensity(mass, rFinal);
  const inflPct = inflationFraction * 100;

  console.log(
    `\nType:             Hot Jupiter (irradiation-inflated gas giant)`,
  );
  console.log(`Stellar luminosity: ${L_solar} L_Sun`);
  console.log(`Orbital distance:   ${a_AU} AU`);
  console.log(`Bond albedo:        ${A}`);
  const incidentFlux = calcFluxFromL(L_solar, a_AU);
  console.log(`Equilibrium temp:   ${Teq} K`);
  console.log(
    `Incident flux:      ${incidentFlux / 1e6} MW/m²  (${incidentFlux / S_EARTH} S_Earth)`,
  );

  if (Teq < 1000) {
    console.log(
      `\n⚠️  Teq = ${Teq} K is below the 1000 K inflation threshold.`,
    );
    console.log(`   This planet would behave as a non-inflated gas giant.`);
    console.log(
      `   Consider using the Gas giant type instead, or move it closer to its star.`,
    );
  } else {
    console.log(
      `Inflation applied:  ${inflPct}% radius increase over cold baseline`,
    );
  }

  if (rInflatedRaw > MAX_R_EARTH) {
    console.log(
      `\nNote: Raw inflation gave ${rInflatedRaw * EARTH_RADIUS_KM} km — capped at 2.0 Rj physical limit.`,
    );
  }

  console.log(
    `\nCold baseline:    ${rBase * EARTH_RADIUS_KM} km  /  ${rBase} R_Earth`,
  );
  console.log(`Inflated radius:  ${radiusKm} km`);
  console.log(`In Earth radii:   ${rFinal} R_Earth`);
  console.log(`In Jupiter radii: ${rFinal / R_JUP_RE} R_Jupiter`);
  console.log(`Mean density:     ${density} g/cm^3`);

  askRepeat();
}

// ---------------------------------------------------------------------------
// Young gas giant input flow
// ---------------------------------------------------------------------------
function askYoungGiantInputs(mode) {
  if (mode === "1") {
    // Forward: mass + age -> radius
    console.log(
      "\nYoung gas giant model (Baraffe et al. 2003 cooling tracks, non-irradiated).",
    );
    console.log("Valid range: 0.1–13 M_Jupiter, 0.001–13 Gyr.");

    rl.question("Enter planet mass (in Jupiter masses): ", (massInput) => {
      const massJup = parseFloat(massInput);
      if (isNaN(massJup) || massJup <= 0) {
        console.log("Invalid mass.");
        return askRepeat();
      }
      if (massJup < 0.1 || massJup > 13) {
        console.log(
          `\n⚠️  ${massJup} M_Jupiter is outside the valid range (0.1–13 M_Jupiter).`,
        );
        return askRepeat();
      }

      rl.question("Enter age (in Gyr, e.g. 0.01 = 10 Myr): ", (ageInput) => {
        const age = parseFloat(ageInput);
        if (isNaN(age) || age <= 0) {
          console.log("Invalid age.");
          return askRepeat();
        }
        if (age > 13) {
          console.log(
            "\nNote: Age > 13 Gyr is unusual; model extrapolates beyond calibration.",
          );
        }

        // Ask for optional stellar parameters
        rl.question(
          "\nStellar input (for Teq/flux) — Enter to skip, or choose mode:\n  1) Luminosity (L_Sun) + distance (AU)\n  2) T_eff (K) + radius (R_Sun) + distance (AU)\nEnter mode or press Enter to skip: ",
          (stellarMode) => {
            function computeAndPrint(L_solar, a_AU) {
              const radiusEarth = youngGiantRadius(massJup, age);
              const radiusKm = radiusEarth * EARTH_RADIUS_KM;
              const radiusJup = radiusEarth / R_JUP_RE;
              const massEarth = massJup * M_JUP;
              const density = calcDensity(massEarth, radiusEarth);
              const L_int_Lsun = internalLuminosity(massJup, age);
              const L_int_W = L_int_Lsun * L_SUN;
              // Surface flux from internal luminosity
              const R_m = radiusEarth * EARTH_RADIUS_KM * 1e3;
              const L_int_surface = L_int_W / (4 * Math.PI * R_m * R_m);

              console.log(`\nType:             Young gas giant`);
              console.log(
                `Mass:             ${massJup} M_Jupiter  (${massEarth.toFixed(2)} M_Earth)`,
              );
              console.log(`Age:              ${age} Gyr`);
              console.log(`Estimated radius: ${radiusKm} km`);
              console.log(`In Jupiter radii: ${radiusJup} R_Jupiter`);
              console.log(`In Earth radii:   ${radiusEarth} R_Earth`);
              console.log(`Mean density:     ${density} g/cm^3`);
              const T_endo = endogenousTemp(L_int_Lsun, radiusEarth);
              console.log(
                `\nEndogenousHeating: ${T_endo} K  (for SE .sc file)`,
              );
              console.log(
                `  Internal luminosity: ${L_int_Lsun.toExponential(3)} L_Sun`,
              );
              console.log(
                `  Internal flux:       ${L_int_surface.toExponential(3)} W/m² at surface`,
              );

              if (L_solar !== null && a_AU !== null) {
                const flux = calcFluxFromL(L_solar, a_AU);
                const Teq = calcTeq(L_solar, a_AU, 0.1);
                const ratio = L_int_surface / (flux / 4); // compare to absorbed flux per unit area
                console.log(`\nStellar irradiation:`);
                console.log(
                  `  Incident flux:      ${(flux / 1e6).toFixed(3)} MW/m²  (${(flux / S_EARTH).toFixed(2)} S_Earth)`,
                );
                console.log(`  Equilibrium temp:   ${Teq} K`);
                console.log(
                  `  Endogenous/stellar: ${ratio.toExponential(2)}  (internal vs absorbed flux ratio)`,
                );
                if (ratio > 0.1) {
                  console.log(
                    `  Note: Endogenous heating is significant relative to stellar input.`,
                  );
                }
              }

              const coldR = youngGiantRadius(massJup, 5.0);
              const coldRJup = coldR / R_JUP_RE;
              if (age < 1.0) {
                console.log(
                  `\nStill contracting — cold equilibrium radius ~${coldRJup} R_Jupiter at 5 Gyr.`,
                );
              }

              askRepeat();
            }

            const sm = stellarMode.trim();
            if (sm === "") {
              computeAndPrint(null, null);
            } else if (sm === "1") {
              rl.question("Enter stellar luminosity (L_Sun): ", (lInput) => {
                const L_solar = parseFloat(lInput);
                rl.question("Enter orbital distance (AU): ", (aInput) => {
                  const a_AU = parseFloat(aInput);
                  if (
                    isNaN(L_solar) ||
                    isNaN(a_AU) ||
                    L_solar <= 0 ||
                    a_AU <= 0
                  ) {
                    console.log(
                      "Invalid stellar inputs — skipping irradiation.",
                    );
                    computeAndPrint(null, null);
                  } else {
                    computeAndPrint(L_solar, a_AU);
                  }
                });
              });
            } else if (sm === "2") {
              rl.question("Enter stellar T_eff (K): ", (tInput) => {
                const T_eff = parseFloat(tInput);
                rl.question("Enter stellar radius (R_Sun): ", (rInput) => {
                  const R_star = parseFloat(rInput);
                  rl.question("Enter orbital distance (AU): ", (aInput) => {
                    const a_AU = parseFloat(aInput);
                    if (
                      isNaN(T_eff) ||
                      isNaN(R_star) ||
                      isNaN(a_AU) ||
                      T_eff <= 0 ||
                      R_star <= 0 ||
                      a_AU <= 0
                    ) {
                      console.log(
                        "Invalid stellar inputs — skipping irradiation.",
                      );
                      computeAndPrint(null, null);
                    } else {
                      const L_solar = calcLFromTR(T_eff, R_star);
                      computeAndPrint(L_solar, a_AU);
                    }
                  });
                });
              });
            } else {
              console.log("Unrecognised mode — skipping stellar parameters.");
              computeAndPrint(null, null);
            }
          },
        );
      });
    });
  } else {
    // Inverse: radius + age -> mass (iterative solve via bisection)
    console.log(
      "\nYoung gas giant inverse: provide radius and age to estimate mass.",
    );
    console.log("Valid range: 0.1–13 M_Jupiter, 0.001–13 Gyr.");

    rl.question(
      "Radius unit:\n  1) Kilometres\n  2) Earth radii\nEnter unit: ",
      (unitInput) => {
        const unit = unitInput.trim();
        rl.question(
          unit === "1" ? "Enter radius (km): " : "Enter radius (R_Earth): ",
          (rInput) => {
            const rawRadius = parseFloat(rInput);
            if (isNaN(rawRadius) || rawRadius <= 0) {
              console.log("Invalid radius.");
              return askRepeat();
            }
            const radiusEarth =
              unit === "1" ? rawRadius / EARTH_RADIUS_KM : rawRadius;

            rl.question("Enter age (in Gyr): ", (ageInput) => {
              const age = parseFloat(ageInput);
              if (isNaN(age) || age <= 0) {
                console.log("Invalid age.");
                return askRepeat();
              }

              // Bisection search over mass in [0.1, 13] M_Jupiter
              let lo = 0.1,
                hi = 13.0,
                mid,
                rMid;
              for (let i = 0; i < 60; i++) {
                mid = (lo + hi) / 2;
                rMid = youngGiantRadius(mid, age);
                if (rMid < radiusEarth) {
                  hi = mid;
                } else {
                  lo = mid;
                }
              }
              const massJup = mid;
              const massEarth = massJup * M_JUP;
              const radiusKm = radiusEarth * EARTH_RADIUS_KM;
              const radiusJup = radiusEarth / R_JUP_RE;
              const density = calcDensity(massEarth, radiusEarth);

              // Check if radius is within model bounds at this age
              const rMin = youngGiantRadius(0.1, age);
              const rMax = youngGiantRadius(13.0, age);
              if (radiusEarth < rMin || radiusEarth > rMax) {
                console.log(
                  `\n⚠️  Radius ${radiusJup} R_Jupiter is outside the model range at ${age} Gyr`,
                );
                console.log(
                  `   (valid: ${rMin / R_JUP_RE}–${rMax / R_JUP_RE} R_Jupiter for 0.1–13 M_Jupiter).`,
                );
              }

              console.log(`\nType:             Young gas giant`);
              console.log(`Age:              ${age} Gyr`);
              console.log(
                `Input radius:     ${radiusKm} km  /  ${radiusJup} R_Jupiter  /  ${radiusEarth} R_Earth`,
              );
              console.log(
                `Estimated mass:   ${massJup} M_Jupiter  (${massEarth.toFixed(2)} M_Earth)`,
              );
              console.log(`Mean density:     ${density} g/cm^3`);

              askRepeat();
            });
          },
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------
function startCalculation() {
  rl.question(
    "\nCalculate:\n  1) Radius from mass\n  2) Mass from radius\n\nEnter mode: ",
    (modeInput) => {
      const mode = modeInput.trim();
      if (mode !== "1" && mode !== "2") {
        console.log("Invalid mode.");
        return askRepeat();
      }

      printMenu();

      rl.question("\nEnter option number: ", (compInput) => {
        const compIndex = parseInt(compInput) - 1;

        if (
          isNaN(compIndex) ||
          compIndex < 0 ||
          compIndex >= TYPE_KEYS.length
        ) {
          console.log("Invalid choice.");
          return askRepeat();
        }

        const key = TYPE_KEYS[compIndex];
        const comp = COMPOSITIONS[key];

        // Hot Jupiter and chthonian have their own multi-step input flows
        if (key === "hotJupiter" && mode === "1") {
          return askHotJupiterInputs();
        }
        if (key === "chthonian" && mode === "1") {
          return askChthonianInputs();
        }
        if (key === "youngGiant") {
          return askYoungGiantInputs(mode);
        }

        if (mode === "1") {
          // --- Forward: mass -> radius ---
          rl.question("Enter planet mass (in Earth masses): ", (input) => {
            const mass = parseFloat(input);
            if (isNaN(mass) || mass <= 0) {
              console.log("Invalid mass.");
              return askRepeat();
            }

            const radiusEarth = massToRadius(key, mass);

            if (radiusEarth === null) {
              if (key === "iceGiant") {
                if (mass < 10) {
                  console.log(
                    `\n⚠️  ${mass} M_Earth is below the Ice giant range (10–30 M_Earth).`,
                  );
                  console.log(
                    `   Consider using Mini-Neptune instead for planets in this mass range.`,
                  );
                } else {
                  console.log(
                    `\n⚠️  ${mass} M_Earth is above the Ice giant range (10–30 M_Earth).`,
                  );
                  console.log(
                    `   Consider using Gas giant instead for planets in this mass range.`,
                  );
                }
              } else {
                console.log(
                  `\n⚠️  Mass ${mass} M_Earth is outside the valid range for Rocky-icy.`,
                );
                console.log(
                  `   This model is only calibrated up to 0.02 M_Earth (Europa/Triton scale).`,
                );
                console.log(
                  `   For larger rock+ice bodies consider Water/ocean or Icy body instead.`,
                );
              }
              return askRepeat();
            }

            const radiusKm = radiusEarth * EARTH_RADIUS_KM;
            const density = calcDensity(mass, radiusEarth);

            console.log(`\nType:             ${comp.label}`);
            console.log(`Estimated radius: ${radiusKm} km`);
            console.log(`In Earth radii:   ${radiusEarth} R_Earth`);
            console.log(`Mean density:     ${density} g/cm^3`);
            if (key === "predIcy" && mass > 0.002) {
              console.log(
                `\nNote: Extended model active (mass > 0.002 M_Earth). Density ~1.0-2.5 g/cm³,`,
              );
              console.log(
                `      lower than the Water/ocean world model — suitable for high-ice-fraction bodies.`,
              );
            }

            askRepeat();
          });
        } else {
          // --- Inverse: radius -> mass ---
          rl.question(
            "Enter planet radius — in km or R_Earth?\n  1) km\n  2) R_Earth\nEnter unit: ",
            (unitInput) => {
              const unit = unitInput.trim();
              if (unit !== "1" && unit !== "2") {
                console.log("Invalid unit choice.");
                return askRepeat();
              }

              const unitLabel = unit === "1" ? "km" : "R_Earth";
              rl.question(
                `Enter planet radius (in ${unitLabel}): `,
                (input) => {
                  const rawRadius = parseFloat(input);
                  if (isNaN(rawRadius) || rawRadius <= 0) {
                    console.log("Invalid radius.");
                    return askRepeat();
                  }

                  const radiusEarth =
                    unit === "1" ? rawRadius / EARTH_RADIUS_KM : rawRadius;

                  const { mass, warning } = radiusToMass(key, radiusEarth);
                  const density = calcDensity(mass, radiusEarth);

                  console.log(`\nType:             ${comp.label}`);
                  console.log(
                    `Input radius:     ${radiusEarth * EARTH_RADIUS_KM} km  /  ${radiusEarth} R_Earth`,
                  );
                  console.log(`Estimated mass:   ${formatMass(mass)} M_Earth`);
                  if (mass >= 1 / M_JUP) {
                    console.log(`                  ${mass / M_JUP} M_Jupiter`);
                  }
                  console.log(`Mean density:     ${density} g/cm^3`);
                  if (warning) console.log(`\n${warning}`);

                  askRepeat();
                },
              );
            },
          );
        }
      });
    },
  );
}

startCalculation();
