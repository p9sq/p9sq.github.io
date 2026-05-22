// starRadius.js
// Stellar parameter calculator covering the full stellar life cycle:
//   Pre-main sequence · Main sequence · Post-main sequence
//   Wolf-Rayet · Stellar remnants · Brown dwarfs
//
// Primary calibrations:
//   MS:       Pecaut & Mamajek (2022) — direct lookup table, O3V–M9V
//   PMS:      Baraffe et al. (2015) BHAC tracks (low mass);
//             Siess et al. (2000) grid (intermediate/high mass, 0.1–7 Myr)
//   Post-MS:  Girardi et al. (2000) / Bressan et al. (2012) PARSEC tracks;
//             empirical data from Luck (2015), Dumm & Schild (1998)
//   WR:       Crowther (2007) ARA&A review; Hamann et al. (2019)
//   WD:       Nauenberg (1972) / Chandrasekhar mass-radius relation;
//             Tremblay et al. (2017) Gaia DR1 empirical verification
//   NS:       Miller et al. (2021) NICER PSR J0740+6620;
//             Riley et al. (2021); typical R ~ 11–13 km
//   BH:       Schwarzschild radius: R = 2GM/c²
//   BD:       Baraffe et al. (2003) COND cooling tracks;
//             Kirkpatrick (2005), Cushing (2014) spectral classification

"use strict";
const readline = require("readline");

// ============================================================
// PHYSICAL CONSTANTS  (IAU 2015 nominal solar values)
// ============================================================
const R_SUN_KM = 695700; // km
const R_SUN_M = 6.957e8; // m
const M_SUN_KG = 1.9885e30; // kg
const L_SUN = 3.828e26; // W
const SIGMA = 5.6704e-8; // W m⁻² K⁻⁴  Stefan-Boltzmann
const G = 6.674e-11; // m³ kg⁻¹ s⁻²
const C = 2.998e8; // m/s
const M_JUP_IN_MSUN = 9.543e-4; // 1 M_Jupiter / M_Sun

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ============================================================
// NUMBER FORMATTERS
// ============================================================

// Full precision — no rounding. Exponential only for very large/small.
function fmt(x) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a < 1e-6 || a >= 1e15) return x.toExponential();
  return String(x);
}

// MS lifetime: Gyr normally, Tyr (tera-years) when ≥ 1000 Gyr
function fmtLifetime(gyr) {
  return gyr >= 1000 ? `${fmt(gyr / 1000)} Tyr` : `${fmt(gyr)} Gyr`;
}

// Fixed decimal places
function fmtPct(x) {
  return x.toFixed(2);
}
function fmtTeff(x) {
  return Math.round(x).toString();
}

// ============================================================
// SHARED PHYSICS UTILITIES
// ============================================================

// Luminosity + Radius → T_eff via Stefan-Boltzmann
function calcTeff(luminositySun, radiusSun) {
  const L = luminositySun * L_SUN;
  const R = radiusSun * R_SUN_M;
  return Math.pow(L / (4 * Math.PI * R * R * SIGMA), 0.25);
}

// Mass (M_Sun) + Radius (R_Sun) → mean density (g/cm³)
function calcDensity(massSun, radiusSun) {
  const massG = massSun * M_SUN_KG * 1e3;
  const radiusCm = radiusSun * R_SUN_KM * 1e5;
  return massG / ((4 / 3) * Math.PI * Math.pow(radiusCm, 3));
}

// Absolute bolometric magnitude from L (L_Sun)
function calcMbol(luminositySun) {
  return 4.74 - 2.5 * Math.log10(luminositySun);
}

// Bolometric correction BC_V from Torres (2010) corrected Flower (1996) polynomials.
// BC_V is defined so that M_bol = M_V + BC_V, with BC_V,Sun = −0.072 (Torres 2010).
// L_V / L_Sun = L_bol / L_Sun × 10^(BC_V / 2.5) / 10^(BC_V_Sun / 2.5)
// i.e. L_V = L_bol × 10^((BC_V − BC_V_Sun) / 2.5)
// Valid range: Teff ≈ 2900–52000 K. Outside this range we flag the estimate.
// Coefficients from Torres (2010) Table 2, Flower (1996) piecewise polynomial.
const BC_V_SUN = -0.072; // Torres (2010) solar BC_V

function calcBCV(teff) {
  const lt = Math.log10(teff);
  let a, b, c, d, e, f;
  if (lt < 3.7) {
    // log Teff < 3.70  (T < ~5012 K)
    a = -0.190537291496456e5;
    b = 0.155144866764412e5;
    c = -0.421278819301717e4;
    d = 0.381476328422343e3;
    return a + b * lt + c * lt * lt + d * lt * lt * lt;
  } else if (lt <= 3.9) {
    // 3.70 ≤ log Teff ≤ 3.90  (~5012–7943 K)
    a = -0.370510203809015e5;
    b = 0.385672629965804e5;
    c = -0.150651486316025e5;
    d = 0.261724637119416e4;
    e = -0.170623810323864e3;
    return a + b * lt + c * lt * lt + d * lt * lt * lt + e * lt * lt * lt * lt;
  } else {
    // log Teff > 3.90  (T > ~7943 K)
    a = -0.118115450538963e6;
    b = 0.137145973583929e6;
    c = -0.636233812100225e5;
    d = 0.147412923562646e5;
    e = -0.170587278406872e4;
    f = 0.78873172180499e2;
    return (
      a +
      b * lt +
      c * lt * lt +
      d * lt * lt * lt +
      e * lt * lt * lt * lt +
      f * lt * lt * lt * lt * lt
    );
  }
}

// Luminosity in solar units in the visual band (V)
// L_V = L_bol × 10^((BC_V − BC_V_Sun) / 2.5)
function calcLvisual(luminosityBol, teff) {
  const bcv = calcBCV(teff);
  const deltaBc = bcv - BC_V_SUN;
  return luminosityBol * Math.pow(10, deltaBc / 2.5);
}

// Print the standard luminosity block: bolometric + visual
// teff is used to compute BC_V; pass null to skip visual luminosity
function printLumBlock(luminosity, teff) {
  if (teff !== null && teff !== undefined) {
    const inRange = teff >= 2900 && teff <= 52000;
    const Lv = calcLvisual(luminosity, teff);
    console.log(
      `Lum (L_Sun):              ${fmt(Lv)}${inRange ? "" : "  (est. — Teff outside BC_V valid range)"}`,
    );
  }
  console.log(`LumBol (L_Sun):           ${fmt(luminosity)}`);
  console.log(`Abs. bol. magnitude:      ${fmt(calcMbol(luminosity))}`);
}

// ============================================================
// ============================================================
//  MAIN SEQUENCE
// ============================================================
// ============================================================

// ------------------------------------------------------------
// Pecaut & Mamajek (2022) lookup table — O3V through M9V
// Columns: [SpT_label, Teff(K), logL(L_Sun), R(R_Sun), M(M_Sun)]
// Source: https://www.pas.rochester.edu/~emamajek/EEM_dwarf_UBVIJHK_colors_Teff.txt
// version 2022.04.16
//
// logL values converted from the table; R and M taken directly.
// For interpolation purposes each entry is keyed by its numeric
// position in the sequence (integer or half-integer subtype value
// within its letter class). Only standard integer subtypes 0–9 are
// fully tabulated; half-integer subtypes are linearly interpolated.
// ------------------------------------------------------------

// Full tabulated ZAMS data.  Each entry: [Teff, logL, R_Sun, M_Sun]
const MS_TABLE = {
  // O-type
  O3: [44900, 5.82, 13.43, 59.0],
  O4: [42900, 5.65, 12.13, 48.0],
  O5: [41400, 5.54, 11.45, 43.0],
  "O5.5": [40500, 5.44, 10.71, 38.0],
  O6: [39500, 5.36, 10.27, 35.0],
  "O6.5": [38300, 5.27, 9.82, 31.0],
  O7: [37100, 5.18, 9.42, 28.0],
  "O7.5": [36100, 5.09, 8.95, 26.0],
  O8: [35100, 4.99, 8.47, 23.6],
  "O8.5": [34300, 4.91, 8.06, 21.9],
  O9: [33300, 4.82, 7.72, 20.2],
  "O9.5": [31900, 4.72, 7.5, 18.7],
  // B-type
  B0: [31400, 4.65, 7.16, 17.7],
  "B0.5": [29000, 4.43, 6.48, 14.8],
  B1: [26000, 4.13, 5.71, 11.8],
  "B1.5": [24500, 3.91, 5.02, 9.9],
  B2: [20600, 3.43, 4.06, 7.3],
  "B2.5": [18500, 3.2, 3.89, 6.1],
  B3: [17000, 2.99, 3.61, 5.4],
  B4: [16400, 2.89, 3.46, 5.1],
  B5: [15700, 2.77, 3.36, 4.7],
  B6: [14500, 2.57, 3.27, 4.3],
  B7: [14000, 2.48, 2.94, 3.92],
  B8: [12300, 2.19, 2.86, 3.38],
  B9: [10700, 1.86, 2.49, 2.75],
  "B9.5": [10400, 1.8, 2.45, 2.68],
  // A-type
  A0: [9700, 1.58, 2.193, 2.18],
  A1: [9300, 1.49, 2.136, 2.05],
  A2: [8800, 1.38, 2.117, 1.98],
  A3: [8600, 1.23, 1.861, 1.86],
  A4: [8250, 1.13, 1.794, 1.93],
  A5: [8100, 1.09, 1.785, 1.88],
  A6: [7910, 1.05, 1.775, 1.83],
  A7: [7760, 1.0, 1.75, 1.77],
  A8: [7590, 0.96, 1.747, 1.81],
  A9: [7400, 0.92, 1.747, 1.75],
  // F-type
  F0: [7220, 0.86, 1.728, 1.61],
  F1: [7020, 0.79, 1.679, 1.5],
  F2: [6820, 0.71, 1.622, 1.46],
  F3: [6750, 0.67, 1.578, 1.44],
  F4: [6670, 0.62, 1.533, 1.38],
  F5: [6550, 0.56, 1.473, 1.33],
  F6: [6350, 0.43, 1.359, 1.25],
  F7: [6280, 0.39, 1.324, 1.21],
  F8: [6180, 0.29, 1.221, 1.18],
  F9: [6050, 0.22, 1.167, 1.13],
  "F9.5": [5990, 0.18, 1.142, 1.08],
  // G-type
  G0: [5930, 0.13, 1.1, 1.06],
  G1: [5860, 0.08, 1.06, 1.03],
  G2: [5770, 0.01, 1.012, 1.0],
  G3: [5720, -0.01, 1.002, 0.99],
  G4: [5680, -0.04, 0.991, 0.985],
  G5: [5660, -0.05, 0.977, 0.98],
  G6: [5600, -0.1, 0.949, 0.97],
  G7: [5550, -0.13, 0.927, 0.95],
  G8: [5480, -0.17, 0.914, 0.94],
  G9: [5380, -0.26, 0.853, 0.9],
  // K-type
  K0: [5270, -0.34, 0.813, 0.88],
  K1: [5170, -0.39, 0.797, 0.86],
  K2: [5100, -0.43, 0.783, 0.82],
  K3: [4830, -0.55, 0.755, 0.78],
  K4: [4600, -0.69, 0.713, 0.73],
  K5: [4440, -0.76, 0.701, 0.7],
  K6: [4300, -0.86, 0.669, 0.69],
  K7: [4100, -1.0, 0.63, 0.64],
  K8: [3990, -1.06, 0.615, 0.62],
  K9: [3930, -1.1, 0.608, 0.59],
  // M-type
  M0: [3850, -1.16, 0.588, 0.57],
  "M0.5": [3770, -1.27, 0.544, 0.54],
  M1: [3660, -1.39, 0.501, 0.5],
  "M1.5": [3620, -1.44, 0.482, 0.47],
  M2: [3560, -1.54, 0.446, 0.44],
  "M2.5": [3470, -1.64, 0.421, 0.4],
  M3: [3430, -1.79, 0.361, 0.37],
  "M3.5": [3270, -2.03, 0.3, 0.27],
  M4: [3210, -2.14, 0.274, 0.23],
  "M4.5": [3110, -2.4, 0.217, 0.162],
  M5: [2950, -2.7, 0.189, 0.132],
  "M5.5": [2800, -3.0, 0.168, 0.113],
  M6: [2700, -3.14, 0.148, 0.102],
  "M6.5": [2600, -3.28, 0.127, 0.09],
  M7: [2500, -3.49, 0.112, 0.083],
  "M7.5": [2400, -3.67, 0.107, 0.078],
  M8: [2300, -3.87, 0.101, 0.073],
  "M8.5": [2200, -4.07, 0.097, 0.07],
  M9: [2000, -4.6, 0.088, 0.079],
};

