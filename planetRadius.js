// planetRadius.js
// 13-type planet/moon radius calculator — forward (mass→radius) and inverse (radius→mass)
// Improved: density fix, chthonian physics, smooth HJ inflation onset, rockyIcy bounds,
//           predIcy inverse fix, youngGiant bisection fix, hotJupiter inverse, formatted output.

const readline = require("readline");

// ---------------------------------------------------------------------------
// Physical constants
// ---------------------------------------------------------------------------
const EARTH_RADIUS_KM = 6371; // IAU volumetric mean radius of Earth (km)
const EARTH_DENSITY = 5.5136; // Earth mean density (g/cm³), using volumetric mean radius
const M_JUP = 317.8; // Jupiter mass in Earth masses
const R_JUP_RE = 10.9733; // Jupiter volumetric mean radius in R_Earth
const MAX_R_EARTH = 2.0 * R_JUP_RE; // ~21.95 R_Earth — physical upper limit for hot Jupiters
const AU_M = 1.496e11; // 1 AU in metres
const SIGMA = 5.6704e-8; // Stefan-Boltzmann constant (W/m²/K⁴)
const L_SUN = 3.828e26; // Solar luminosity (W)
const R_SUN = 6.957e8; // Solar radius (m)
const S_EARTH = 1361.0; // Earth's incident stellar flux (W/m²)

// ---------------------------------------------------------------------------
// Calibration anchors (all use volumetric mean radii):
//   Mercury:   0.0553  M_E -> 0.3829 R_E, density 5.427 g/cm³  (iron model, ~1.5% overshoot)
//   Earth:     1.0     M_E -> 1.0    R_E, density 5.514 g/cm³
//   Tethys:    0.000103 M_E -> 0.0830 R_E  \
//   Dione:     0.000185 M_E -> 0.0976 R_E   | predIcy small-body fit
//   Rhea:      0.000377 M_E -> 0.1196 R_E  /
//   Callisto:  0.0180  M_E -> 0.3784 R_E   \
//   Titan:     0.0225  M_E -> 0.4043 R_E    | icyBody fit (Pluto not well-described here)
//   Ganymede:  0.0248  M_E -> 0.4135 R_E   /
//   Triton:    0.00359 M_E -> 0.2120 R_E  \ rockyIcy 2-point fit
//   Europa:    0.00804 M_E -> 0.2451 R_E  / (valid range: ~0.002–0.020 M_E)
//   Uranus:    14.54   M_E -> 4.007  R_E, density 1.270 g/cm³
//   Neptune:   17.15   M_E -> 3.883  R_E, density 1.638 g/cm³
//   Saturn:    95.16   M_E -> 9.1402 R_E, density 0.687 g/cm³
//   Jupiter:   317.83  M_E -> 10.973 R_E, density 1.326 g/cm³
// ---------------------------------------------------------------------------