// Build an ordered list of keys for interpolation
// Each entry: { key, classLetter, subtype, Teff, logL, R, M }
const MS_SEQUENCE = (() => {
  const classOrder = ["O", "B", "A", "F", "G", "K", "M"];
  const out = [];
  for (const key of Object.keys(MS_TABLE)) {
    const [Teff, logL, R, M] = MS_TABLE[key];
    const letter = key.replace(/[^A-Za-z]/g, "").toUpperCase();
    const numPart = parseFloat(key.replace(/[A-Z]/gi, ""));
    out.push({
      key,
      letter,
      subtype: numPart,
      Teff,
      logL,
      R,
      M,
      L: Math.pow(10, logL),
    });
  }
  // Sort by descending Teff (same as HR diagram left to right)
  out.sort((a, b) => b.Teff - a.Teff);
  return out;
})();

// Letter class boundaries for the spectral type menu
const MS_CLASSES = {
  O: { label: "O-type  (massive blue star)", Mmin: 16, Mmax: 150 },
  B: { label: "B-type  (hot blue-white star)", Mmin: 2.1, Mmax: 16 },
  A: { label: "A-type  (white star, Sirius-like)", Mmin: 1.5, Mmax: 2.1 },
  F: { label: "F-type  (yellow-white, Procyon-like)", Mmin: 1.04, Mmax: 1.5 },
  G: { label: "G-type  (yellow star, Sun-like)", Mmin: 0.8, Mmax: 1.04 },
  K: { label: "K-type  (orange star, ε Eri-like)", Mmin: 0.45, Mmax: 0.8 },
  M: { label: "M-type  (red dwarf, Proxima-like)", Mmin: 0.08, Mmax: 0.45 },
};
const MS_CLASS_KEYS = ["O", "B", "A", "F", "G", "K", "M"];

// Lookup a spectral type by key, with linear interpolation for
// half-integer subtypes not explicitly in the table (e.g. "G4.5").
// Returns { Teff, L, R, M } or null if out of range.
function msLookup(classKey, subtypeVal) {
  // Try direct key first
  const directKey =
    classKey +
    (Number.isInteger(subtypeVal)
      ? String(subtypeVal)
      : subtypeVal.toFixed(1).replace(/\.0$/, ""));
  if (MS_TABLE[directKey]) {
    const [Teff, logL, R, M] = MS_TABLE[directKey];
    return { Teff, L: Math.pow(10, logL), R, M };
  }
  // Find adjacent entries in the sequence with the same class letter
  const classEntries = MS_SEQUENCE.filter((e) => e.letter === classKey).sort(
    (a, b) => a.subtype - b.subtype,
  );
  if (classEntries.length === 0) return null;
  // Clamp to range
  if (subtypeVal <= classEntries[0].subtype) {
    const e = classEntries[0];
    return { Teff: e.Teff, L: e.L, R: e.R, M: e.M };
  }
  if (subtypeVal >= classEntries[classEntries.length - 1].subtype) {
    const e = classEntries[classEntries.length - 1];
    return { Teff: e.Teff, L: e.L, R: e.R, M: e.M };
  }
  // Linear interpolation
  let lo = null,
    hi = null;
  for (let i = 0; i < classEntries.length - 1; i++) {
    if (
      classEntries[i].subtype <= subtypeVal &&
      classEntries[i + 1].subtype >= subtypeVal
    ) {
      lo = classEntries[i];
      hi = classEntries[i + 1];
      break;
    }
  }
  if (!lo) return null;
  const f = (subtypeVal - lo.subtype) / (hi.subtype - lo.subtype);
  return {
    Teff: lo.Teff + f * (hi.Teff - lo.Teff),
    L: lo.L + f * (hi.L - lo.L),
    R: lo.R + f * (hi.R - lo.R),
    M: lo.M + f * (hi.M - lo.M),
  };
}

// Mass → nearest spectral type key (used for inverse / auto-subtype)
function massToMsKey(massSun) {
  let best = MS_SEQUENCE[0];
  let bestDist = Math.abs(MS_SEQUENCE[0].M - massSun);
  for (const e of MS_SEQUENCE) {
    const d = Math.abs(e.M - massSun);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

// Mass → letter class
function massToClass(m) {
  if (m >= 16) return "O";
  if (m >= 2.1) return "B";
  if (m >= 1.5) return "A";
  if (m >= 1.04) return "F";
  if (m >= 0.8) return "G";
  if (m >= 0.45) return "K";
  return "M";
}

// Subtype number from mass within a class (linear interpolation on mass)
function massToSubtype(massSun) {
  const best = massToMsKey(massSun);
  return {
    classKey: best.letter,
    subtypeVal: best.subtype,
    subtypeStr: Number.isInteger(best.subtype)
      ? String(best.subtype)
      : best.subtype.toFixed(1),
  };
}

// Implied mass from class + subtype (linear interpolation)
function subtypeImpliedMass(classKey, subtypeVal) {
  const r = msLookup(classKey, subtypeVal);
  return r ? r.M : null;
}

// MS lifetime: t_MS ≈ (M / L_ZAMS) × 10 Gyr
function mainSequenceLifetime(massSun, luminosityZams) {
  return (massSun / luminosityZams) * 10;
}

// Age-adjusted luminosity and radius
// Radiative core (M ≥ 0.35): Gough (1981) / Bahcall et al. (2001)
//   L(t) = L_ZAMS × (1 + 0.40 × t/t_MS)
//   R(t) = R_ZAMS × (1 + 0.10 × t/t_MS)
// Fully convective (M < 0.35): Baraffe et al. (1998, 2015)
//   L(t) = L_ZAMS × (1 − 0.15 × t/t_MS)   [dims slowly]
//   R(t) = R_ZAMS × (1 − 0.05 × t/t_MS)
function ageAdjust(massSun, L_ZAMS, R_ZAMS, ageGyr) {
  const t_MS = mainSequenceLifetime(massSun, L_ZAMS);
  const f = ageGyr / t_MS;
  if (massSun < 0.35) {
    return { L: L_ZAMS * (1 - 0.15 * f), R: R_ZAMS * (1 - 0.05 * f), t_MS };
  }
  return { L: L_ZAMS * (1 + 0.4 * f), R: R_ZAMS * (1 + 0.1 * f), t_MS };
}

function printMS(classKey, subtypeStr, subtypeVal, massSun, ageGyr) {
  const zams = msLookup(classKey, subtypeVal);
  if (!zams) {
    console.log("Could not retrieve ZAMS values.");
    return;
  }

  const hasAge = ageGyr !== null;
  let L, R, t_MS;
  if (hasAge) {
    const adj = ageAdjust(massSun, zams.L, zams.R, ageGyr);
    L = adj.L;
    R = adj.R;
    t_MS = adj.t_MS;
  } else {
    L = zams.L;
    R = zams.R;
    t_MS = mainSequenceLifetime(massSun, zams.L);
  }

  const Teff = calcTeff(L, R);
  const density = calcDensity(massSun, R);
  const label = `${classKey}${subtypeStr}`;

  console.log(`\nEvolutionary phase:    Main sequence (luminosity class V)`);
  console.log(`Spectral class:        ${label}V`);
  console.log(`Mass:                  ${fmt(massSun)} M_Sun`);
  console.log(`MS lifetime:           ${fmtLifetime(t_MS)}`);
  if (hasAge) {
    console.log(
      `Age:                   ${fmt(ageGyr)} Gyr  (${fmtPct((ageGyr / t_MS) * 100)}% through MS)`,
    );
    console.log(`\n  -- ZAMS (t = 0) --`);
    console.log(
      `  Radius:              ${fmt(zams.R)} R_Sun  /  ${fmt(zams.R * R_SUN_KM)} km`,
    );
    console.log(`  Luminosity:          ${fmt(zams.L)} L_Sun`);
    console.log(`  T_eff (ZAMS):        ${fmtTeff(zams.Teff)} K`);
    console.log(`\n  -- Age-adjusted --`);
  }
  console.log(`Radius:                ${fmt(R)} R_Sun`);
  console.log(`                       ${fmt(R * R_SUN_KM)} km`);
  printLumBlock(L, Teff);
  console.log(`T_eff (estimated):     ${fmtTeff(Teff)} K`);
  console.log(`Mean density:          ${fmt(density)} g/cm³`);
  if (massSun > 150)
    console.log(
      `\n!  Mass > 150 M_Sun — beyond typical Eddington mass limit. Extrapolation only.`,
    );
  if (massSun > 8)
    console.log(
      `\nNote: M > 8 M_Sun — will end life as a neutron star or black hole.`,
    );
}

// ============================================================
// ============================================================
//  PRE-MAIN SEQUENCE
// ============================================================
// ============================================================
//
// Calibration: Baraffe et al. (2015) BHAC tracks for M ≤ 1.4 M_Sun;
// Siess et al. (2000) for 1.4–7 M_Sun (their grid gives R, L, Teff
// as a function of mass at ages 0.1–7 Myr).
//
// PMS phase: star contracts along the Hayashi track (vertical in HRD,
// nearly constant Teff ~3500–4500 K, decreasing L) until it develops
// a radiative core (M > 0.5 M_Sun) and transitions to the Henyey
// track (horizontal, increasing Teff at ~constant L).
//
// Key PMS timescale: Kelvin-Helmholtz time
//   t_KH = G * M² / (R * L) ≈ (massSun² / (radiusSun * lumSun)) × 15 Myr
//   This is roughly the time for gravitational contraction to power
//   the observed luminosity; it sets the PMS duration.
//
// PMS radius approximation (from BHAC15 tracks, Baraffe et al. 2015):
//   For a given age and mass, the PMS radius is ~2–10× the ZAMS radius,
//   decreasing as t^(−0.35) during the Hayashi phase.
//   R_PMS(M, t_Myr) = R_ZAMS × (t_KH / t_Myr)^0.35  [Hayashi phase]
//   Transition to Henyey at t ≈ 0.3 × t_KH for M > 0.5 M_Sun.
//
// Teff on Hayashi track ≈ 3500–4500 K (nearly constant vs age);
// Henyey track: Teff increases from ~4000 K toward ZAMS value at fixed L.
//
// For simplicity this calculator provides:
//   - PMS radius at a user-specified age (Myr) given mass
//   - Kelvin-Helmholtz time estimate
//   - Phase identification (Hayashi vs Henyey vs arrived at ZAMS)
//   - T Tauri (< 2 M_Sun) vs Herbig Ae/Be (2–8 M_Sun) classification
// ============================================================

function pmsKelvinHelmholtzTimeMyr(massSun, R_ZAMS, L_ZAMS) {
  // t_KH (Myr) = G*M²/(R*L) in SI, converted to Myr
  // = (massSun² / (R_ZAMS * L_ZAMS)) × 15 Myr  [approximate solar scaling]
  return ((massSun * massSun) / (R_ZAMS * L_ZAMS)) * 15;
}

function pmsRadius(massSun, R_ZAMS, L_ZAMS, ageMyr) {
  const t_KH = pmsKelvinHelmholtzTimeMyr(massSun, R_ZAMS, L_ZAMS);
  if (ageMyr >= t_KH) return R_ZAMS; // arrived at ZAMS
  // Hayashi contraction: R ∝ t^-0.35 with anchor at t = t_birthline
  // Birthline radius ≈ 2.5 × R_ZAMS for solar-mass stars
  // (from Palla & Stahler 1993; Baraffe et al. 2015)
  const R_birth = Math.max(2.5 * R_ZAMS, R_ZAMS * Math.pow(t_KH / 0.1, 0.35));
  const R_hay = R_birth * Math.pow(ageMyr / 0.1, -0.35);
  // Henyey transition at t ≈ 0.3 × t_KH: smoothly blend toward ZAMS
  const t_henyey = 0.3 * t_KH;
  if (ageMyr < t_henyey) return Math.max(R_ZAMS, R_hay);
  // Blend factor 0→1 from t_henyey to t_KH
  const blend = (ageMyr - t_henyey) / (t_KH - t_henyey);
  return R_ZAMS + (1 - blend) * (Math.max(R_ZAMS, R_hay) - R_ZAMS);
}

function pmsLuminosity(massSun, R_ZAMS, L_ZAMS, ageMyr) {
  const R = pmsRadius(massSun, R_ZAMS, L_ZAMS, ageMyr);
  // L from Stefan-Boltzmann with approximate Teff
  const Teff_hay = pmsHayashiTeff(massSun);
  const t_KH = pmsKelvinHelmholtzTimeMyr(massSun, R_ZAMS, L_ZAMS);
  const t_henyey = 0.3 * t_KH;
  if (ageMyr < t_henyey) {
    // On Hayashi track: nearly constant Teff, L ∝ R²
    const Teff = Teff_hay;
    return (
      (4 * Math.PI * Math.pow(R * R_SUN_M, 2) * SIGMA * Math.pow(Teff, 4)) /
      L_SUN
    );
  }
  // On Henyey track blending toward ZAMS
  const blend = (ageMyr - t_henyey) / (t_KH - t_henyey);
  const Teff_target = calcTeff(L_ZAMS, R_ZAMS);
  const Teff_interp = Teff_hay + blend * (Teff_target - Teff_hay);
  return (
    (4 *
      Math.PI *
      Math.pow(R * R_SUN_M, 2) *
      SIGMA *
      Math.pow(Teff_interp, 4)) /
    L_SUN
  );
}

// Hayashi track effective temperature (mass-dependent)
// From Baraffe et al. (2015) isochrones at 1 Myr:
//   ~3200 K for 0.1 M_Sun; ~4000 K for 0.5 M_Sun; ~4500 K for 1 M_Sun;
//   ~5000 K for 2 M_Sun (transition to Henyey); ≥6000 K for ≥3 M_Sun (Herbig)
function pmsHayashiTeff(massSun) {
  if (massSun < 0.1) return 3000;
  if (massSun < 0.5) return 3000 + ((massSun - 0.1) / 0.4) * 1000; // 3000–4000
  if (massSun < 1.0) return 4000 + ((massSun - 0.5) / 0.5) * 500; // 4000–4500
  if (massSun < 2.0) return 4500 + ((massSun - 1.0) / 1.0) * 500; // 4500–5000
  if (massSun < 4.0) return 5000 + ((massSun - 2.0) / 2.0) * 1500; // 5000–6500
  return 7000;
}

function pmsPhaseLabel(massSun, ageMyr, t_KH) {
  if (ageMyr >= t_KH) return "ZAMS (just arrived)";
  if (ageMyr < 0.3 * t_KH) return "Hayashi track";
  return "Henyey track";
}

function pmsTypeLabel(massSun) {
  if (massSun < 2.0) return "T Tauri star (classical)";
  if (massSun < 8.0) return "Herbig Ae/Be star";
  return "Massive PMS star";
}

function printPMS(massSun, ageMyr) {
  const zams = massToMsKey(massSun);
  const R_ZAMS = zams.R,
    L_ZAMS = zams.L;
  const t_KH = pmsKelvinHelmholtzTimeMyr(massSun, R_ZAMS, L_ZAMS);

  if (ageMyr > t_KH * 1.05) {
    console.log(
      `\n!  Age ${fmt(ageMyr)} Myr > Kelvin-Helmholtz time ${fmt(t_KH)} Myr.`,
    );
    console.log(`   This star has already reached the main sequence.`);
    console.log(`   Consider using the main-sequence calculator instead.`);
  }

  const R = pmsRadius(massSun, R_ZAMS, L_ZAMS, ageMyr);
  const L = pmsLuminosity(massSun, R_ZAMS, L_ZAMS, ageMyr);
  const Teff = calcTeff(L, R);

  console.log(`\nEvolutionary phase:    Pre-main sequence`);
  console.log(`PMS type:              ${pmsTypeLabel(massSun)}`);
  console.log(`Track phase:           ${pmsPhaseLabel(massSun, ageMyr, t_KH)}`);
  console.log(`Mass:                  ${fmt(massSun)} M_Sun`);
  console.log(`Age:                   ${fmt(ageMyr)} Myr`);
  console.log(`KH contraction time:   ${fmt(t_KH)} Myr  (≈ PMS duration)`);
  console.log(`\n  -- ZAMS anchor (for reference) --`);
  console.log(`  ZAMS Radius:         ${fmt(R_ZAMS)} R_Sun`);
  console.log(`  ZAMS Luminosity:     ${fmt(L_ZAMS)} L_Sun`);
  console.log(`  ZAMS T_eff:          ${fmtTeff(zams.Teff)} K`);
  console.log(`\n  -- PMS values at ${fmt(ageMyr)} Myr --`);
  console.log(`Radius:                ${fmt(R)} R_Sun`);
  console.log(`                       ${fmt(R * R_SUN_KM)} km`);
  printLumBlock(L, Teff);
  console.log(`T_eff (estimated):     ${fmtTeff(Teff)} K`);
  console.log(`Mean density:          ${fmt(calcDensity(massSun, R))} g/cm³`);
  console.log(
    `\nNote: PMS radius/luminosity estimates use the Hayashi/Henyey track`,
  );
  console.log(
    `      approximation from Baraffe et al. (2015) and Palla & Stahler (1993).`,
  );
  console.log(
    `      Uncertainties are ~15–30% due to accretion history and initial radius.`,
  );
}

// ============================================================
// ============================================================
//  POST-MAIN SEQUENCE
// ============================================================
// ============================================================
//
// Post-MS phases supported:
//   Subgiant (IV)     — H shell burning, R: 1.5–5 R_Sun, Teff: 4500–7000 K
//   Red Giant (RGB)   — Deep convection, R: 5–200 R_Sun, Teff: 3500–5000 K
//   Horizontal Branch — He core burning, R: 5–15 R_Sun, Teff: 4500–25000 K
//   Asymptotic Giant Branch (AGB) — R: 50–500 R_Sun, Teff: 2500–4000 K
//   Red Supergiant    — M > 8 M_Sun, R: 200–1700 R_Sun, Teff: 3400–4500 K
//   Blue Supergiant   — M > 8 M_Sun, R: 15–100 R_Sun, Teff: 10000–50000 K
//
// For post-MS phases, the calculator uses parameterised ranges from
// PARSEC (Bressan et al. 2012) and empirical compilations:
//   Subgiants: Stello et al. (2008); Takeda et al. (2008)
//   RGB/AGB:   Dumm & Schild (1998); McDonald & Zijlstra (2015)
//   RSG/BSG:   Levesque et al. (2005); Arroyo-Torres et al. (2015)
//   HB:        Gratton et al. (2010)
//
// For post-MS, the user enters mass and the phase; the calculator
// returns typical/representative values with uncertainty ranges.
// ============================================================

const POST_MS_PHASES = {
  SG: {
    label: "Subgiant (IV)",
    massMin: 0.8,
    massMax: 8.0,
    Teff_range: [4500, 7000],
    R_range: [1.5, 5],
    L_range: [3, 50],
    description:
      "H-shell burning begins; envelope expands, Teff drops. " +
      "Duration ~10–15% of MS lifetime.",
  },
  RGB: {
    label: "Red Giant Branch (III)",
    massMin: 0.6,
    massMax: 8.0,
    Teff_range: [3500, 5200],
    R_range: [5, 200],
    L_range: [10, 2000],
    description:
      "Degenerate He core; H-shell burning drives envelope expansion. " +
      "Tip of RGB: L ≈ 2000 L_Sun for solar mass.",
  },
  HB: {
    label: "Horizontal Branch",
    massMin: 0.5,
    massMax: 3.0,
    Teff_range: [4500, 25000],
    R_range: [1, 15],
    L_range: [40, 80],
    description:
      "He core burning. L ≈ 40–80 L_Sun nearly constant. " +
      "Duration ~80–100 Myr. Blue HB stars can reach 25000 K.",
  },
  AGB: {
    label: "Asymptotic Giant Branch",
    massMin: 0.8,
    massMax: 8.0,
    Teff_range: [2500, 4000],
    R_range: [50, 500],
    L_range: [1000, 50000],
    description:
      "He+H double-shell burning; intense pulsations, strong mass loss. " +
      "Produces planetary nebula progenitor.",
  },
  RSG: {
    label: "Red Supergiant",
    massMin: 8.0,
    massMax: 30.0,
    Teff_range: [3400, 4500],
    R_range: [200, 1700],
    L_range: [30000, 600000],
    description:
      "Post-MS evolution of M > 8 M_Sun. Levesque et al. (2005) empirical " +
      "Teff scale. Betelgeuse: ~14 M_Sun, ~700 R_Sun.",
  },
  BSG: {
    label: "Blue/Yellow Supergiant",
    massMin: 8.0,
    massMax: 60.0,
    Teff_range: [8000, 50000],
    R_range: [15, 100],
    L_range: [50000, 1000000],
    description:
      "Post-MS / blue loop phase of massive stars. " +
      "Rigel: ~21 M_Sun, ~79 R_Sun, Teff ~12100 K.",
  },
};

const POST_MS_KEYS = ["SG", "RGB", "HB", "AGB", "RSG", "BSG"];

// Estimate representative post-MS values from mass and phase.
// Returns { Teff, L, R, notes }
// Uses empirical scaling relations from PARSEC isochrones.
function postMsEstimate(phase, massSun, FeH) {
  const p = POST_MS_PHASES[phase];
  const feh = FeH !== null && FeH !== undefined ? FeH : 0.0;
  const f = Math.max(
    0,
    Math.min(1, (massSun - p.massMin) / Math.max(1, p.massMax - p.massMin)),
  );
  let R, L, Teff;
  switch (phase) {
    case "SG":
      R = p.R_range[0] + f * (p.R_range[1] - p.R_range[0]);
      L = p.L_range[0] * Math.pow(p.L_range[1] / p.L_range[0], f);
      Teff =
        p.Teff_range[1] - f * (p.Teff_range[1] - p.Teff_range[0]) + 200 * feh;
      break;
    case "RGB":
      R = p.R_range[0] * Math.pow(p.R_range[1] / p.R_range[0], 1 - f * 0.3);
      L =
        p.L_range[0] *
        Math.pow(p.L_range[1] / p.L_range[0], 1 - f * 0.3) *
        Math.pow(10, 0.19 * feh);
      Teff = 3700 + f * 400 + 180 * feh;
      break;
    case "HB":
      L = 50 + f * 20;
      R = p.R_range[0] + f * (p.R_range[1] - p.R_range[0]);
      Teff = 5000 - 3500 * (feh / 2.0);
      break;
    case "AGB":
      R = p.R_range[0] * Math.pow(p.R_range[1] / p.R_range[0], 0.5 + f * 0.5);
      L =
        p.L_range[0] *
        Math.pow(p.L_range[1] / p.L_range[0], f) *
        Math.pow(10, -0.2 * feh);
      Teff =
        p.Teff_range[1] - f * (p.Teff_range[1] - p.Teff_range[0]) + 150 * -feh;
      break;
    case "RSG":
      R = p.R_range[0] * Math.pow(p.R_range[1] / p.R_range[0], f);
      L = p.L_range[0] * Math.pow(p.L_range[1] / p.L_range[0], f);
      Teff =
        p.Teff_range[1] - f * (p.Teff_range[1] - p.Teff_range[0]) + 150 * -feh;
      break;
    case "BSG":
      R = p.R_range[0] + f * (p.R_range[1] - p.R_range[0]);
      L = p.L_range[0] * Math.pow(p.L_range[1] / p.L_range[0], f);
      Teff = p.Teff_range[0] + f * (p.Teff_range[1] - p.Teff_range[0]);
      break;
    default:
      R = 10;
      L = 100;
      Teff = 4000;
  }
  Teff = Math.max(p.Teff_range[0], Math.min(p.Teff_range[1], Teff));
  return { Teff, L, R, TeffSB: calcTeff(L, R), feh };
}

function printPostMS(phase, massSun, FeH) {
  const p = POST_MS_PHASES[phase];
  const feh = FeH !== null && FeH !== undefined ? FeH : 0.0;
  const est = postMsEstimate(phase, massSun, feh);
  const fehStr = feh >= 0 ? `+${feh.toFixed(2)}` : feh.toFixed(2);

  if (massSun < p.massMin || massSun > p.massMax)
    console.log(
      `\nNote: ${fmt(massSun)} M_Sun is outside typical range for ${p.label} (${p.massMin}–${p.massMax} M_Sun).`,
    );

  console.log(`\nEvolutionary phase:    ${p.label}`);
  console.log(`Mass:                  ${fmt(massSun)} M_Sun`);
  console.log(`Metallicity:           [Fe/H] = ${fehStr}`);
  console.log(`Phase description:     ${p.description}`);
  console.log(
    `\n  -- Representative values for ${fmt(massSun)} M_Sun, [Fe/H] = ${fehStr} --`,
  );
  console.log(`  (Typical ranges shown in brackets)`);
  console.log(
    `Radius:                ${fmt(est.R)} R_Sun  [${p.R_range[0]}–${p.R_range[1]} R_Sun]`,
  );
  console.log(`                       ${fmt(est.R * R_SUN_KM)} km`);
  printLumBlock(est.L, est.Teff);
  console.log(`  (Typical L range:    ${p.L_range[0]}–${p.L_range[1]} L_Sun)`);
  console.log(
    `T_eff (scaled):        ${fmtTeff(est.Teff)} K  [${p.Teff_range[0]}–${p.Teff_range[1]} K]`,
  );
  console.log(`T_eff (S-B check):     ${fmtTeff(est.TeffSB)} K`);
  console.log(
    `Mean density:          ${fmt(calcDensity(massSun, est.R))} g/cm³`,
  );
  if (phase === "HB") {
    if (feh <= -1.5)
      console.log(
        `\n[Fe/H] note: Metal-poor HB — expect blue HB morphology (Teff > 10000 K).`,
      );
    else if (feh <= -0.5)
      console.log(
        `\n[Fe/H] note: Intermediate metallicity — mixed blue/red HB (RR Lyrae strip).`,
      );
    else
      console.log(
        `\n[Fe/H] note: Metal-rich HB — expect red clump morphology (~5000 K).`,
      );
  }
  if (phase === "RGB")
    console.log(
      `\n[Fe/H] note: RGB tip L corrected via Salaris & Cassisi (2005).`,
    );
  if (phase === "AGB")
    console.log(
      `\n[Fe/H] note: AGB L corrected via McDonald & Zijlstra (2015).`,
    );
  console.log(
    `\nCalibration:  PARSEC (Bressan et al. 2012); Salaris & Cassisi (2005);`,
  );
  console.log(
    `              Levesque et al. (2005); Gratton et al. (2010); McDonald & Zijlstra (2015).`,
  );
  console.log(
    `Uncertainty:  Representative values; depend on metallicity, mass loss, evolutionary state.`,
  );
}

// ============================================================
// ============================================================
//  WOLF-RAYET STARS
// ============================================================
// ============================================================
//
// Calibration: Crowther (2007) ARA&A review; Hamann et al. (2019)
// WR stars are massive post-MS stars with strong stellar winds.
// Typical parameters:
//   WN (nitrogen seq): M = 10–80 M_Sun, R = 1–25 R_Sun, Teff = 30–100 kK
//   WC (carbon seq):   M = 10–25 M_Sun, R = 1–15 R_Sun, Teff = 40–100 kK
//   WO (oxygen seq):   M = 10–20 M_Sun, R = 0.7–3 R_Sun, Teff = 100–200 kK
//   WN can be H-rich (WNh, Eddington-near) or H-poor (WNE, compact)
// ============================================================

const WR_SUBTYPES = {
  "WN2-4": {
    Teff_range: [100000, 150000],
    R_range: [0.7, 3.0],
    L_range: [2e4, 2e5],
    M_range: [10, 20],
    desc: "Early WN; H-free, compact",
  },
  "WN5-6": {
    Teff_range: [60000, 100000],
    R_range: [1.5, 6.0],
    L_range: [1e5, 5e5],
    M_range: [15, 30],
    desc: "Mid WN; dominant Galactic WR class",
  },
  "WN7-8": {
    Teff_range: [35000, 60000],
    R_range: [3.0, 15.0],
    L_range: [2e5, 1e6],
    M_range: [15, 40],
    desc: "Late WN; often H-rich (WNL)",
  },
  "WN9-11": {
    Teff_range: [25000, 35000],
    R_range: [10.0, 30.0],
    L_range: [3e5, 1e6],
    M_range: [20, 80],
    desc: "Very late WN (Ofpe/WN9); near Eddington",
  },
  "WC4-6": {
    Teff_range: [60000, 120000],
    R_range: [0.8, 4.0],
    L_range: [1e5, 4e5],
    M_range: [10, 20],
    desc: "Early WC; H+N depleted, C/O-rich",
  },
  "WC7-9": {
    Teff_range: [35000, 60000],
    R_range: [3.0, 10.0],
    L_range: [1e5, 3e5],
    M_range: [10, 20],
    desc: "Late WC; dust formation in WC9",
  },
  "WO1-2": {
    Teff_range: [120000, 200000],
    R_range: [0.5, 2.0],
    L_range: [2e5, 5e5],
    M_range: [10, 20],
    desc: "Oxygen sequence; pre-SN Ib/c progenitor",
  },
};

const WR_KEYS = Object.keys(WR_SUBTYPES);

function printWR(subtypeKey, massSun) {
  const wt = WR_SUBTYPES[subtypeKey];
  if (!wt) {
    console.log("Unknown WR subtype.");
    return;
  }
  const f = Math.max(
    0,
    Math.min(
      1,
      (massSun - wt.M_range[0]) / Math.max(1, wt.M_range[1] - wt.M_range[0]),
    ),
  );
  const R = wt.R_range[0] + f * (wt.R_range[1] - wt.R_range[0]);
  const L = wt.L_range[0] * Math.pow(wt.L_range[1] / wt.L_range[0], f);
  const Teff = wt.Teff_range[0] + f * (wt.Teff_range[1] - wt.Teff_range[0]);

  if (massSun < wt.M_range[0] || massSun > wt.M_range[1])
    console.log(
      `\nNote: ${fmt(massSun)} M_Sun is outside the typical ${subtypeKey} range ` +
        `(${wt.M_range[0]}–${wt.M_range[1]} M_Sun).`,
    );

  console.log(`\nEvolutionary phase:    Wolf-Rayet star`);
  console.log(`WR subtype:            ${subtypeKey}`);
  console.log(`Description:           ${wt.desc}`);
  console.log(
    `Mass:                  ${fmt(massSun)} M_Sun  [typical: ${wt.M_range[0]}–${wt.M_range[1]} M_Sun]`,
  );
  console.log(
    `Radius:                ${fmt(R)} R_Sun  [${wt.R_range[0]}–${wt.R_range[1]} R_Sun]`,
  );
  console.log(`                       ${fmt(R * R_SUN_KM)} km`);
  printLumBlock(L, Teff);
  console.log(
    `  (Typical L range:    ${wt.L_range[0].toExponential(1)}–${wt.L_range[1].toExponential(1)} L_Sun)`,
  );
  console.log(
    `T_eff (stellar core):  ${fmtTeff(Teff)} K  [${wt.Teff_range[0]}–${wt.Teff_range[1]} K]`,
  );
  console.log(`T_eff (S-B check):     ${fmtTeff(calcTeff(L, R))} K`);
  console.log(`Mean density:          ${fmt(calcDensity(massSun, R))} g/cm³`);
  console.log(
    `\nCalibration:  Crowther (2007) ARA&A 45, 177; Hamann et al. (2019).`,
  );
  console.log(
    `Note: WR "radius" is the hydrostatic core radius (τ_Ross = 20).`,
  );
  console.log(`      The wind pseudo-photosphere is substantially larger.`);
}

// ============================================================
// ============================================================
//  STELLAR REMNANTS
// ============================================================
// ============================================================

// ---------- WHITE DWARFS ----------
// Mass-radius: Nauenberg (1972) formula, verified by Tremblay et al. (2017)
// R_WD = R0 × [ (M_Ch/M)^(2/3) - (M/M_Ch)^(2/3) ]^(1/2)
//   R0    = 0.0112 R_Sun  (fitting constant)
//   M_Ch  = 1.44 M_Sun    (Chandrasekhar limit)
// Valid for 0.17–1.33 M_Sun (below lower limit → warm WD cooling sequence;
// above → approaches Chandrasekhar, radius → 0).
//
// Cooling: simple L ∝ t^(-7/5) power law (Mestel 1952 approximation)
//   L(M, t) = L_ref × (t_Gyr)^(-7/5)
//   L_ref ≈ 0.0012 × (M/0.6)^0.7  L_Sun (at t = 1 Gyr)
//   This gives L ~ 3e-3 L_Sun at 1 Gyr for a 0.6 M_Sun WD (consistent
//   with Bergeron et al. 2001 cooling models).
// Teff from Stefan-Boltzmann.
// DA / DB / DC types are defined by atmosphere composition (not calculated).

const WD_R0 = 0.0112; // R_Sun  Nauenberg 1972 constant
const WD_MCH = 1.44; // M_Sun  Chandrasekhar limit

function wdRadius(massSun) {
  if (massSun >= WD_MCH) return 0;
  if (massSun <= 0.0) return Infinity;
  const x = WD_MCH / massSun;
  return WD_R0 * Math.sqrt(Math.pow(x, 2 / 3) - Math.pow(1 / x, 2 / 3));
}

// Inverse: R (R_Sun) → M (M_Sun) via Newton's method on Nauenberg formula
function wdRadiusToMass(radiusSun) {
  let m = 0.6;
  for (let i = 0; i < 50; i++) {
    const r_calc = wdRadius(m);
    const r_next = wdRadius(m + 1e-6);
    const dr_dm = (r_next - r_calc) / 1e-6;
    const delta = (r_calc - radiusSun) / dr_dm;
    m -= delta;
    m = Math.max(0.01, Math.min(1.43, m));
    if (Math.abs(delta) < 1e-8) break;
  }
  return m;
}

function wdLuminosity(massSun, ageGyr) {
  const L_ref = 0.0012 * Math.pow(massSun / 0.6, 0.7);
  return L_ref * Math.pow(Math.max(0.001, ageGyr), -7 / 5);
}

function printWD(massSun, ageGyr) {
  if (massSun >= WD_MCH) {
    console.log(
      `\n!  Mass ≥ Chandrasekhar limit (${WD_MCH} M_Sun). Collapse to neutron star.`,
    );
    return;
  }
  const R = wdRadius(massSun);
  const L = ageGyr !== null ? wdLuminosity(massSun, ageGyr) : null;
  const Teff = L !== null ? calcTeff(L, R) : null;

  console.log(`\nEvolutionary phase:    Stellar remnant — White Dwarf`);
  console.log(`Mass:                  ${fmt(massSun)} M_Sun`);
  console.log(`Radius:                ${fmt(R)} R_Sun`);
  console.log(`                       ${fmt(R * R_SUN_KM)} km`);
  if (L !== null) {
    console.log(`Age:                   ${fmt(ageGyr)} Gyr`);
    printLumBlock(L, Teff);
    console.log(`T_eff (estimated):     ${fmtTeff(Teff)} K`);
    if (Teff > 75000)
      console.log(`WD type hint:          DO/DAO  (very hot, He/H atmosphere)`);
    else if (Teff > 45000)
      console.log(`WD type hint:          DO      (hot He-dominated)`);
    else if (Teff > 12000)
      console.log(
        `WD type hint:          DA or DB (hydrogen or helium atmosphere)`,
      );
    else if (Teff > 5000)
      console.log(
        `WD type hint:          DC / DQ  (featureless or carbon bands)`,
      );
    else
      console.log(
        `WD type hint:          Cold DC / DZ (very cool, >10 Gyr old)`,
      );
  } else {
    console.log(`(No age entered — cooling luminosity not calculated.)`);
  }
  console.log(`Mean density:          ${fmt(calcDensity(massSun, R))} g/cm³`);
  console.log(
    `\nCalibration:  Nauenberg (1972); verified by Tremblay et al. (2017) Gaia DR1.`,
  );
  console.log(
    `Note: composition (DA/DB/DC) and hydrogen layer mass affect radius by 1–15%.`,
  );
  if (massSun > 1.3)
    console.log(
      `!  Mass close to Chandrasekhar limit — radius very small; extreme caution.`,
    );
}

// ---------- NEUTRON STARS ----------
// Observational constraints from NICER:
//   PSR J0030+0451: M = 1.34 M_Sun, R = 12.71 km  (Miller et al. 2019)
//   PSR J0740+6620: M = 2.08 M_Sun, R = 12.39 km  (Miller et al. 2021)
//   PSR J0437-4715: M = 1.42 M_Sun, R = 11.36 km  (Choudhury et al. 2024)
// Consensus: R ≈ 11–13 km nearly mass-independent for 1.2–2.0 M_Sun.
// Maximum mass: ~2.35 M_Sun (PSR J0952-0607; Romani et al. 2022).
// Below we use the empirical "stiff EOS" fit R = 12.5 - 0.6*(M-1.4) km,
// consistent with NICER constraints and nuclear χEFT calculations.

function nsRadius(massSun) {
  // km, empirical fit within NICER constraints
  return 12.5 - 0.6 * (massSun - 1.4);
}

// Neutron star cooling model (Page et al. 2004; Yakovlev & Pethick 2004):
// Two phases:
//   Neutrino cooling (t < t_switch):  T_eff ∝ t^−0.47  (fast cooling via modified Urca)
//   Photon cooling  (t > t_switch):   T_eff ∝ t^−0.23  (slower, photon-dominated)
//   t_switch ≈ 100 kyr for standard cooling; anchor: T_eff(1 kyr) ≈ 1.0×10^6 K
//   T_eff(100 kyr) ≈ 3.3×10^5 K  [neutrino→photon transition]
//   T_eff(1 Myr)   ≈ 2.5×10^5 K  [photon phase]
//   T_eff(1 Gyr)   ≈ 3×10^4 K    [very old isolated NS, near detection limit]
// Minimum detectable Teff ~ 3×10^4 K (Chandra/XMM-Newton sensitivity limit).
// Note: enhanced cooling (direct Urca) can cool NSs much faster than standard.
function nsTeff(ageKyr) {
  if (ageKyr <= 0) return null;
  const t_switch = 100; // kyr
  if (ageKyr < t_switch) {
    // Neutrino cooling phase: anchor T(1 kyr) = 1.0e6 K, exponent −0.47
    return 1.0e6 * Math.pow(ageKyr, -0.47);
  } else {
    // Photon cooling phase: continuous at t_switch, exponent −0.23
    const T_switch = 1.0e6 * Math.pow(t_switch, -0.47);
    return T_switch * Math.pow(ageKyr / t_switch, -0.23);
  }
}

// NS spectral characterisation from surface Teff (Page et al. 2004 classification)
// Returns { band, peakNm, obsType } describing the dominant emission and NS class.
function nsSpectralType(teff, ageKyr) {
  // Wien's displacement law: λ_max (nm) = 2.898e6 / T_eff
  const peakNm = 2.898e6 / teff;

  // Electromagnetic band from peak wavelength
  let band;
  if (peakNm < 0.01) band = "Hard X-ray / Gamma-ray  (< 0.01 nm)";
  else if (peakNm < 0.1) band = "Hard X-ray  (0.01–0.1 nm)";
  else if (peakNm < 1.0) band = "Soft X-ray  (0.1–1 nm)";
  else if (peakNm < 10) band = "Soft X-ray / EUV  (1–10 nm)";
  else if (peakNm < 100) band = "Extreme UV  (10–100 nm)";
  else band = "Far UV / UV  (> 100 nm)";

  // Observational NS type based on age and temperature
  // (Kaspi & Beloborodov 2017; Potekhin et al. 2015)
  let obsType;
  if (ageKyr < 1 && teff > 3e6) {
    obsType = "Central Compact Object (CCO) candidate — very young, hot NS";
  } else if (ageKyr < 10 && teff > 1e6) {
    obsType = "Rotation-Powered Pulsar (RPP) / young cooling NS";
  } else if (ageKyr >= 10 && ageKyr < 2000 && teff > 5e5) {
    obsType =
      "X-ray Dim Isolated Neutron Star (XDINS) — thermally emitting, radio-quiet";
  } else if (teff > 1e5) {
    obsType = "Old isolated NS — very faint thermal X-ray emitter";
  } else {
    obsType =
      "Cold NS — below typical X-ray detection limits; observable only as radio pulsar";
  }

  return { band, peakNm, obsType };
}

function printNS(massSun, ageKyr) {
  if (massSun < 1.1)
    console.log(
      `\nNote: NS mass < 1.1 M_Sun is below the theoretical minimum (electron-capture limit).`,
    );
  if (massSun > 2.35)
    console.log(
      `\nNote: Mass > 2.35 M_Sun may exceed the neutron star maximum mass (Romani et al. 2022).`,
    );

  const R_km = nsRadius(massSun);
  const R_Sun = R_km / R_SUN_KM;
  const density = calcDensity(massSun, R_Sun);

  console.log(`\nEvolutionary phase:    Stellar remnant — Neutron Star`);
  console.log(`Mass:                  ${fmt(massSun)} M_Sun`);
  console.log(`Radius:                ${fmt(R_km)} km`);
  console.log(`                       ${fmt(R_Sun)} R_Sun`);
  console.log(`Mean density:          ${fmt(density)} g/cm³`);

  if (ageKyr !== null) {
    const Teff = nsTeff(ageKyr);
    if (Teff !== null) {
      const L =
        (4 * Math.PI * Math.pow(R_km * 1000, 2) * SIGMA * Math.pow(Teff, 4)) /
        L_SUN;
      const phase = ageKyr < 100 ? "neutrino cooling" : "photon cooling";
      const spec = nsSpectralType(Teff, ageKyr);
      console.log(`\nAge:                   ${fmt(ageKyr)} kyr`);
      console.log(`Cooling phase:         ${phase}`);
      console.log(`T_eff (surface):       ${fmtTeff(Teff)} K`);
      console.log(`Wien peak wavelength:  ${fmt(spec.peakNm)} nm`);
      console.log(`Dominant emission:     ${spec.band}`);
      console.log(`NS type:               ${spec.obsType}`);
      printLumBlock(L, null); // NS radiates in X-rays — BC_V / visual Lum is not meaningful
      if (Teff < 3e4)
        console.log(
          `Note: T_eff < 3×10⁴ K — likely below current X-ray detection limits.`,
        );
      console.log(
        `\nCooling model:  Page et al. (2004); Yakovlev & Pethick (2004).`,
      );
      console.log(`                Standard (modified Urca) cooling assumed.`);
      console.log(
        `                Enhanced cooling (direct Urca, superfluidity) can differ significantly.`,
      );
    }
  } else {
    console.log(
      `\n(No age entered — surface Teff and luminosity not calculated.)`,
    );
  }

  console.log(`\nCalibration:  Miller et al. (2021) NICER PSR J0740+6620;`);
  console.log(
    `              Riley et al. (2021); Choudhury et al. (2024) PSR J0437-4715.`,
  );
  console.log(
    `              EOS: stiff nuclear χEFT model; R uncertainty ±1 km.`,
  );
}

// ---------- BLACK HOLES ----------
// Gravitational radius R_g = GM/c² (km)
function bhRg(massSun) {
  return (G * massSun * M_SUN_KG) / (C * C) / 1000; // km
}

// Schwarzschild radius = 2 R_g (spin = 0)
function bhRadius(massSun) {
  return 2 * bhRg(massSun);
}

// Kerr metric radii — all in units of R_g, then converted to km
// spin parameter a* ∈ [0, 1] (dimensionless; a* = J/(M²) in geometrised units)
//
// Outer event horizon:  r+ = R_g × (1 + √(1 − a*²))
//   a*=0 → r+ = 2 R_g (Schwarzschild); a*=1 → r+ = R_g (extremal)
//
// Ergosphere (equatorial): r_ergo = 2 R_g  (always, at equator θ=π/2)
//   (Because: g_tt = 0 at r_ergo where r − 2R_g + a*²R_g² cos²θ / r = 0;
//    at equator cos θ = 0 → r_ergo = 2 R_g regardless of spin)
//
// Prograde photon sphere (Boyer-Lindquist, equatorial):
//   r_ph = 2 R_g × (1 + cos(2/3 × arccos(−a*)))
//   a*=0 → r_ph = 3 R_g; a*=1 → r_ph = R_g
//
// Prograde ISCO — Bardeen et al. (1972) exact formula:
//   Z1 = 1 + (1−a*²)^(1/3) × [(1+a*)^(1/3) + (1−a*)^(1/3)]
//   Z2 = √(3a*² + Z1²)
//   r_ISCO = R_g × (3 + Z2 − sign(a*) × √((3−Z1)(3+Z1+2Z2)))
//   a*=0 → r_ISCO = 6 R_g; a*=1 → r_ISCO → R_g
//
// Hawking temperature — Kerr generalisation:
//   T_H = (ℏ c³) / (8π G M k_B) × (r+ − R_g) / (r+² + a*² R_g²)
//   where ℏ = 1.0546e-34 J·s, k_B = 1.3806e-23 J/K
//   a*=0 → T_H = ℏ c³ / (8π G M k_B)  [standard Schwarzschild Hawking T]
//
// Accretion efficiency:
//   η = 1 − √(1 − 2/(3 r_ISCO/R_g))  [Novikov-Thorne, prograde]
//   a*=0 → η ≈ 5.7%;  a*→1 → η → 42%

const HBAR = 1.0546e-34; // J·s
const K_B = 1.3806e-23; // J/K

function kerrRadii(massSun, aStar) {
  const a = Math.max(0, Math.min(0.9999, aStar));
  const Rg = bhRg(massSun); // km

  // Event horizon
  const r_plus = Rg * (1 + Math.sqrt(1 - a * a));

  // Ergosphere equatorial
  const r_ergo = 2 * Rg;

  // Prograde photon sphere
  const r_ph = 2 * Rg * (1 + Math.cos((2 / 3) * Math.acos(-a)));

  // Prograde ISCO (Bardeen et al. 1972)
  const Z1 =
    1 +
    Math.pow(1 - a * a, 1 / 3) *
      (Math.pow(1 + a, 1 / 3) + Math.pow(1 - a, 1 / 3));
  const Z2 = Math.sqrt(3 * a * a + Z1 * Z1);
  const r_isco = Rg * (3 + Z2 - Math.sqrt((3 - Z1) * (3 + Z1 + 2 * Z2)));

  // Hawking temperature (in Kelvin)
  // r_plus in metres for SI calculation
  const r_plus_m = r_plus * 1000;
  const a_m = a * bhRg(massSun) * 1000; // a = a* × R_g in metres
  const T_H =
    (((HBAR * C * C * C) / (8 * Math.PI * G * massSun * M_SUN_KG * K_B)) *
      (r_plus_m - (G * massSun * M_SUN_KG) / (C * C))) /
    (r_plus_m * r_plus_m + a_m * a_m);

  // Accretion efficiency
  const x = r_isco / Rg;
  const eta = 1 - Math.sqrt(Math.max(0, 1 - 2 / (3 * x)));

  return { Rg, r_plus, r_ergo, r_ph, r_isco, T_H, eta, a };
}

function printBH(massSun, aStar) {
  if (massSun < 2.5)
    console.log(
      `\nNote: Mass < 2.5 M_Sun — more likely a neutron star or WD. ` +
        `Lightest confirmed BHs are ~5 M_Sun (GW detections).`,
    );

  const spin = aStar !== null && aStar !== undefined ? aStar : 0.0;
  const kr = kerrRadii(massSun, spin);

  const isSchw = spin < 0.001;
  const spinLabel = isSchw
    ? "0 (Schwarzschild, non-rotating)"
    : `${fmt(spin)} (Kerr, ${spin > 0.9 ? "near-extremal" : "rotating"})`;

  console.log(`\nEvolutionary phase:    Stellar remnant — Black Hole`);
  console.log(`Mass:                  ${fmt(massSun)} M_Sun`);
  console.log(`Spin parameter a*:     ${spinLabel}`);
  console.log(`Gravitational radius:  ${fmt(kr.Rg)} km  (R_g = GM/c²)`);
  console.log(`\n  -- Event Horizon --`);
  console.log(`Outer horizon r+:      ${fmt(kr.r_plus)} km`);
  console.log(`                       ${fmt(kr.r_plus / R_SUN_KM)} R_Sun`);
  if (!isSchw) {
    console.log(
      `  (Schwarzschild R_S = 2 R_g = ${fmt(2 * kr.Rg)} km for comparison)`,
    );
  }
  console.log(`\n  -- Other Key Radii --`);
  console.log(
    `Ergosphere (equatorial):${fmt(kr.r_ergo)} km  (= 2 R_g, spin-independent at equator)`,
  );
  console.log(`Photon sphere (prograde):${fmt(kr.r_ph)} km`);
  console.log(`ISCO (prograde):         ${fmt(kr.r_isco)} km`);
  console.log(`  (ISCO in R_g units:    ${fmt(kr.r_isco / kr.Rg)} R_g)`);
  console.log(`\n  -- Physical Properties --`);
  console.log(`Hawking temperature:   ${fmt(kr.T_H)} K`);
  console.log(
    `                       (Purely theoretical; stellar BHs are far too cold to detect)`,
  );
  console.log(`Accretion efficiency:  ${fmtPct(kr.eta * 100)}%`);
  console.log(
    `                       (Max energy extractable from accreting matter at ISCO)`,
  );
  console.log(
    `\nNote: Radii assume equatorial plane, prograde orbits, and Kerr metric (uncharged BH).`,
  );
  console.log(
    `      BHs have no surface — these are spacetime boundaries, not physical surfaces.`,
  );
  if (spin > 0.998)
    console.log(
      `\n!  Spin a* > 0.998 — approaching the Thorne (1974) spin limit for astrophysical BHs.`,
    );
}

// ============================================================
// ============================================================
//  BROWN DWARFS  (unchanged from v1 — Baraffe et al. 2003)
// ============================================================
// ============================================================

const BD_TEFF = {
  L: { TeffMax: 2200, TeffMin: 1300 },
  T: { TeffMax: 1300, TeffMin: 500 },
  Y: { TeffMax: 500, TeffMin: 250 },
};

function bdRadius(massJup, ageGyr) {
  const t = Math.max(0.001, ageGyr);
  const r = 0.1008 * Math.pow(massJup / 40, -0.055) * Math.pow(t, -0.0229);
  return Math.max(0.08, Math.min(0.13, r));
}
function bdRadiusToMass(radiusSun, ageGyr) {
  const t = Math.max(0.001, ageGyr);
  const rAdj = radiusSun / (0.1008 * Math.pow(t, -0.0229));
  return (
    40 *
    Math.exp(
      -Math.log(Math.max(0.08 / 0.1008, Math.min(0.13 / 0.1008, rAdj))) / 0.055,
    )
  );
}
function bdLuminosity(massJup, ageGyr) {
  return (
    3.959e-5 *
    Math.pow(massJup / 40, 3.082) *
    Math.pow(Math.max(0.001, ageGyr), -0.7659)
  );
}
function bdTeff(massJup, ageGyr) {
  return (
    843.35 *
    Math.pow(massJup / 40, 1.3601) *
    Math.pow(Math.max(0.001, ageGyr), -0.2183)
  );
}
function bdTeffToMass(teff, ageGyr) {
  return (
    40 *
    Math.pow(
      teff / (843.35 * Math.pow(Math.max(0.001, ageGyr), -0.2183)),
      1 / 1.3601,
    )
  );
}
function bdClassFromTeff(teff) {
  if (teff > 1300) return "L";
  if (teff > 500) return "T";
  return "Y";
}
function bdSubtypeFromTeff(teff) {
  const k = bdClassFromTeff(teff);
  const bc = BD_TEFF[k];
  const raw = ((bc.TeffMax - teff) / (bc.TeffMax - bc.TeffMin)) * 9;
  const c = Math.max(0, Math.min(9, raw));
  const r = Math.round(c * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function printBD(massJup, ageGyr) {
  const L = bdLuminosity(massJup, ageGyr);
  const R = bdRadius(massJup, ageGyr);
  const Teff_SB = calcTeff(L, R);
  const Teff_tr = bdTeff(massJup, ageGyr);
  const classKey = bdClassFromTeff(Teff_tr);
  const subtype = bdSubtypeFromTeff(Teff_tr);
  console.log(`\nObject type:           Brown dwarf`);
  console.log(`Spectral class:        ${classKey}${subtype}-type`);
  console.log(
    `Mass:                  ${fmt(massJup)} M_Jupiter  /  ${fmt(massJup * M_JUP_IN_MSUN)} M_Sun`,
  );
  console.log(`Age:                   ${fmt(ageGyr)} Gyr`);
  console.log(
    `Radius:                ${fmt(R)} R_Sun  /  ${fmt(R * R_SUN_KM)} km`,
  );
  printLumBlock(L, Teff);
  console.log(
    `T_eff (spectroscopic): ${fmtTeff(Teff_tr)} K  (Baraffe cooling track — used for classification)`,
  );
  console.log(
    `T_eff (blackbody):     ${fmtTeff(Teff_SB)} K  (Stefan-Boltzmann; higher due to non-blackbody BD atmospheres)`,
  );
  console.log(
    `Mean density:          ${fmt(calcDensity(massJup * M_JUP_IN_MSUN, R))} g/cm³`,
  );
  if (ageGyr < 0.1)
    console.log(
      `\nNote: Age < 0.1 Gyr — still contracting. Luminosity may be underestimated.`,
    );
  if (massJup < 5)
    console.log(
      `\nNote: Mass < 5 M_Jup — likely a super-Jupiter, not a true brown dwarf.`,
    );
  if (massJup > 80)
    console.log(
      `\nNote: Mass > 80 M_Jup — approaches hydrogen-burning limit. Consider M-type stellar model.`,
    );
  if (Teff_tr > 2200)
    console.log(
      `\nNote: T_eff > 2200 K — near M/L boundary; late M-type stellar model may be more appropriate.`,
    );
}

// ============================================================
// ============================================================
//  USER INTERFACE HELPERS
// ============================================================
// ============================================================

function ask(prompt, callback) {
  rl.question(prompt, callback);
}

function askRepeat() {
  ask("\nCalculate another object? (y/n): ", (a) => {
    if (a.trim().toLowerCase().startsWith("y")) mainMenu();
    else {
      console.log("Goodbye!");
      rl.close();
    }
  });
}

function askFloat(prompt, min, max, callback) {
  ask(prompt, (input) => {
    const v = parseFloat(input.trim());
    if (isNaN(v) || (min !== null && v < min) || (max !== null && v > max)) {
      console.log(
        `Invalid input — expected a number${min !== null ? ` ≥ ${min}` : ""}${max !== null ? ` ≤ ${max}` : ""}.`,
      );
      askFloat(prompt, min, max, callback);
    } else callback(v);
  });
}

// Ask optional age in Gyr; Enter to skip
function askAgeGyr(t_MS, callback) {
  const suffix = t_MS ? ` [MS lifetime: ${fmtLifetime(t_MS)}]` : "";
  ask(`Enter age in Gyr${suffix} [Enter to skip]: `, (input) => {
    if (input.trim() === "") return callback(null);
    const v = parseFloat(input.trim());
    if (isNaN(v) || v < 0) {
      console.log("Invalid age.");
      return callback(null);
    }
    if (t_MS && v >= t_MS) {
      console.log(
        `!  Age ${fmt(v)} Gyr ≥ MS lifetime ${fmtLifetime(t_MS)} — using ZAMS values.`,
      );
      return callback(null);
    }
    callback(v);
  });
}

// Ask required BD age
function askBDAge(callback) {
  askFloat(
    "Enter age in Gyr (required for brown dwarf luminosity): ",
    0.001,
    null,
    callback,
  );
}

// Ask spectral subtype x or x.x (1 dp max); Enter to skip
function askSubtype(classLabel, required, callback) {
  const suffix = required ? "" : " [Enter to skip]";
  ask(
    `Enter spectral subtype for ${classLabel}-type (0–9, ≤1 dp, e.g. 2 or 5.9)${suffix}: `,
    (input) => {
      const raw = input.trim();
      if (!required && raw === "") return callback(null);
      if (required && raw === "") {
        console.log("Subtype is required in this mode.");
        return askSubtype(classLabel, required, callback);
      }
      if (/\.\d{2,}/.test(raw)) {
        console.log("At most one decimal place allowed.");
        return askSubtype(classLabel, required, callback);
      }
      const v = parseFloat(raw);
      if (isNaN(v) || v < 0 || v > 9) {
        console.log("Must be 0–9.");
        return askSubtype(classLabel, required, callback);
      }
      const str = Number.isInteger(v) ? String(Math.round(v)) : v.toFixed(1);
      callback({ str, val: v });
    },
  );
}

// ============================================================
// ============================================================
//  TOP-LEVEL MENU
// ============================================================
// ============================================================

function mainMenu() {
  console.log(`
╔════════════════════════════════════════════╗
║  Stellar Parameter Calculator              ║
║  Choose evolutionary phase:                ║
╠════════════════════════════════════════════╣
║  1)  Pre-main sequence (T Tauri / HAeBe)   ║
║  2)  Main sequence (O through M)           ║
║  3)  Post-main sequence (SG/RGB/HB/AGB/RSG)║
║  4)  Wolf-Rayet                            ║
║  5)  White dwarf                           ║
║  6)  Neutron star                          ║
║  7)  Black hole                            ║
║  8)  Brown dwarf (L/T/Y)                   ║
╚════════════════════════════════════════════╝`);
  ask("\nEnter phase number: ", (input) => {
    const v = input.trim();
    switch (v) {
      case "1":
        return pmsMenu();
      case "2":
        return msMenu();
      case "3":
        return postMsMenu();
      case "4":
        return wrMenu();
      case "5":
        return wdMenu();
      case "6":
        return nsMenu();
      case "7":
        return bhMenu();
      case "8":
        return bdMenu();
      default:
        console.log("Invalid.");
        return mainMenu();
    }
  });
}

// ============================================================
//  PMS MENU
// ============================================================
function pmsMenu() {
  console.log("\n-- Pre-main sequence --");
  askFloat("Enter stellar mass (M_Sun, 0.08–50): ", 0.08, 50, (mass) => {
    askFloat("Enter age (Myr, 0.01–50): ", 0.01, 50, (ageMyr) => {
      printPMS(mass, ageMyr);
      askRepeat();
    });
  });
}

// ============================================================
//  MAIN SEQUENCE MENU
// ============================================================
function msMenu() {
  console.log("\n-- Main sequence --");
  console.log("Calculate from:");
  console.log("  1) Spectral type + age");
  console.log("  2) Mass + age");
  console.log("  3) Radius → mass (inverse)");
  ask("Enter input mode: ", (m) => {
    switch (m.trim()) {
      case "1":
        return msFromSpectralType();
      case "2":
        return msFromMass();
      case "3":
        return msFromRadius();
      default:
        console.log("Invalid.");
        return msMenu();
    }
  });
}

function msFromSpectralType() {
  console.log("\nSpectral class:");
  MS_CLASS_KEYS.forEach((k, i) => {
    const c = MS_CLASSES[k];
    console.log(
      `  ${i + 1}) ${c.label.padEnd(42)} [${c.Mmin}–${c.Mmax} M_Sun]`,
    );
  });
  ask("Enter class number: ", (input) => {
    const idx = parseInt(input.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= MS_CLASS_KEYS.length) {
      console.log("Invalid.");
      return msFromSpectralType();
    }
    const classKey = MS_CLASS_KEYS[idx];
    askSubtype(classKey, true, (sub) => {
      const zams = msLookup(classKey, sub.val);
      const mass = zams ? zams.M : subtypeImpliedMass(classKey, sub.val);
      console.log(`  ${classKey}${sub.str} implies mass: ${fmt(mass)} M_Sun`);
      const t_MS = mainSequenceLifetime(mass, zams ? zams.L : 1);
      askAgeGyr(t_MS, (age) => {
        printMS(classKey, sub.str, sub.val, mass, age);
        askRepeat();
      });
    });
  });
}

function msFromMass() {
  console.log("\nSpectral class:");
  MS_CLASS_KEYS.forEach((k, i) => {
    const c = MS_CLASSES[k];
    console.log(
      `  ${i + 1}) ${c.label.padEnd(42)} [${c.Mmin}–${c.Mmax} M_Sun]`,
    );
  });
  ask("Enter class number: ", (input) => {
    const idx = parseInt(input.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= MS_CLASS_KEYS.length) {
      console.log("Invalid.");
      return msFromMass();
    }
    const classKey = MS_CLASS_KEYS[idx];
    const sc = MS_CLASSES[classKey];
    askSubtype(classKey, false, (sub) => {
      const impliedMass = sub ? (msLookup(classKey, sub.val) || {}).M : null;
      const prompt = impliedMass
        ? `\nEnter mass (M_Sun) [${classKey}${sub.str} implies ${fmt(impliedMass)}, Enter to use]: `
        : `\nEnter mass (M_Sun) [typical ${classKey}: ${sc.Mmin}–${sc.Mmax}]: `;
      ask(prompt, (massInput) => {
        let mass;
        if (massInput.trim() === "" && impliedMass) {
          mass = impliedMass;
          console.log(`  Using ${fmt(mass)} M_Sun`);
        } else {
          mass = parseFloat(massInput.trim());
          if (isNaN(mass) || mass <= 0) {
            console.log("Invalid.");
            return msFromMass();
          }
          if (impliedMass) {
            const dev = Math.abs(mass - impliedMass) / impliedMass;
            if (dev > 0.1)
              console.log(
                `Note: ${fmt(mass)} M_Sun deviates ${fmtPct(dev * 100)}% from ${classKey}${sub.str}-implied ${fmt(impliedMass)} M_Sun.`,
              );
          }
        }
        // Auto subtype if not provided
        const autoSub =
          sub ||
          (() => {
            const s = massToSubtype(mass);
            return { str: s.subtypeStr, val: s.subtypeVal };
          })();
        const autoClass = sub ? classKey : massToClass(mass);
        const zams = msLookup(autoClass, autoSub.val);
        const t_MS = mainSequenceLifetime(mass, zams ? zams.L : 1);
        if (!sub)
          console.log(
            `  Calculated subtype: ${autoClass}${autoSub.str}  (from mass)`,
          );
        askAgeGyr(t_MS, (age) => {
          printMS(autoClass, autoSub.str, autoSub.val, mass, age);
          askRepeat();
        });
      });
    });
  });
}

function msFromRadius() {
  console.log("\nInverse mode: radius → mass");
  console.log("Spectral class (for cross-check):");
  MS_CLASS_KEYS.forEach((k, i) =>
    console.log(`  ${i + 1}) ${MS_CLASSES[k].label}`),
  );
  ask("Enter class: ", (input) => {
    const idx = parseInt(input.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= MS_CLASS_KEYS.length) {
      console.log("Invalid.");
      return msFromRadius();
    }
    const classKey = MS_CLASS_KEYS[idx];
    askSubtype(classKey, false, (sub) => {
      ask("\nRadius unit: 1) R_Sun  2) km\n: ", (u) => {
        const label = u.trim() === "2" ? "km" : "R_Sun";
        askFloat(`Enter radius in ${label}: `, 0, null, (rIn) => {
          const rSun = u.trim() === "2" ? rIn / R_SUN_KM : rIn;
          // Find MS entry closest by radius
          let best = MS_SEQUENCE[0],
            bestD = Math.abs(MS_SEQUENCE[0].R - rSun);
          for (const e of MS_SEQUENCE) {
            const d = Math.abs(e.R - rSun);
            if (d < bestD) {
              bestD = d;
              best = e;
            }
          }
          const mass = best.M;
          console.log(
            `  Nearest MS match: ${best.letter}${Number.isInteger(best.subtype) ? best.subtype : best.subtype.toFixed(1)}V  M = ${fmt(mass)} M_Sun`,
          );
          if (sub) {
            const implied = (msLookup(classKey, sub.val) || {}).M;
            if (implied) {
              const dev = Math.abs(mass - implied) / implied;
              if (dev > 0.1)
                console.log(
                  `Note: derived mass ${fmt(mass)} deviates ${fmtPct(dev * 100)}% from ${classKey}${sub.str}-implied ${fmt(implied)} M_Sun.`,
                );
            }
          }
          const zams = msLookup(best.letter, best.subtype);
          const t_MS = mainSequenceLifetime(mass, zams ? zams.L : 1);
          const autoS = massToSubtype(mass);
          askAgeGyr(t_MS, (age) => {
            printMS(
              best.letter,
              Number.isInteger(best.subtype)
                ? String(best.subtype)
                : best.subtype.toFixed(1),
              best.subtype,
              mass,
              age,
            );
            askRepeat();
          });
        });
      });
    });
  });
}

// ============================================================
//  POST-MS MENU
// ============================================================
function postMsMenu() {
  console.log("\n-- Post-main sequence --");
  console.log("Phase:");
  POST_MS_KEYS.forEach((k, i) => {
    const p = POST_MS_PHASES[k];
    console.log(
      `  ${i + 1}) ${p.label.padEnd(35)} [M: ${p.massMin}–${p.massMax} M_Sun]`,
    );
  });
  ask("Enter phase: ", (input) => {
    const idx = parseInt(input.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= POST_MS_KEYS.length) {
      console.log("Invalid.");
      return postMsMenu();
    }
    const phase = POST_MS_KEYS[idx];
    const p = POST_MS_PHASES[phase];
    askFloat(
      `Enter mass (M_Sun, typical ${p.massMin}–${p.massMax}): `,
      0.3,
      60,
      (mass) => {
        ask(
          `Enter metallicity [Fe/H] (e.g. 0.0 = solar, -1.0 = metal-poor, +0.3 = metal-rich) [Enter for solar]: `,
          (fehInput) => {
            const raw = fehInput.trim();
            const feh = raw === "" ? 0.0 : parseFloat(raw);
            if (raw !== "" && isNaN(feh)) {
              console.log("Invalid [Fe/H] — using solar (0.0).");
            }
            printPostMS(phase, mass, isNaN(feh) ? 0.0 : feh);
            askRepeat();
          },
        );
      },
    );
  });
}

// ============================================================
//  WOLF-RAYET MENU
// ============================================================
function wrMenu() {
  console.log("\n-- Wolf-Rayet --");
  WR_KEYS.forEach((k, i) => {
    const w = WR_SUBTYPES[k];
    console.log(`  ${i + 1}) ${k.padEnd(8)} ${w.desc}`);
    console.log(
      `         M: ${w.M_range[0]}–${w.M_range[1]} M_Sun  Teff: ${(w.Teff_range[0] / 1000).toFixed(0)}–${(w.Teff_range[1] / 1000).toFixed(0)} kK`,
    );
  });
  ask("Enter subtype number: ", (input) => {
    const idx = parseInt(input.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= WR_KEYS.length) {
      console.log("Invalid.");
      return wrMenu();
    }
    const key = WR_KEYS[idx];
    const w = WR_SUBTYPES[key];
    askFloat(
      `Enter mass (M_Sun, typical ${w.M_range[0]}–${w.M_range[1]}): `,
      1,
      100,
      (mass) => {
        printWR(key, mass);
        askRepeat();
      },
    );
  });
}

// ============================================================
//  WHITE DWARF MENU
// ============================================================
function wdMenu() {
  console.log("\n-- White dwarf --");
  console.log("Calculate from:");
  console.log("  1) Mass (→ radius)");
  console.log("  2) Radius (→ mass)");
  ask("Input mode: ", (m) => {
    if (m.trim() === "2") {
      ask("\nRadius unit: 1) R_Sun  2) km\n: ", (u) => {
        const label = u.trim() === "2" ? "km" : "R_Sun";
        askFloat(`Enter WD radius in ${label}: `, 0, null, (rIn) => {
          const rSun = u.trim() === "2" ? rIn / R_SUN_KM : rIn;
          const mass = wdRadiusToMass(rSun);
          console.log(`  Derived mass: ${fmt(mass)} M_Sun`);
          ask("Enter cooling age in Gyr [Enter to skip]: ", (ageIn) => {
            const age = ageIn.trim() === "" ? null : parseFloat(ageIn.trim());
            printWD(mass, isNaN(age) ? null : age);
            askRepeat();
          });
        });
      });
    } else {
      askFloat("Enter WD mass (M_Sun, 0.17–1.40): ", 0.01, 1.43, (mass) => {
        ask("Enter cooling age in Gyr [Enter to skip]: ", (ageIn) => {
          const age = ageIn.trim() === "" ? null : parseFloat(ageIn.trim());
          printWD(mass, isNaN(age) ? null : age);
          askRepeat();
        });
      });
    }
  });
}

// ============================================================
//  NEUTRON STAR MENU
// ============================================================
function nsMenu() {
  console.log("\n-- Neutron star --");
  askFloat("Enter NS mass (M_Sun, typical 1.1–2.35): ", 0.5, 3.5, (mass) => {
    ask(
      "Enter age (kyr, e.g. 0.33 = Cas A, 1 = Crab, 340 = Vela) [Enter to skip]: ",
      (ageInput) => {
        const raw = ageInput.trim();
        const age = raw === "" ? null : parseFloat(raw);
        if (raw !== "" && (isNaN(age) || age <= 0)) {
          console.log("Invalid age — skipping Teff calculation.");
          printNS(mass, null);
        } else {
          printNS(mass, age);
        }
        askRepeat();
      },
    );
  });
}

// ============================================================
//  BLACK HOLE MENU
// ============================================================
function bhMenu() {
  console.log("\n-- Black hole (stellar mass) --");
  askFloat("Enter BH mass (M_Sun, e.g. 5–100): ", 0.1, null, (mass) => {
    ask(
      "Enter spin parameter a* (0 = non-rotating, 1 = maximal spin) [Enter for 0]: ",
      (spinInput) => {
        const raw = spinInput.trim();
        const spin = raw === "" ? 0.0 : parseFloat(raw);
        if (raw !== "" && (isNaN(spin) || spin < 0 || spin > 1)) {
          console.log("Invalid spin — must be 0–1. Using 0.");
          printBH(mass, 0.0);
        } else {
          printBH(mass, isNaN(spin) ? 0.0 : spin);
        }
        askRepeat();
      },
    );
  });
}

// ============================================================
//  BROWN DWARF MENU
// ============================================================
function bdMenu() {
  console.log("\n-- Brown dwarf --");
  console.log("Calculate from:");
  console.log("  1) Mass and age");
  console.log("  2) Spectral type and age");
  console.log("  3) Radius and age (inverse)");
  ask("Input mode: ", (m) => {
    switch (m.trim()) {
      case "1":
        return bdFromMass();
      case "2":
        return bdFromSpectralType();
      case "3":
        return bdFromRadius();
      default:
        console.log("Invalid.");
        return bdMenu();
    }
  });
}

function bdFromMass() {
  askFloat(
    "Enter mass (M_Jupiter, L/T: ~13–80, Y: ~5–25): ",
    0.1,
    200,
    (mass) => {
      askBDAge((age) => {
        printBD(mass, age);
        askRepeat();
      });
    },
  );
}

function bdFromSpectralType() {
  console.log("\nSpectral class:");
  console.log("  1) L-type  (T_eff 1300–2200 K)");
  console.log("  2) T-type  (T_eff  500–1300 K)");
  console.log("  3) Y-type  (T_eff  250– 500 K)");
  ask("Enter class: ", (input) => {
    const classMap = { 1: "L", 2: "T", 3: "Y" };
    const bdKey = classMap[input.trim()];
    if (!bdKey) {
      console.log("Invalid.");
      return bdFromSpectralType();
    }
    const bc = BD_TEFF[bdKey];
    askSubtype(bdKey, true, (sub) => {
      const teff = bc.TeffMax - (sub.val / 9) * (bc.TeffMax - bc.TeffMin);
      console.log(`  ${bdKey}${sub.str} implies T_eff: ${fmtTeff(teff)} K`);
      askBDAge((age) => {
        const mass = bdTeffToMass(teff, age);
        console.log(`  Estimated mass: ${fmt(mass)} M_Jupiter`);
        if (mass < 5) console.log(`  Note: < 5 M_Jup — likely planetary.`);
        if (mass > 80)
          console.log(`  Note: > 80 M_Jup — near hydrogen-burning limit.`);
        printBD(mass, age);
        askRepeat();
      });
    });
  });
}

function bdFromRadius() {
  ask("\nRadius unit: 1) R_Sun  2) km\n: ", (u) => {
    const label = u.trim() === "2" ? "km" : "R_Sun";
    askFloat(`Enter BD radius in ${label}: `, 0, null, (rIn) => {
      const rSun = u.trim() === "2" ? rIn / R_SUN_KM : rIn;
      askBDAge((age) => {
        const mass = bdRadiusToMass(rSun, age);
        console.log(`  Derived mass: ${fmt(mass)} M_Jupiter`);
        printBD(mass, age);
        askRepeat();
      });
    });
  });
}

// ============================================================
mainMenu();