const COMPOSITIONS = {
  iron: {
    label: "Iron planet (Mercury-like, large iron core)",
    scale: 0.8,
    exponent: 0.25,
  },
  rocky: {
    label: "Rocky planet (Earth-like, silicate mantle)",
    scale: 1.0,
    exponent: 0.27,
  },
  water: {
    label: "Water/ocean world (ice-rich, volatile-heavy)",
    scale: 1.26,
    exponent: 0.27,
  },
  icyBody: {
    // Calibrated to Callisto, Titan, Ganymede.
    // Pluto (0.00218 M_E, 0.187 R_E, 1.86 g/cm³) is rocky-icy in composition
    // and is not well-described by this model — see rockyIcy.
    label: "Icy body (Titan/Ganymede-like, ice-dominated)",
    scale: 1.2335,
    exponent: 0.2948,
  },
  predIcy: {
    // Two-segment model — the segments are intentionally discontinuous at 0.002 M_Earth:
    //   <= 0.002 M_Earth: calibrated to Tethys/Dione/Rhea
    //   >  0.002 M_Earth: extended fit for high-ice-fraction larger bodies
    //     -> at 1 M_Earth:  R~1.41 R_E, ρ~1.97 g/cm³ (less dense than water world)
    //     -> at 10 M_Earth: R~2.81 R_E, ρ~2.48 g/cm³
    label:
      "Predominantly icy (Tethys/Dione/Rhea-like, extended to super-Earths)",
    scale: 1.1013,
    exponent: 0.2854,
    scaleExt: 1.41,
    exponentExt: 0.3,
  },
  rockyIcy: {
    // Two-point fit to Triton and Europa. Valid range: ~0.002–0.020 M_Earth.
    // Returns null outside this range — model collapses to unphysical densities beyond it.
    label: "Rocky-icy body (Europa/Triton-like, rock core + ice shell)",
    scale: 0.5838,
    exponent: 0.1799,
  },
  carbonia: {
    label: "Carbon planet (SiC/diamond interior)",
    scale: 1.0357,
    exponent: 0.27,
  },
  miniNeptune: {
    // Exponent 0.60 calibrated to K2-18b (8.63 M_E → 2.37 R_E) and
    // GJ 436b (21.36 M_E → 4.22 R_E). Anchored at 5 M_E = 1.7 R_E.
    label: "Mini-Neptune (volatile H/He envelope, sub-Neptune)",
    scale: 1.7,
    exponent: 0.6,
  },
  iceGiant: {
    label: "Ice giant (Uranus/Neptune-like)",
    // Power law R = scale * M^exponent.
    // Exponent 0.20 is an empirical least-squares fit to the Lopez & Fortney (2014)
    // cold theoretical grid at 10% H/He envelope fraction across 10–30 M_E (anchor
    // points below) — NOT a first-principles degeneracy-pressure derivation.
    // Note: a fully electron-degenerate interior (Γ=5/3 polytrope, the white-dwarf
    // limit) actually gives R ∝ M^(-1/3) — radius SHRINKING with mass — the opposite
    // sign from what's used here. That regime only sets in around Jupiter-to-brown-
    // dwarf masses; at 10–30 M_E the interior is merely partially compressed, so radius
    // still grows with mass, just more slowly (~0.20) than a classical, less-compressed
    // rocky/icy body (~0.27-0.30).
    // Scale 2.2441 fitted by least squares to anchor points:
    //   [10, 3.50], Uranus (14.54, 4.007), Neptune (17.15, 3.883), [20, 4.05],
    //   [25, 4.25], [30, 4.45]  — theoretical values from Lopez & Fortney 2014.
    // Uranus/Neptune reproduced to within ~4% — unavoidable since they are
    // non-monotonic (Neptune denser despite higher mass), likely due to differing
    // rock/ice ratios rather than a smooth mass-radius trend.
    // Valid range: 10–30 M_E. Below 10 M_E use Mini-Neptune; above 30 M_E use Gas giant.
    scale: 2.2441,
    exponent: 0.2,
  },
  gasGiant: {
    label: "Gas giant (Saturn/Jupiter-like)",
    scale: 10.9733,
  },
  hotJupiter: {
    // No simple scale/exponent — handled by dedicated flow (mode 1)
    // and cold-baseline inversion (mode 2).
    label: "Hot Jupiter (irradiation-inflated gas giant)",
  },
  chthonian: {
    // Stripped gas/ice giant cores are predominantly iron+silicate and therefore
    // DENSER than rocky planets of the same mass, not less dense.
    // Calibrated intermediate between iron (scale 0.80) and rocky (scale 1.00):
    //   At  5 M_Earth: R ≈ 1.43 R_E, ρ ≈  9.4 g/cm³
    //   At 15 M_Earth: R ≈ 1.97 R_E, ρ ≈ 10.7 g/cm³
    //   At 50 M_Earth: R ≈ 2.73 R_E, ρ ≈ 13.5 g/cm³
    // Reference: CoRoT-7b (~7 M_E, ~1.58 R_E, ρ ~8.5 g/cm³)
    label: "Chthonian planet (stripped gas/ice giant core)",
    scale: 0.95,
    exponent: 0.27,
  },
  youngGiant: {
    // Two-segment power-law contraction calibrated against Baraffe et al. (2003)
    // non-irradiated cooling tracks. Typical error vs. tabulated values: ~3-5%.
    //
    // R(M,t) uses three anchor radii per mass (all in R_Jupiter):
    //   R0: t=0.001 Gyr (1 Myr, rapid contraction phase)
    //   R1: t=0.100 Gyr (transition to slow cooling)
    //   R2: t=5.0   Gyr (cold equilibrium floor)
    //
    // Baraffe 2003 anchor points:
    //   1 MJ:  1.30 → 1.12 → 1.00  (at 1, 100, 5000 Myr)
    //   13 MJ: 1.70 → 1.38 → 1.20
    //
    // Sub-Jupiter (<1 MJ): linear blend, 0.1→1.0 MJ.
    // Saturn (0.299 MJ, 0.843 RJ at 4.6 Gyr) reproduced to ~7% — linear blend limitation.
    label:
      "Young gas giant (Kelvin-Helmholtz contraction, 0.1–13 M_Jupiter, age in Gyr)",
  },
  rockyAsteroid: {
    // Constant bulk density model: R = (3M / 4πρ)^(1/3) = scale * M^(1/3)
    // scale = (3*ME / (4π * ρ_kg/m³))^(1/3) / RE
    //
    // Target density: 2.0 g/cm³ — a broad average for rocky/stony small bodies,
    // between porous rubble piles (~1.2–1.9, e.g. Bennu 1.26, Ryugu 1.19)
    // and consolidated/differentiated bodies (Eros 2.67, Vesta 3.46).
    // Constant density is appropriate because gravity compression is negligible
    // at small-body scales. Real densities vary enormously (0.5–3.5 g/cm³) —
    // treat outputs as order-of-magnitude estimates.
    //
    // Calibration anchors (real measured values):
    //   Itokawa: 3.51e10 kg → ~0.16 km  (model: 0.16 km, err ~1%)
    //   Eros:    6.69e15 kg → ~8.4  km  (model: 9.3  km, err ~10%)
    //   Ceres:   9.39e20 kg → ~470  km  (model: 482  km, err ~3%)
    // Valid range: ~1e9 kg to ~0.001 M_Earth (roughly pebble to dwarf-planet scale).
    label: "Rocky asteroid/comet (silicate/metallic, ~2.0 g/cm³)",
    scale: 1.402145,   // (3*ME/(4π*2000 kg/m³))^(1/3) / RE
    exponent: 1 / 3,
    densityGcm3: 2.0,
  },
  icyAsteroid: {
    // Constant bulk density model: same form as rockyAsteroid.
    // Target density: 0.55 g/cm³ — calibrated to 67P/Churyumov-Gerasimenko
    // (measured 0.533 g/cm³, Pätzold et al. 2016) and consistent with
    // Tempel 1 (~0.62) and Halley (~0.60). Highly porous (72–74% void space).
    //
    // Calibration anchors:
    //   67P:    9.98e12 kg → ~2.0 km  (model: 1.6 km, err ~-18%)
    //   Halley: 2.2e14  kg → ~5.5 km  (model: 4.6 km, err ~-17%)
    //   Chiron: 1.9e18  kg → ~90  km  (model: 94  km, err ~4%)
    // Larger errors at small sizes reflect real variability in cometary porosity.
    // Valid range: ~1e9 kg to ~0.001 M_Earth.
    label: "Icy asteroid/comet (cometary nucleus, ~0.55 g/cm³)",
    scale: 2.156165,   // (3*ME/(4π*550 kg/m³))^(1/3) / RE
    exponent: 1 / 3,
    densityGcm3: 0.55,
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
  "rockyAsteroid",
  "icyAsteroid",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ---------------------------------------------------------------------------
// HOT JUPITER INFLATION HELPERS
// Based on Thorngren & Fortney (2018) and Sestovic et al. (2018)
// ---------------------------------------------------------------------------

function calcFluxFromL(L_solar, a_AU) {
  return (L_solar * L_SUN) / (4 * Math.PI * Math.pow(a_AU * AU_M, 2));
}

function calcFluxFromTR(T_eff_K, R_star_Rsun, a_AU) {
  return (
    SIGMA *
    Math.pow(T_eff_K, 4) *
    Math.pow((R_star_Rsun * R_SUN) / (a_AU * AU_M), 2)
  );
}

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

// T_eq = (L*(1-A) / (16π σ a²))^0.25
function calcTeq(L_solar, a_AU, albedo) {
  const L = L_solar * L_SUN;
  const a = a_AU * AU_M;
  return Math.pow((L * (1 - albedo)) / (16 * Math.PI * SIGMA * a * a), 0.25);
}

// Heating efficiency ε(Teq) — Gaussian peaked at 1500 K, with smooth logistic onset at 1000 K.
// Calibrated to Thorngren & Fortney (2018): peak ε ≈ 2.5% at Teq ≈ 1500 K.
// Hard floor at 800 K: Ohmic dissipation is negligible this cool.
function heatingEfficiency(Teq) {
  if (Teq < 800) return 0;
  const peak = 1500; // K — Gaussian centre
  const sigmaG = 800; // K — Gaussian width
  // Logistic onset centred at 1000 K (half-width ~120 K):
  //   avoids the hard step discontinuity while keeping inflation near-zero below 1000 K
  const onset = 1 / (1 + Math.exp(-(Teq - 1000) / 120));
  return (
    0.025 * onset * Math.exp(-Math.pow(Teq - peak, 2) / (2 * sigmaG * sigmaG))
  );
}

// Mass-suppression factor — heavier planets inflate less (Sestovic et al. 2018)
// Smooth logistic ramp from 0.5 (sub-Saturn, partial inflation) to 1.0 (sweet-spot,
// full inflation) centred at 0.37 Mj — replaces a former hard step at that mass,
// which was inconsistent with the smoothed onset used in heatingEfficiency() below.
function massSuppression(massEarth) {
  const mj = massEarth / M_JUP;
  if (mj > 0.98) return Math.max(0.1, 1.0 - 0.25 * Math.log10(mj)); // gradual suppression above ~1 Mj
  const onset = 1 / (1 + Math.exp(-(mj - 0.37) / 0.08));
  return 0.5 + 0.5 * onset;
}

// Uninflated (cold) gas giant radius — two-segment power law
function coldGasGiantRadius(massEarth) {
  if (massEarth <= M_JUP) {
    return R_JUP_RE * Math.pow(massEarth / M_JUP, 0.1516);
  }
  return R_JUP_RE * Math.pow(massEarth / M_JUP, -0.0347);
}

// ---------------------------------------------------------------------------
// FORWARD: mass (M_Earth) → radius (R_Earth)
// Returns null for out-of-range inputs.
// ---------------------------------------------------------------------------
function massToRadius(key, mass) {
  const comp = COMPOSITIONS[key];
  let r;

  switch (key) {
    case "predIcy":
      r =
        mass <= 0.002
          ? comp.scale * Math.pow(mass, comp.exponent)
          : comp.scaleExt * Math.pow(mass, comp.exponentExt);
      break;

    case "rockyIcy":
      // Hard bounds: calibrated range is approximately 0.002–0.020 M_Earth.
      // Below 0.002 M_E density collapses unphysically (<1 g/cm³ at 0.0001 M_E).
      if (mass > 0.02) return null;
      if (mass < 0.002) return null;
      r = comp.scale * Math.pow(mass, comp.exponent);
      break;

    case "miniNeptune":
      r = comp.scale * Math.pow(mass / 5.0, comp.exponent);
      r = Math.max(1.7, Math.min(4.5, r));
      break;

    case "iceGiant":
      // Hard bounds: model only valid 10–30 M_Earth (Lopez & Fortney 2014 ice giant grid).
      // Below 10 M_E densities become unrealistically low; above 30 M_E use Gas giant.
      if (mass < 10 || mass > 30) return null;
      r = comp.scale * Math.pow(mass, comp.exponent);
      break;

    case "gasGiant":
      if (mass <= M_JUP) {
        // Sub-Jupiter: exponent solved from Saturn + Jupiter volumetric mean radii
        r = comp.scale * Math.pow(mass / M_JUP, 0.1516);
      } else {
        // Super-Jupiter: gravity wins, radius shrinks slightly.
        // Exponent from Jupiter (1 MJ, 10.973 R_E) and HAT-P-2b (8.45 MJ, ~10.19 R_E)
        r = comp.scale * Math.pow(mass / M_JUP, -0.0347);
      }
      r = Math.max(7.5, Math.min(13.0, r));
      break;

    case "rockyAsteroid":
    case "icyAsteroid":
      // Constant-density sphere: R = scale * M^(1/3). No gravity compression.
      r = comp.scale * Math.pow(mass, comp.exponent);
      break;

    default:
      r = comp.scale * Math.pow(mass, comp.exponent);
  }

  return r;
}

// ---------------------------------------------------------------------------
// INVERSE: radius (R_Earth) → mass (M_Earth)
// ---------------------------------------------------------------------------
function radiusToMass(key, radiusEarth) {
  const comp = COMPOSITIONS[key];
  let mass;
  let warning = null;

  switch (key) {
    case "miniNeptune": {
      if (radiusEarth < 1.7 || radiusEarth > 4.5) {
        warning = `Warning: ${radiusEarth} R_Earth is outside the Mini-Neptune range (1.7–4.5 R_Earth). Result is an extrapolation.`;
      }
      mass = 5.0 * Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      break;
    }

    case "iceGiant": {
      // Invert R = scale * M^exp  →  M = (R / scale)^(1/exp)
      mass = Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      if (mass < 10 || mass > 30) {
        warning =
          `Warning: computed mass ${formatMass(mass)} M_Earth is outside the valid range (10–30 M_Earth). ` +
          (mass < 10
            ? `Consider Mini-Neptune instead for this radius.`
            : `Consider Gas giant instead for this radius.`);
      }
      break;
    }

    case "gasGiant": {
      if (radiusEarth < 7.5 || radiusEarth > 13.0) {
        warning = `Warning: ${radiusEarth} R_Earth is outside the Gas giant range (7.5–13.0 R_Earth). Result is an extrapolation.`;
      }
      // Uses sub-Jupiter branch only. Note: gas giant R-M is non-monotonic near 1 MJ —
      // the same radius can correspond to a sub-Jupiter OR a super-Jupiter mass.
      // This formula returns the sub-Jupiter (lower-mass) solution.
      // If the planet is suspected to be >1 MJ, treat result as a lower-mass bound.
      mass = M_JUP * Math.pow(radiusEarth / comp.scale, 1 / 0.1516);
      if (radiusEarth < R_JUP_RE && radiusEarth >= 7.5) {
        warning =
          (warning ? warning + "\n" : "") +
          `Note: at ${radiusEarth} R_Earth a second (super-Jupiter) solution also exists. ` +
          `This result gives the sub-Jupiter mass; if the planet is massive, the true mass is higher.`;
      }
      break;
    }

    case "rockyIcy": {
      // Calibrated range: ~0.002–0.020 M_Earth (Triton/Europa scale)
      const rLower = comp.scale * Math.pow(0.002, comp.exponent); // ~0.1907 R_Earth
      const rUpper = comp.scale * Math.pow(0.02, comp.exponent); // ~0.2888 R_Earth
      mass = Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      if (radiusEarth < rLower) {
        warning =
          `Warning: ${radiusEarth.toFixed(5)} R_Earth is below the calibrated range ` +
          `(${rLower.toFixed(4)}–${rUpper.toFixed(4)} R_Earth). Model is not valid below Triton/Europa scale. ` +
          `Consider predIcy or icyBody for small icy bodies.`;
      } else if (radiusEarth > rUpper) {
        warning =
          `Warning: ${radiusEarth.toFixed(5)} R_Earth is above the calibrated range ` +
          `(${rLower.toFixed(4)}–${rUpper.toFixed(4)} R_Earth). Consider Water/ocean or Icy body instead.`;
      }
      break;
    }

    case "predIcy": {
      // rBoundary is the EXTENDED segment's radius at the 0.002 M_Earth crossover.
      // R ≤ rBoundary → small segment (masses up to ~0.002 M_Earth)
      // R > rBoundary → extended segment (masses above 0.002 M_Earth)
      // There is a ~202 km model gap between the two segments at the boundary mass.
      const rBoundSmall = comp.scale * Math.pow(0.002, comp.exponent); // ~0.1869
      const rBoundLarge = comp.scaleExt * Math.pow(0.002, comp.exponentExt); // ~0.2185
      if (radiusEarth <= rBoundLarge) {
        mass = Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
        if (radiusEarth > rBoundSmall) {
          warning =
            `Note: ${radiusEarth.toFixed(5)} R_Earth falls in the predIcy model transition gap ` +
            `(${rBoundSmall.toFixed(4)}–${rBoundLarge.toFixed(4)} R_Earth). ` +
            `Mass estimate is approximate — the two sub-models don't connect smoothly here.`;
        }
      } else {
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
// Density: ρ = ρ_Earth × (M/M_Earth) / (R/R_Earth)³
// Reference: Earth at (1 M_E, 1 R_E) = 5.5136 g/cm³ using volumetric mean radius 6371 km.
// ---------------------------------------------------------------------------
function calcDensity(massEarth, radiusEarth) {
  return EARTH_DENSITY * (massEarth / Math.pow(radiusEarth, 3));
}

// ---------------------------------------------------------------------------
// Young gas giant internal luminosity — calibrated to Baraffe et al. (2003)
// ---------------------------------------------------------------------------
function internalLuminosity(massJupiter, ageGyr) {
  const M = massJupiter;
  const t = Math.max(ageGyr, 0.001);
  const lnScale = Math.log(Math.max(M, 0.1)) / Math.log(13);
  const A = -5.8063 + 1.1865 * lnScale;
  const B = -0.6455 + 0.1817 * lnScale;
  return Math.pow(10, A + B * Math.log10(t)); // L_Sun
}

// SE EndogenousHeating: T = (L / (4π R² σ))^(1/4)
function endogenousTemp(L_Lsun, radiusEarth) {
  const L_W = L_Lsun * L_SUN;
  const R_m = radiusEarth * EARTH_RADIUS_KM * 1e3;
  return Math.pow(L_W / (4 * Math.PI * R_m * R_m * SIGMA), 0.25);
}

// ---------------------------------------------------------------------------
// Young gas giant radius (Kelvin-Helmholtz contraction)
// ---------------------------------------------------------------------------
function youngGiantRadius(massJupiter, ageGyr) {
  const M = massJupiter;
  const t = Math.max(ageGyr, 0.001);

  let R0, R1, R2;
  if (M >= 1.0) {
    const lnScale = Math.log(Math.min(M, 13)) / Math.log(13);
    R0 = 1.3 + 0.4 * lnScale; // 1.30 at 1 MJ → 1.70 at 13 MJ
    R1 = 1.12 + 0.26 * lnScale; // 1.12 at 1 MJ → 1.38 at 13 MJ
    R2 = 1.0 + 0.2 * lnScale; // 1.00 at 1 MJ → 1.20 at 13 MJ
  } else {
    const f = Math.max(M - 0.1, 0) / 0.9;
    R0 = 1.0 + 0.3 * f;
    R1 = 0.82 + 0.3 * f;
    R2 = 0.72 + 0.28 * f;
  }

  const a1 = Math.log(R0 / R1) / Math.log(100);
  const a2 = Math.log(R1 / R2) / Math.log(50);

  let R =
    t <= 0.1 ? R0 * Math.pow(t / 0.001, -a1) : R1 * Math.pow(t / 0.1, -a2);

  R = Math.max(R, R2); // floor at equilibrium
  return R * R_JUP_RE; // R_Jupiter → R_Earth
}

// ---------------------------------------------------------------------------
// Smart mass formatter (handles values from ~10⁻⁸ to 10⁴ M_Earth)
// ---------------------------------------------------------------------------
function formatMass(mass) {
  if (mass === 0) return "0";
  if (mass < 5e-7) return mass.toExponential(4);
  const decimals = Math.max(6, Math.ceil(-Math.log10(mass)) + 4);
  return mass.toFixed(decimals);
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function printMenu() {
  console.log("\nChoose planet/moon type:");
  console.log("1)  Iron           (Mercury-like, large iron core)");
  console.log("2)  Rocky          (Earth-like, silicate mantle)");
  console.log("3)  Water/ocean    (ice-rich, volatile-heavy)");
  console.log("4)  Icy body       (Titan/Ganymede-like, ice-dominated)");
  console.log(
    "5)  Predominantly icy  (Tethys/Dione/Rhea, extended to super-Earths)",
  );
  console.log("6)  Rocky-icy      (Europa/Triton-like, rock core + ice shell)");
  console.log("7)  Carbonia       (carbon-rich, SiC/diamond interior)");
  console.log("8)  Mini-Neptune   (volatile H/He envelope, sub-Neptune)");
  console.log("9)  Ice giant      (Uranus/Neptune-like)");
  console.log("10) Gas giant      (Saturn/Jupiter-like)");
  console.log("11) Hot Jupiter    (irradiation-inflated, close-orbiting)");
  console.log("12) Chthonian      (exposed core of stripped gas/ice giant)");
  console.log(
    "13) Young giant    (Kelvin-Helmholtz contraction, 0.1–13 MJ, needs age)",
  );
  console.log("14) Rocky asteroid (silicate/metallic body, ~2.0 g/cm³)");
  console.log("15) Icy asteroid   (cometary nucleus, ~0.55 g/cm³)");
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
// Chthonian input flow
// ---------------------------------------------------------------------------
function askChthonianInputs() {
  console.log(
    "\nChthonian planets are exposed cores of stripped gas/ice giants.",
  );
  console.log("Expected mass range: ~5–150 M_Earth.");
  console.log(
    "Density typically 9–14 g/cm³ (iron-rich core, denser than rocky planets).",
  );

  rl.question("Enter planet mass (in Earth masses): ", (massInput) => {
    const mass = parseFloat(massInput);
    if (isNaN(mass) || mass <= 0) {
      console.log("Invalid mass.");
      return askRepeat();
    }
    if (mass < 5 || mass > 150) {
      console.log(
        "\nNote: " +
          mass +
          " M_Earth is outside the typical chthonian range (5–150 M_Earth).",
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
  console.log("Mean density:     " + dens.toFixed(3) + " g/cm³");
  console.log(
    "Note: density typically 9–14 g/cm³ for this mass range —" +
      " iron-rich core, denser than rocky due to original compression inside the parent giant.",
  );
  if (stellar) {
    console.log("\nStellar irradiation context:");
    console.log(
      "  Incident flux:    " +
        (stellar.flux / 1e6).toPrecision(4) +
        " MW/m²  (" +
        (stellar.flux / S_EARTH).toFixed(1) +
        " S_Earth)",
    );
    console.log("  Equilibrium temp: " + stellar.Teq.toFixed(0) + " K");
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
// Hot Jupiter forward input flow
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
        `\n⚠️  ${massJup.toFixed(4)} M_Jupiter is outside the hot Jupiter range (0.1–13 MJ).`,
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
                "Enter Bond albedo (0.0–1.0, Enter for default 0.10): ",
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
  const Teq = calcTeq(L_solar, a_AU, A);
  const epsilon = heatingEfficiency(Teq);
  const mf = massSuppression(mass);
  const rBase = coldGasGiantRadius(mass);
  const inflationFraction = epsilon * mf * 18;
  const rInflatedRaw = rBase * (1 + inflationFraction);
  const rFinal = Math.min(rInflatedRaw, MAX_R_EARTH);
  const radiusKm = rFinal * EARTH_RADIUS_KM;
  const density = calcDensity(mass, rFinal);
  const inflPct = inflationFraction * 100;
  const incidentFlux = calcFluxFromL(L_solar, a_AU);

  console.log(
    `\nType:             Hot Jupiter (irradiation-inflated gas giant)`,
  );
  console.log(`Stellar luminosity: ${L_solar} L_Sun`);
  console.log(`Orbital distance:   ${a_AU} AU`);
  console.log(`Bond albedo:        ${A.toFixed(2)}`);
  console.log(`Equilibrium temp:   ${Teq.toFixed(0)} K`);
  console.log(
    `Incident flux:      ${(incidentFlux / 1e6).toPrecision(4)} MW/m²` +
      `  (${(incidentFlux / S_EARTH).toFixed(1)} S_Earth)`,
  );

  if (Teq < 1000) {
    console.log(
      `\n⚠️  Teq = ${Teq.toFixed(0)} K is below the significant inflation threshold (~1000 K).`,
    );
    console.log(`   Radius inflation is minimal at this temperature.`);
    console.log(
      `   Consider using the Gas giant type for a non-inflated model.`,
    );
  } else {
    console.log(
      `Inflation applied:  ${inflPct.toFixed(1)}% radius increase over cold baseline`,
    );
  }

  if (rInflatedRaw > MAX_R_EARTH) {
    console.log(
      `\nNote: raw inflation gave ${rInflatedRaw * EARTH_RADIUS_KM} km` +
        ` — capped at 2.0 RJ physical limit.`,
    );
  }

  console.log(
    `\nCold baseline:    ${rBase * EARTH_RADIUS_KM} km` +
      `  /  ${rBase} R_Earth`,
  );
  console.log(`Inflated radius:  ${radiusKm} km`);
  console.log(`In Earth radii:   ${rFinal} R_Earth`);
  console.log(`In Jupiter radii: ${rFinal / R_JUP_RE} R_Jupiter`);
  console.log(`Mean density:     ${density.toFixed(3)} g/cm³`);

  askRepeat();
}

// ---------------------------------------------------------------------------
// Hot Jupiter inverse (mode 2) — cold baseline inversion with caveats
// ---------------------------------------------------------------------------
function askHotJupiterInverse() {
  console.log("\n⚠️  Hot Jupiter radius → mass inversion note:");
  console.log(
    "   Irradiation inflation cannot be removed without stellar parameters,",
  );
  console.log(
    "   so the same radius can map to different masses depending on the star.",
  );
  console.log(
    "   Using the cold (uninflated) gas giant baseline — this gives an",
  );
  console.log(
    "   upper bound on mass; the true mass may be lower if the planet is inflated.",
  );

  rl.question(
    "\nEnter planet radius — in km or R_Earth?\n  1) km\n  2) R_Earth\nEnter unit: ",
    (unitInput) => {
      const unit = unitInput.trim();
      if (unit !== "1" && unit !== "2") {
        console.log("Invalid unit.");
        return askRepeat();
      }

      const unitLabel = unit === "1" ? "km" : "R_Earth";
      rl.question(`Enter planet radius (in ${unitLabel}): `, (input) => {
        const rawRadius = parseFloat(input);
        if (isNaN(rawRadius) || rawRadius <= 0) {
          console.log("Invalid radius.");
          return askRepeat();
        }

        const radiusEarth =
          unit === "1" ? rawRadius / EARTH_RADIUS_KM : rawRadius;
        const radiusJup = radiusEarth / R_JUP_RE;

        if (radiusEarth < 7.5 || radiusEarth > MAX_R_EARTH) {
          console.log(
            `\n⚠️  ${radiusJup} RJ (${radiusEarth} R_E) is outside` +
              ` the hot Jupiter range (7.5–${MAX_R_EARTH} R_Earth).`,
          );
        }

        // Invert using sub-Jupiter cold baseline: R = R_JUP_RE * (M/M_JUP)^0.1516
        const mass = M_JUP * Math.pow(radiusEarth / R_JUP_RE, 1 / 0.1516);
        const density = calcDensity(mass, radiusEarth);

        console.log(
          `\nType:              Hot Jupiter (cold baseline inversion)`,
        );
        console.log(
          `Input radius:      ${radiusEarth * EARTH_RADIUS_KM} km` +
            `  /  ${radiusEarth} R_Earth  /  ${radiusJup} R_Jupiter`,
        );
        console.log(
          `Est. mass (cold):  ${mass} M_Earth  (${mass / M_JUP} M_Jupiter)`,
        );
        console.log(`Mean density:      ${density.toFixed(3)} g/cm³`);
        console.log(
          `\nNote: true mass is likely lower — inflation increases radius without changing mass.` +
            `\n      Use forward mode (mode 1) with stellar parameters for a self-consistent model.`,
        );

        askRepeat();
      });
    },
  );
}

// ---------------------------------------------------------------------------
// Young gas giant input flow
// ---------------------------------------------------------------------------
function askYoungGiantInputs(mode) {
  if (mode === "1") {
    // Forward: mass + age → radius
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

        rl.question(
          "\nStellar input (for Teq/flux) — Enter to skip, or choose:\n" +
            "  1) Luminosity (L_Sun) + distance (AU)\n" +
            "  2) T_eff (K) + radius (R_Sun) + distance (AU)\n" +
            "Enter mode or press Enter to skip: ",
          (stellarMode) => {
            function computeAndPrint(L_solar, a_AU) {
              const radiusEarth = youngGiantRadius(massJup, age);
              const radiusKm = radiusEarth * EARTH_RADIUS_KM;
              const radiusJup = radiusEarth / R_JUP_RE;
              const massEarth = massJup * M_JUP;
              const density = calcDensity(massEarth, radiusEarth);
              const L_int_Lsun = internalLuminosity(massJup, age);
              const L_int_W = L_int_Lsun * L_SUN;
              const R_m = radiusEarth * EARTH_RADIUS_KM * 1e3;
              const L_int_surf = L_int_W / (4 * Math.PI * R_m * R_m);

              console.log(`\nType:             Young gas giant`);
              console.log(
                `Mass:             ${massJup} M_Jupiter  (${massEarth} M_Earth)`,
              );
              console.log(`Age:              ${age} Gyr`);
              console.log(`Estimated radius: ${radiusKm} km`);
              console.log(`In Jupiter radii: ${radiusJup} R_Jupiter`);
              console.log(`In Earth radii:   ${radiusEarth} R_Earth`);
              console.log(`Mean density:     ${density.toFixed(3)} g/cm³`);

              const T_endo = endogenousTemp(L_int_Lsun, radiusEarth);
              console.log(
                `\nEndogenousHeating: ${T_endo.toFixed(0)} K  (for SE .sc file)`,
              );
              console.log(`  Internal luminosity: ${L_int_Lsun} L_Sun`);
              console.log(
                `  Internal flux:       ${L_int_surf} W/m² at surface`,
              );

              if (L_solar !== null && a_AU !== null) {
                const flux = calcFluxFromL(L_solar, a_AU);
                const Teq = calcTeq(L_solar, a_AU, 0.1);
                const ratio = L_int_surf / (flux / 4);
                console.log(`\nStellar irradiation:`);
                console.log(
                  `  Incident flux:      ${(flux / 1e6).toPrecision(4)} MW/m²` +
                    `  (${(flux / S_EARTH).toFixed(1)} S_Earth)`,
                );
                console.log(`  Equilibrium temp:   ${Teq.toFixed(0)} K`);
                console.log(
                  `  Endogenous/stellar: ${ratio.toExponential(2)}  (internal vs absorbed flux ratio)`,
                );
                if (ratio > 0.1) {
                  console.log(
                    `  Note: endogenous heating is significant relative to stellar input.`,
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
                      computeAndPrint(calcLFromTR(T_eff, R_star), a_AU);
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
    // Inverse: radius + age → mass (bisection search)
    // youngGiantRadius is monotonically INCREASING with mass at fixed age,
    // so bisection: rMid < target → lo = mid (need larger mass), and vice-versa.
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

              // Check model bounds before bisecting
              const rMin = youngGiantRadius(0.1, age);
              const rMax = youngGiantRadius(13.0, age);
              if (radiusEarth < rMin || radiusEarth > rMax) {
                console.log(
                  `\n⚠️  Radius ${radiusEarth / R_JUP_RE} R_Jupiter is outside the` +
                    ` model range at ${age} Gyr`,
                );
                console.log(
                  `   (valid: ${rMin / R_JUP_RE}–${rMax / R_JUP_RE}` +
                    ` R_Jupiter for 0.1–13 M_Jupiter).`,
                );
              }

              // Bisection: R increases with M → rMid < target ⟹ lo = mid
              let lo = 0.1,
                hi = 13.0,
                mid = 0,
                rMid = 0;
              for (let i = 0; i < 60; i++) {
                mid = (lo + hi) / 2;
                rMid = youngGiantRadius(mid, age);
                if (rMid < radiusEarth) {
                  lo = mid; // need larger mass
                } else {
                  hi = mid; // need smaller mass
                }
              }

              const massJup = mid;
              const massEarth = massJup * M_JUP;
              const radiusKm = radiusEarth * EARTH_RADIUS_KM;
              const radiusJup = radiusEarth / R_JUP_RE;
              const density = calcDensity(massEarth, radiusEarth);

              console.log(`\nType:             Young gas giant`);
              console.log(`Age:              ${age} Gyr`);
              console.log(
                `Input radius:     ${radiusKm} km` +
                  `  /  ${radiusJup} R_Jupiter` +
                  `  /  ${radiusEarth} R_Earth`,
              );
              console.log(
                `Estimated mass:   ${massJup} M_Jupiter` +
                  `  (${massEarth} M_Earth)`,
              );
              console.log(`Mean density:     ${density.toFixed(3)} g/cm³`);

              askRepeat();
            });
          },
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Asteroid / comet input flow
// Accepts mass in kg or M_Earth; radius in km or R_Earth.
// ---------------------------------------------------------------------------
const KG_PER_EARTH_MASS = 5.972e24;

function askAsteroidInputs(key, mode) {
  const comp = COMPOSITIONS[key];

  if (mode === "1") {
    rl.question(
      "\nMass unit:\n  1) Kilograms (kg)\n  2) Earth masses (M_Earth)\nEnter unit: ",
      (unitInput) => {
        const unit = unitInput.trim();
        if (unit !== "1" && unit !== "2") { console.log("Invalid unit."); return askRepeat(); }

        const unitLabel = unit === "1" ? "kg" : "M_Earth";
        rl.question(`Enter mass (in ${unitLabel}): `, (massInput) => {
          const rawMass = parseFloat(massInput);
          if (isNaN(rawMass) || rawMass <= 0) { console.log("Invalid mass."); return askRepeat(); }

          const massEarth = unit === "1" ? rawMass / KG_PER_EARTH_MASS : rawMass;
          const massKg    = massEarth * KG_PER_EARTH_MASS;

          if (massEarth > 0.001) {
            console.log(
              `\n⚠️  ${massEarth.toExponential(3)} M_Earth exceeds the small-body range (~0.001 M_Earth).` +
              `\n   At this scale gravity compression matters — consider Icy body or Water/ocean world instead.`
            );
          }

          const radiusEarth = comp.scale * Math.pow(massEarth, comp.exponent);
          const radiusKm    = radiusEarth * EARTH_RADIUS_KM;
          const density     = calcDensity(massEarth, radiusEarth);

          console.log(`\nType:             ${comp.label}`);
          console.log(`Mass:             ${massKg.toExponential(4)} kg  (${massEarth.toExponential(4)} M_Earth)`);
          console.log(`Estimated radius: ${radiusKm} km`);
          console.log(`In Earth radii:   ${radiusEarth} R_Earth`);
          console.log(`Mean density:     ${density} g/cm³`);
          console.log(
            `\nNote: assumes uniform bulk density of ${comp.densityGcm3} g/cm³.` +
            ` Real small bodies vary widely (rocky: 0.5–3.5, icy: 0.3–1.0 g/cm³).`
          );
          askRepeat();
        });
      }
    );
  } else {
    rl.question(
      "\nRadius unit:\n  1) Kilometres (km)\n  2) Earth radii (R_Earth)\nEnter unit: ",
      (unitInput) => {
        const unit = unitInput.trim();
        if (unit !== "1" && unit !== "2") { console.log("Invalid unit."); return askRepeat(); }

        const unitLabel = unit === "1" ? "km" : "R_Earth";
        rl.question(`Enter radius (in ${unitLabel}): `, (rInput) => {
          const rawRadius = parseFloat(rInput);
          if (isNaN(rawRadius) || rawRadius <= 0) { console.log("Invalid radius."); return askRepeat(); }

          const radiusEarth = unit === "1" ? rawRadius / EARTH_RADIUS_KM : rawRadius;
          const radiusKm    = radiusEarth * EARTH_RADIUS_KM;
          const massEarth   = Math.pow(radiusEarth / comp.scale, 3);
          const massKg      = massEarth * KG_PER_EARTH_MASS;
          const density     = calcDensity(massEarth, radiusEarth);

          if (massEarth > 0.001) {
            console.log(
              `\n⚠️  Result exceeds the small-body range (~0.001 M_Earth).` +
              `\n   At this scale gravity compression matters — consider Icy body or Water/ocean world instead.`
            );
          }

          console.log(`\nType:             ${comp.label}`);
          console.log(`Input radius:     ${radiusKm} km  (${radiusEarth} R_Earth)`);
          console.log(`Estimated mass:   ${massKg.toExponential(4)} kg  (${massEarth.toExponential(4)} M_Earth)`);
          console.log(`Mean density:     ${density} g/cm³`);
          console.log(
            `\nNote: assumes uniform bulk density of ${comp.densityGcm3} g/cm³.` +
            ` Real small bodies vary widely (rocky: 0.5–3.5, icy: 0.3–1.0 g/cm³).`
          );
          askRepeat();
        });
      }
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

        // Dedicated multi-step flows
        if (key === "hotJupiter" && mode === "1") return askHotJupiterInputs();
        if (key === "hotJupiter" && mode === "2") return askHotJupiterInverse();
        if (key === "chthonian" && mode === "1") return askChthonianInputs();
        if (key === "youngGiant") return askYoungGiantInputs(mode);
        if (key === "rockyAsteroid" || key === "icyAsteroid") return askAsteroidInputs(key, mode);

        if (mode === "1") {
          // --- Forward: mass → radius ---
          rl.question("Enter planet mass (in Earth masses): ", (input) => {
            const mass = parseFloat(input);
            if (isNaN(mass) || mass <= 0) {
              console.log("Invalid mass.");
              return askRepeat();
            }

            const radiusEarth = massToRadius(key, mass);

            if (radiusEarth === null) {
              if (key === "rockyIcy") {
                console.log(
                  `\n⚠️  Mass ${mass} M_Earth is outside the valid range for Rocky-icy`,
                );
                console.log(
                  `   (calibrated range: 0.002–0.020 M_Earth, i.e. Triton to Europa scale).`,
                );
                console.log(
                  `   For larger rock+ice bodies consider Water/ocean or Icy body instead.`,
                );
                console.log(
                  `   For smaller icy moons consider Predominantly icy.`,
                );
              } else if (key === "iceGiant") {
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
                  `\n⚠️  Mass ${mass} M_Earth is out of range for ${comp.label}.`,
                );
              }
              return askRepeat();
            }

            const radiusKm = radiusEarth * EARTH_RADIUS_KM;
            const density = calcDensity(mass, radiusEarth);

            console.log(`\nType:             ${comp.label}`);
            console.log(`Estimated radius: ${radiusKm} km`);
            console.log(`In Earth radii:   ${radiusEarth} R_Earth`);
            console.log(`Mean density:     ${density.toFixed(3)} g/cm³`);

            if (key === "predIcy" && mass > 0.002) {
              console.log(
                `\nNote: extended model active (mass > 0.002 M_Earth). Density ~1.3–2.5 g/cm³,` +
                  `\n      lower than the Water/ocean world model — suitable for high-ice-fraction bodies.`,
              );
            }

            if (key === "gasGiant" && (mass < 50 || mass > 4000)) {
              console.log(
                `\n⚠️  Note: ${mass} M_Earth is well outside the calibrated Gas giant range` +
                  ` (~50–4000 M_Earth, i.e. below Saturn or above ~13 M_Jupiter).` +
                  `\n   The radius has been clamped to ${radiusEarth.toFixed(3)} R_Earth — treat this as a rough bound, not a fit.`,
              );
            }

            if (key === "miniNeptune" && (mass < 2 || mass > 30)) {
              console.log(
                `\n⚠️  Note: ${mass} M_Earth is outside the calibrated Mini-Neptune range` +
                  ` (~2–30 M_Earth, K2-18b to GJ 436b scale).` +
                  `\n   The radius has been clamped to ${radiusEarth.toFixed(3)} R_Earth — result is an extrapolation.`,
              );
            }

            askRepeat();
          });
        } else {
          // --- Inverse: radius → mass ---
          rl.question(
            "Enter planet radius — in km or R_Earth?\n  1) km\n  2) R_Earth\nEnter unit: ",
            (unitInput) => {
              const unit = unitInput.trim();
              if (unit !== "1" && unit !== "2") {
                console.log("Invalid unit.");
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
                    `Input radius:     ${radiusEarth * EARTH_RADIUS_KM} km` +
                      `  /  ${radiusEarth} R_Earth`,
                  );
                  console.log(`Estimated mass:   ${formatMass(mass)} M_Earth`);
                  if (mass >= 1 / M_JUP) {
                    console.log(`                  ${mass / M_JUP} M_Jupiter`);
                  }
                  console.log(`Mean density:     ${density.toFixed(3)} g/cm³`);
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

if (require.main === module) startCalculation();
