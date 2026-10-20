// starEvolver.js
// Stellar evolver and devolver.
// Moves one star forward or backward along a single mass-dependent track:
//   pre-main sequence -> main sequence -> subgiant -> giant -> remnant -> black dwarf
//
// Physics reused from starRadius.js:
//   MS:   Pecaut & Mamajek (2022) table, BHAC15 low-mass table
//   PMS:  Hayashi/Henyey approximation (Baraffe et al. 2015, Palla & Stahler 1993)
//   WD:   Nauenberg (1972) mass-radius relation, Mestel cooling
//   NS:   NICER-anchored radius, Page et al. (2004) cooling
//   BH:   Schwarzschild radius and Hawking temperature
// Lifetimes reused from my Discord bot's starlifetime command (same table, same metallicity scaling).
//
// Sections:
//   1. Core evolver (the features you asked for)
//   2. Extras (features added on top, enabled with one y/n prompt)

"use strict";
const readline = require("readline");

// ============================================================
// CONSTANTS
// ============================================================
const R_SUN_KM = 695700;
const R_SUN_M = 6.957e8;
const M_SUN_KG = 1.9885e30;
const L_SUN = 3.828e26;
const SIGMA = 5.6704e-8;
const G = 6.674e-11;
const C = 2.998e8;
const HBAR = 1.0546e-34;
const K_B = 1.3806e-23;
const R_EARTH_KM = 6371;
const WD_R0 = 0.0112;
const WD_MCH = 1.44;
const BC_V_SUN = -0.072;
const EPS_GYR = 1e-6; // 1 kyr, the youngest cooling age for a fresh remnant
const BLACK_DWARF_TEFF = 5; // K, a remnant at or below this counts as black dwarf
const UNIVERSE_AGE_GYR = 13.8;

// ============================================================
// FORMATTERS
// ============================================================
function fmt(x) {
  if (!Number.isFinite(x)) return String(x);
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a < 1e-6 || a >= 1e15) return x.toExponential();
  return String(x);
}
function fmtAge(g) {
  return g < 0.1 && g > 0
    ? `${fmt(g)} Gyr (${fmt(g * 1000)} Myr)`
    : `${fmt(g)} Gyr`;
}
function fmtLifetime(gyr) {
  return gyr >= 1000 ? `${fmt(gyr / 1000)} Tyr` : `${fmt(gyr)} Gyr`;
}
function fmtPct(x) {
  return fmt(x);
}
function fmtTeff(x) {
  return fmt(x);
}
function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}
function logLerp(a, b, f) {
  return a * Math.pow(b / a, f);
}

// ============================================================
// SHARED PHYSICS
// ============================================================
function calcTeff(lum, rad) {
  return Math.pow(
    (lum * L_SUN) / (4 * Math.PI * Math.pow(rad * R_SUN_M, 2) * SIGMA),
    0.25,
  );
}
// Inverse of calcTeff, used to build keyframes from a chosen temperature
function radiusFrom(lum, teff) {
  return (
    Math.sqrt((lum * L_SUN) / (4 * Math.PI * SIGMA * Math.pow(teff, 4))) /
    R_SUN_M
  );
}
function calcDensity(massSun, radiusSun) {
  const massG = massSun * M_SUN_KG * 1e3;
  const radCm = radiusSun * R_SUN_KM * 1e5;
  return massG / ((4 / 3) * Math.PI * Math.pow(radCm, 3));
}
function calcMbol(lum) {
  return 4.74 - 2.5 * Math.log10(lum);
}
// Torres (2010) BC_V polynomials, valid 2900-52000 K
function calcBCV(teff) {
  const lt = Math.log10(teff);
  if (lt < 3.7) {
    return (
      -0.190537291496456e5 +
      0.155144866764412e5 * lt -
      0.421278819301717e4 * lt * lt +
      0.381476328422343e3 * lt ** 3
    );
  }
  if (lt <= 3.9) {
    return (
      -0.370510203809015e5 +
      0.385672629965804e5 * lt -
      0.150651486316025e5 * lt ** 2 +
      0.261724637119416e4 * lt ** 3 -
      0.170623810323864e3 * lt ** 4
    );
  }
  return (
    -0.118115450538963e6 +
    0.137145973583929e6 * lt -
    0.636233812100225e5 * lt ** 2 +
    0.147412923562646e5 * lt ** 3 -
    0.170587278406872e4 * lt ** 4 +
    0.78873172180499e2 * lt ** 5
  );
}
// Returns null outside the BC_V range, where the polynomial gives nonsense
function visLum(lum, teff) {
  if (teff === null || teff === undefined || teff < 2900 || teff > 52000)
    return null;
  return lum * Math.pow(10, (calcBCV(teff) - BC_V_SUN) / 2.5);
}
function printLumBlock(lum, teff) {
  const lv = visLum(lum, teff);
  console.log(
    `Lum (L_Sun):           ${lv === null ? "n/a (T_eff outside the BC_V range)" : fmt(lv)}`,
  );
  console.log(`LumBol (L_Sun):        ${fmt(lum)}`);
  console.log(`Abs. bol. magnitude:   ${fmt(calcMbol(lum))}`);
}

// ============================================================
// MAIN SEQUENCE TABLE: [Teff, logL, R_Sun, M_Sun]  (Pecaut & Mamajek 2022)
// ============================================================
const MS_TABLE = {
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

// Baraffe et al. (2015) near the hydrogen-burning limit: [M, Teff, logL, R]
const BHAC15_LOW_MASS = [
  [0.075, 2650, -4.27, 0.09],
  [0.08, 2750, -4.0, 0.096],
  [0.085, 2820, -3.82, 0.101],
  [0.09, 2900, -3.63, 0.107],
  [0.1, 3000, -3.42, 0.117],
  [0.11, 3100, -3.22, 0.128],
  [0.12, 3190, -3.05, 0.138],
  [0.13, 3270, -2.9, 0.148],
  [0.15, 3380, -2.66, 0.165],
];

const MS_ROWS = Object.keys(MS_TABLE).map((key) => {
  const [Teff, logL, R, M] = MS_TABLE[key];
  return {
    key,
    letter: key[0],
    subtype: parseFloat(key.slice(1)),
    Teff,
    L: Math.pow(10, logL),
    R,
    M,
  };
});
const MS_BY_TEFF = [...MS_ROWS].sort((a, b) => b.Teff - a.Teff);
// Rows below 0.15 M_Sun are out of order in mass, so BHAC15 covers that range instead
const MS_BY_MASS = MS_ROWS.filter((r) => r.M >= 0.15).sort((a, b) => a.M - b.M);

function bhac15Lookup(m) {
  const t = BHAC15_LOW_MASS;
  const mm = clamp(m, t[0][0], t[t.length - 1][0]);
  let lo = t[0];
  let hi = t[t.length - 1];
  for (let i = 0; i < t.length - 1; i++) {
    if (t[i][0] <= mm && t[i + 1][0] >= mm) {
      lo = t[i];
      hi = t[i + 1];
      break;
    }
  }
  const f = hi[0] === lo[0] ? 0 : (mm - lo[0]) / (hi[0] - lo[0]);
  return {
    Teff: lo[1] + f * (hi[1] - lo[1]),
    L: Math.pow(10, lo[2] + f * (hi[2] - lo[2])),
    R: lo[3] + f * (hi[3] - lo[3]),
    M: m,
  };
}

// ------------------------------------------------------------
// SMOOTH ZAMS RELATIONS (same method as starRadius.js)
// Reading the nearest table row makes L, R and T_eff jump in steps, so a 0.852 M_Sun star
// could out-live a 0.84 M_Sun star. Here the table is sorted by mass, forced to rise with
// mass (pool-adjacent-violators, which removes the small zigzags in the A-type masses,
// with L rising at least as fast as M^1.5) and interpolated in log mass. The BHAC15 value
// at 0.15 M_Sun joins the low-mass end. Above the table L rises as M^1.1 and R as M^0.55.
// ------------------------------------------------------------
function isotonicIncreasing(y) {
  const blocks = [];
  for (const v of y) {
    blocks.push({ sum: v, n: 1 });
    while (blocks.length > 1) {
      const b2 = blocks[blocks.length - 1];
      const a2 = blocks[blocks.length - 2];
      if (a2.sum / a2.n <= b2.sum / b2.n) break;
      blocks.pop();
      a2.sum += b2.sum;
      a2.n += b2.n;
    }
  }
  const out = [];
  for (const b2 of blocks)
    for (let i = 0; i < b2.n; i++) out.push(b2.sum / b2.n);
  return out;
}

const MS_SMOOTH = (() => {
  const rows = MS_BY_MASS.filter((e) => e.M > 0.15).map((e) => ({
    M: e.M,
    logL: Math.log10(e.L),
    logR: Math.log10(e.R),
    Teff: e.Teff,
  }));
  const bh = bhac15Lookup(0.15);
  rows.push({
    M: 0.15,
    logL: Math.log10(bh.L),
    logR: Math.log10(bh.R),
    Teff: bh.Teff,
  });
  rows.sort((x, y) => x.M - y.M);
  // L must rise at least as fast as M^1.5, so t = M/L can only fall as mass rises
  const logL = isotonicIncreasing(
    rows.map((r) => r.logL - 1.5 * Math.log10(r.M)),
  ).map((v, i) => v + 1.5 * Math.log10(rows[i].M));
  const logR = isotonicIncreasing(rows.map((r) => r.logR));
  // The BHAC15 node (lowest mass) keeps its own model-atmosphere T_eff
  const Teff = [
    rows[0].Teff,
    ...isotonicIncreasing(rows.slice(1).map((r) => r.Teff)),
  ];
  return rows.map((r, i) => ({
    M: r.M,
    logL: logL[i],
    logR: logR[i],
    Teff: Teff[i],
  }));
})();

// ZAMS { Teff, L, R, M } for any mass
function zamsFromMass(m) {
  if (m <= 0.15) return bhac15Lookup(Math.max(0.075, m));
  const t = MS_SMOOTH;
  const last = t[t.length - 1];
  if (m >= last.M) {
    const ratio = m / last.M;
    const L = Math.pow(10, last.logL) * Math.pow(ratio, 1.1);
    const R = Math.pow(10, last.logR) * Math.pow(ratio, 0.55);
    return { Teff: calcTeff(L, R), L, R, M: m };
  }
  for (let i = 0; i < t.length - 1; i++) {
    const lo = t[i];
    const hi = t[i + 1];
    if (m >= lo.M && m <= hi.M) {
      const f = hi.M === lo.M ? 0 : Math.log(m / lo.M) / Math.log(hi.M / lo.M);
      return {
        Teff: lo.Teff + f * (hi.Teff - lo.Teff),
        L: Math.pow(10, lo.logL + f * (hi.logL - lo.logL)),
        R: Math.pow(10, lo.logR + f * (hi.logR - lo.logR)),
        M: m,
      };
    }
  }
  return {
    Teff: last.Teff,
    L: Math.pow(10, last.logL),
    R: Math.pow(10, last.logR),
    M: m,
  };
}

// ZAMS shift for [Fe/H] (same relations as starRadius.js). At fixed mass a metal-rich star
// is fainter, a little smaller and cooler. Slopes from Tout et al. (1996) and Girardi et al.
// (2000): dlogL = -0.18 [Fe/H], dlogR = -0.03 [Fe/H], dlogT = dlogL/4 - dlogR/2.
// The effect fades for massive stars (full strength up to 2 M_Sun, 20% at 20 M_Sun and above).
// With [Fe/H] = 0 every factor is exactly 1, so solar results do not change.
function applyMetallicity(z, m, feh) {
  if (!feh) return z;
  const w = m <= 2 ? 1 : m >= 20 ? 0.2 : 1 - (0.8 * (m - 2)) / 18;
  const dLogL = -0.18 * feh * w;
  const dLogR = -0.03 * feh * w;
  const dLogT = 0.25 * dLogL - 0.5 * dLogR;
  return {
    Teff: z.Teff * Math.pow(10, dLogT),
    L: z.L * Math.pow(10, dLogL),
    R: z.R * Math.pow(10, dLogR),
    M: z.M,
  };
}

// Mass whose ZAMS T_eff matches teff. Scans log mass, then bisects inside the best bracket.
function massFromTeff(teff, feh = 0) {
  const lo = 0.16;
  const hi = 120;
  const n = 4000;
  const step = Math.pow(hi / lo, 1 / n);
  let bestI = 0;
  let bestErr = Infinity;
  for (let i = 0; i <= n; i++) {
    const mm = lo * Math.pow(step, i);
    const err = Math.abs(
      Math.log(applyMetallicity(zamsFromMass(mm), mm, feh).Teff / teff),
    );
    if (err < bestErr) {
      bestErr = err;
      bestI = i;
    }
  }
  let a = lo * Math.pow(step, Math.max(0, bestI - 1));
  let b = lo * Math.pow(step, Math.min(n, bestI + 1));
  const teffAt = (mm) => applyMetallicity(zamsFromMass(mm), mm, feh).Teff;
  const ta = teffAt(a) - teff;
  const tb = teffAt(b) - teff;
  if (ta * tb > 0) return lo * Math.pow(step, bestI);
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(a * b);
    if ((teffAt(mid) - teff) * ta > 0) a = mid;
    else b = mid;
  }
  return Math.sqrt(a * b);
}

// Table row for a spectral type such as G 2.5, interpolated inside the letter class
function msByType(letter, sub) {
  const rows = MS_ROWS.filter((r) => r.letter === letter).sort(
    (a, b) => a.subtype - b.subtype,
  );
  if (rows.length === 0) return null;
  if (sub <= rows[0].subtype) return rows[0];
  const last = rows[rows.length - 1];
  if (sub >= last.subtype) return last;
  for (let i = 0; i < rows.length - 1; i++) {
    const lo = rows[i];
    const hi = rows[i + 1];
    if (sub >= lo.subtype && sub <= hi.subtype) {
      const f = (sub - lo.subtype) / (hi.subtype - lo.subtype);
      return {
        Teff: lo.Teff + f * (hi.Teff - lo.Teff),
        L: lo.L + f * (hi.L - lo.L),
        R: lo.R + f * (hi.R - lo.R),
        M: lo.M + f * (hi.M - lo.M),
      };
    }
  }
  return last;
}

function specFromTeff(teff) {
  let best = MS_BY_TEFF[0];
  for (const e of MS_BY_TEFF) {
    if (Math.abs(e.Teff - teff) < Math.abs(best.Teff - teff)) best = e;
  }
  return `${best.letter}${Number.isInteger(best.subtype) ? best.subtype : String(best.subtype)}`;
}

// ============================================================
// LIFETIMES (same table and scaling as my Discord bot's starlifetime command)
// ============================================================
const STELLAR_MODELS = [
  { mass: 0.08, baseLifetime: 12000.0, sensitivity: 0.05 },
  { mass: 0.1, baseLifetime: 6000.0, sensitivity: 0.08 },
  { mass: 0.25, baseLifetime: 1000.0, sensitivity: 0.12 },
  { mass: 0.4, baseLifetime: 200.0, sensitivity: 0.15 },
  { mass: 0.6, baseLifetime: 45.0, sensitivity: 0.18 },
  { mass: 0.8, baseLifetime: 18.2, sensitivity: 0.2 },
  { mass: 1.0, baseLifetime: 10.0, sensitivity: 0.22 },
  { mass: 1.2, baseLifetime: 5.5, sensitivity: 0.25 },
  { mass: 1.5, baseLifetime: 2.7, sensitivity: 0.28 },
  { mass: 2.0, baseLifetime: 1.2, sensitivity: 0.32 },
  { mass: 3.0, baseLifetime: 0.35, sensitivity: 0.35 },
  { mass: 5.0, baseLifetime: 0.095, sensitivity: 0.38 },
  { mass: 9.0, baseLifetime: 0.031, sensitivity: 0.4 },
  { mass: 15.0, baseLifetime: 0.014, sensitivity: 0.42 },
  { mass: 25.0, baseLifetime: 0.0075, sensitivity: 0.45 },
  { mass: 60.0, baseLifetime: 0.0041, sensitivity: 0.48 },
  { mass: 120.0, baseLifetime: 0.0028, sensitivity: 0.5 },
];

function interpolate(x, x1, x2, y1, y2) {
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

// Metallicity sensitivity from my Discord bot's starlifetime command table (interpolated in mass)
function lifetimeSensitivity(m) {
  const t = STELLAR_MODELS;
  if (m <= t[0].mass) return t[0].sensitivity;
  if (m >= t[t.length - 1].mass) return t[t.length - 1].sensitivity;
  for (let i = 0; i < t.length - 1; i++) {
    if (m >= t[i].mass && m <= t[i + 1].mass) {
      return interpolate(
        m,
        t[i].mass,
        t[i + 1].mass,
        t[i].sensitivity,
        t[i + 1].sensitivity,
      );
    }
  }
  return t[t.length - 1].sensitivity;
}

// Set to false to ignore [Fe/H] in lifetimes, which matches starRadius.js exactly
const LIFETIME_USES_METALLICITY = true;

// Main-sequence lifetime in Gyr. The base value uses the same formula as starRadius.js:
// fuel over burn rate (M/L x 10 Gyr) up to 1.5 M_Sun, three fitted power laws from 2 M_Sun,
// and a log-space smoothstep blend between 1.5 and 2 M_Sun so lifetime always falls with mass.
// L comes from the smooth ZAMS relation, not the nearest table row.
// The [Fe/H] scaling comes from my Discord bot's starlifetime command.
function msLifetimeGyr(m, feh) {
  let base;
  if (m >= 20) base = 0.116047 * Math.pow(m, -0.8928);
  else if (m >= 8) base = 1.088337 * Math.pow(m, -1.64);
  else if (m >= 2) base = 6.507601 * Math.pow(m, -2.5);
  else {
    // Smooth ZAMS luminosity, so a heavier star never lives longer than a lighter one
    const tFuel = (m / zamsFromMass(m).L) * 10;
    if (m <= 1.5) base = tFuel;
    else {
      // 1.5 to 2 M_Sun: mix toward the A-type power law so there is no jump at 2 M_Sun
      const x = (m - 1.5) / 0.5;
      const w = x * x * (3 - 2 * x);
      const tPower = 6.507601 * Math.pow(m, -2.5);
      base = Math.exp((1 - w) * Math.log(tFuel) + w * Math.log(tPower));
    }
  }
  return LIFETIME_USES_METALLICITY
    ? base * Math.pow(10, lifetimeSensitivity(m) * feh)
    : base;
}

// ============================================================
// PRE-MAIN SEQUENCE (Hayashi to Henyey approximation from starRadius.js)
// ============================================================
function pmsKHMyr(m, rz, lz) {
  return ((m * m) / (rz * lz)) * 15;
}
function pmsHayashiTeff(m) {
  if (m < 0.1) return 3000;
  if (m < 0.5) return 3000 + ((m - 0.1) / 0.4) * 1000;
  if (m < 1.0) return 4000 + ((m - 0.5) / 0.5) * 500;
  if (m < 2.0) return 4500 + ((m - 1.0) / 1.0) * 500;
  if (m < 4.0) return 5000 + ((m - 2.0) / 2.0) * 1500;
  return 7000;
}
function pmsRadius(m, rz, lz, ageMyr) {
  const tKH = pmsKHMyr(m, rz, lz);
  if (ageMyr >= tKH) return rz;
  const rBirth = Math.max(2.5 * rz, rz * Math.pow(tKH / 0.1, 0.35));
  const rHay = rBirth * Math.pow(ageMyr / 0.1, -0.35);
  const tHen = 0.3 * tKH;
  if (ageMyr < tHen) return Math.max(rz, rHay);
  const blend = (ageMyr - tHen) / (tKH - tHen);
  return rz + (1 - blend) * (Math.max(rz, rHay) - rz);
}
function pmsLuminosity(m, rz, lz, ageMyr) {
  const r = pmsRadius(m, rz, lz, ageMyr);
  const tHay = pmsHayashiTeff(m);
  const tKH = pmsKHMyr(m, rz, lz);
  const tHen = 0.3 * tKH;
  let teff = tHay;
  if (ageMyr >= tHen) {
    const blend = (ageMyr - tHen) / (tKH - tHen);
    teff = tHay + blend * (calcTeff(lz, rz) - tHay);
  }
  return (
    (4 * Math.PI * Math.pow(r * R_SUN_M, 2) * SIGMA * Math.pow(teff, 4)) / L_SUN
  );
}

// ============================================================
// WOLF-RAYET (Crowther 2007), used as the giant stage above 30 M_Sun
// ============================================================
const WR_TYPES = {
  "WN5-6": { M: [15, 30], R: [1.5, 6.0], L: [1e5, 5e5] },
  "WN7-8": { M: [15, 40], R: [3.0, 15.0], L: [2e5, 1e6] },
  "WN9-11": { M: [20, 80], R: [10.0, 30.0], L: [3e5, 1e6] },
};
function wrEstimate(m) {
  const key = m < 45 ? "WN5-6" : m < 60 ? "WN7-8" : "WN9-11";
  const w = WR_TYPES[key];
  const f = clamp((m - w.M[0]) / (w.M[1] - w.M[0]), 0, 1);
  return {
    key,
    R: w.R[0] + f * (w.R[1] - w.R[0]),
    L: logLerp(w.L[0], w.L[1], f),
  };
}

// ============================================================
// REMNANT PHYSICS
// ============================================================
function wdRadius(m) {
  if (m >= WD_MCH) return 0;
  const x = WD_MCH / m;
  return WD_R0 * Math.sqrt(Math.pow(x, 2 / 3) - Math.pow(1 / x, 2 / 3));
}
function wdLuminosity(m, coolGyr) {
  return (
    0.0012 * Math.pow(m / 0.6, 0.7) * Math.pow(Math.max(0.001, coolGyr), -7 / 5)
  );
}
function wdHint(teff, isBD) {
  if (isBD) return "Black dwarf (cold, no longer visible)";
  if (teff > 75000) return "DO/DAO type (very hot)";
  if (teff > 45000) return "DO type (hot, helium atmosphere)";
  if (teff > 12000) return "DA or DB type";
  if (teff > 5000) return "DC or DQ type";
  return "Cold DC or DZ type";
}
function nsRadius(m) {
  if (m <= 1.4) return Math.max(10.5, 12.33 + 0.1 * (1.4 - m));
  if (m <= 1.8) return Math.max(10.5, 12.33 - 0.15 * (m - 1.4));
  return Math.max(10.5, 12.27 - 0.1 * (m - 1.8));
}
function nsTeff(ageKyr) {
  const tSwitch = 100;
  if (ageKyr < tSwitch) return 1.0e6 * Math.pow(ageKyr, -0.47);
  return 1.0e6 * Math.pow(tSwitch, -0.47) * Math.pow(ageKyr / tSwitch, -0.23);
}
function nsClass(teff, ageKyr) {
  if (ageKyr < 1 && teff > 3e6) return "Central compact object candidate";
  if (ageKyr < 10 && teff > 1e6) return "Young cooling neutron star or pulsar";
  if (ageKyr < 2000 && teff > 5e5) return "X-ray dim isolated neutron star";
  if (teff > 1e5)
    return "Old isolated neutron star (faint thermal X-ray emitter)";
  return "Cold neutron star (radio pulsar at best)";
}
function bhRadiusKm(m) {
  return (2 * G * m * M_SUN_KG) / (C * C) / 1000;
}
function bhHawkingK(m) {
  return (HBAR * C * C * C) / (8 * Math.PI * G * m * M_SUN_KG * K_B);
}

// Initial-final mass relation from my Discord bot's starlifetime command, capped so a WD stays below Chandrasekhar
function wdMassFromProgenitor(m) {
  return Math.min(0.489 + 0.096 * m, 0.9 * m, WD_MCH - 0.09);
}
function remLabel(kind, mp) {
  if (kind === "WD")
    return mp < 0.5
      ? "Helium white dwarf"
      : mp < 8
        ? "Carbon-oxygen white dwarf"
        : "Oxygen-neon white dwarf";
  if (kind === "NS") return "Neutron star";
  return "Stellar-mass black hole";
}
function remnantFor(m) {
  if (m < 11)
    return {
      kind: "WD",
      mass: wdMassFromProgenitor(m),
      sub: remLabel("WD", m),
    };
  if (m < 30)
    return { kind: "NS", mass: 1.2 + 0.04 * m, sub: remLabel("NS", m) };
  return { kind: "BH", mass: 0.33 * m, sub: remLabel("BH", m) };
}
// Progenitor mass implied by a remnant mass, clamped to the range that makes this kind
function progenitorFor(kind, mass) {
  if (kind === "WD")
    return clamp(Math.max(mass / 0.9, (mass - 0.489) / 0.096), 0.3, 10.9);
  if (kind === "NS") return clamp((mass - 1.2) / 0.04, 11, 29.9);
  return clamp(mass / 0.33, 30, 120);
}
// Cooling time from birth of the remnant until T_eff reaches the black dwarf limit
function blackDwarfCoolGyr(rem) {
  if (rem.kind === "WD") {
    const t1 = calcTeff(wdLuminosity(rem.mass, 1), wdRadius(rem.mass));
    return Math.pow(t1 / BLACK_DWARF_TEFF, 1 / 0.35);
  }
  if (rem.kind === "NS") {
    const tSw = nsTeff(100);
    return (100 * Math.pow(tSw / BLACK_DWARF_TEFF, 1 / 0.23)) / 1e6;
  }
  return null;
}

// ============================================================
// 1. CORE EVOLVER
// ============================================================
const STAGE_ORDER = ["PMS", "MS", "SG", "GIANT", "REM", "BD"];

// Builds the whole life track for one zero-age mass and metallicity.
// Every stage boundary is an age in Gyr, so evolving and devolving are the same lookup.
// Red supergiant luminosity vs initial mass (solar metallicity, 8-40 Msun).
// Columns: initial mass, log L at start of the RSG phase, log L at end of evolution.
// End values: Smartt (2015) pre-SN table and the Davies and Beasor (2018) fit.
// Start values: time-averaged RSG fit of POSYDON/MESA (L = 214.9 M^2.26) minus 0.05 dex.
// The start column is the least calibrated part. Published tracks print no start values.
const RSG_TABLE = [
  [8, 4.3, 4.44],
  [9, 4.44, 4.55],
  [10, 4.6, 4.68],
  [12, 4.72, 4.82],
  [14, 4.86, 4.97],
  [15, 4.94, 5.03],
  [16, 5.02, 5.1],
  [20, 5.22, 5.3],
  [25, 5.44, 5.5],
  [30, 5.58, 5.65],
  [40, 5.8, 5.9],
];
// which: 0 = start of RSG phase, 1 = end of evolution. Returns L in Lsun.
function rsgLuminosity(m, which) {
  const col = which + 1;
  const t = RSG_TABLE;
  const last = t.length - 1;
  let lg;
  if (m <= t[0][0]) lg = t[0][col] + 2 * Math.log10(m / t[0][0]);
  else if (m >= t[last][0]) lg = Math.min(5.9, t[last][col]);
  else {
    let i = 0;
    while (m > t[i + 1][0]) i++;
    const w = Math.log(m / t[i][0]) / Math.log(t[i + 1][0] / t[i][0]);
    lg = t[i][col] + w * (t[i + 1][col] - t[i][col]);
  }
  return Math.pow(10, lg);
}

function buildTimeline(m, feh, remOverride) {
  const z = applyMetallicity(zamsFromMass(m), m, feh);
  const tPms = pmsKHMyr(m, z.R, z.L) / 1000;
  const tMs = msLifetimeGyr(m, feh);
  const post = m >= 0.4; // below this, stars skip the subgiant and giant stages
  const big = m >= 8;
  const tSg = post ? tMs * (big ? 0.02 : 0.12) : 0;
  const tGi = post ? tMs * 0.1 * Math.pow(m, -0.2) : 0;
  const rem = remOverride || remnantFor(m);
  const start = {
    PMS: 0,
    MS: tPms,
    SG: tPms + tMs,
    GIANT: tPms + tMs + tSg,
    REM: tPms + tMs + tSg + tGi,
  };
  const small = m < 0.35;
  const tams = { R: z.R * (small ? 0.95 : 1.1), L: z.L * (small ? 0.85 : 1.4) };
  let base = null;
  let tip = null;
  let gk = null;
  let lossFrac = 0;
  if (post) {
    if (big) {
      const bsgTeff = m >= 30 ? 20000 : 8000;
      // RSGs take track-table luminosities, WR progenitors keep the old scaling
      const lb = m >= 30 ? tams.L * 1.1 : rsgLuminosity(m, 0);
      base = { L: lb, R: radiusFrom(lb, bsgTeff) };
      if (m >= 30) {
        const w = wrEstimate(m);
        tip = { L: w.L, R: w.R, label: w.key };
        gk = "WR";
        lossFrac = 0.7;
      } else {
        const lt = rsgLuminosity(m, 1);
        tip = { L: lt, R: radiusFrom(lt, 3600) };
        gk = "RSG";
        lossFrac = 0.3;
      }
    } else {
      // Metal-rich giants run cooler, so the base temperature falls with [Fe/H]
      const tb = clamp((m < 2 ? 4800 : 4500) - 150 * feh, 4000, 5500);
      const lb = tams.L * 1.75;
      base = { L: lb, R: radiusFrom(lb, tb) };
      const core = 0.489 + 0.096 * m;
      const lt = Math.max(2000, 5.925e4 * (core - 0.495), lb * 1.2);
      tip = { L: lt, R: radiusFrom(lt, 3200) };
      gk = "RGB";
      lossFrac = 0.9;
    }
  }
  return {
    m,
    feh,
    z,
    post,
    big,
    small,
    gk,
    lossFrac,
    rem,
    tams,
    base,
    tip,
    t: { start, tPms, tMs, tSg, tGi },
    tBD: blackDwarfCoolGyr(rem),
  };
}

function availableStages(tl) {
  const out = ["PMS", "MS"];
  if (tl.post) out.push("SG", "GIANT");
  out.push("REM");
  if (tl.tBD !== null) out.push("BD");
  return out;
}

// [from, to) in Gyr
function stageRange(tl, stage) {
  const s = tl.t.start;
  const bd = tl.tBD === null ? Infinity : s.REM + tl.tBD;
  switch (stage) {
    case "PMS":
      return [s.PMS, s.MS];
    case "MS":
      return [s.MS, s.SG];
    case "SG":
      return [s.SG, s.GIANT];
    case "GIANT":
      return [s.GIANT, s.REM];
    case "REM":
      return [s.REM, bd];
    default:
      return [bd, Infinity];
  }
}

// Colour word for a supergiant, using the same T_eff bands as starRadius.js
function sgColour(teff) {
  if (teff < 3900) return "red";
  if (teff < 5300) return "orange";
  if (teff < 6500) return "yellow";
  if (teff < 10000) return "white";
  if (teff < 30000) return "blue-white";
  return "blue";
}

// teff is optional. With it, a supergiant gets its true colour. Without it, the label shows the stage endpoint.
function stageName(tl, key, teff) {
  switch (key) {
    case "PMS":
      return tl.m < 2
        ? "Pre-main sequence (T Tauri star)"
        : tl.m < 8
          ? "Pre-main sequence (Herbig Ae/Be star)"
          : "Pre-main sequence (massive)";
    case "MS":
      return "Main sequence";
    case "SG":
      return tl.big ? "Subgiant (Hertzsprung-gap supergiant)" : "Subgiant";
    case "GIANT":
      return tl.gk === "WR"
        ? "Giant (Wolf-Rayet star)"
        : tl.gk === "RSG"
          ? `Giant (${teff === undefined ? "red" : sgColour(teff)} supergiant)`
          : "Giant (red giant to AGB)";
    case "REM":
      return `Stellar remnant (${tl.rem.sub})`;
    default:
      return tl.rem.kind === "WD"
        ? "Black dwarf (cooled white dwarf)"
        : "Black dwarf (fully cooled neutron star)";
  }
}

// Physical state of the star at one age. massLoss only changes the giant stage.
function stateAt(tl, age, massLoss) {
  const { m, z, t } = tl;
  const s = { age, mass: m, isBH: false };
  if (age < t.start.MS) {
    const myr = Math.max(0.01, age * 1000);
    const atZams = myr >= t.start.MS * 1000;
    s.stage = "PMS";
    s.R = atZams ? z.R : pmsRadius(m, z.R, z.L, myr);
    s.L = atZams ? z.L : pmsLuminosity(m, z.R, z.L, myr);
    s.Teff = calcTeff(s.L, s.R);
    s.spec = `${specFromTeff(s.Teff)} (pre-main sequence)`;
    s.progress = age / t.start.MS;
  } else if (age < t.start.SG) {
    const f = clamp((age - t.start.MS) / t.tMs, 0, 1);
    s.stage = "MS";
    s.L = z.L * (tl.small ? 1 - 0.15 * f : 1 + 0.4 * f);
    s.R = z.R * (tl.small ? 1 - 0.05 * f : 1 + 0.1 * f);
    s.Teff = m <= 0.15 ? z.Teff : calcTeff(s.L, s.R);
    s.spec = `${specFromTeff(s.Teff)}V`;
    s.progress = f;
  } else if (age < t.start.GIANT) {
    const f = (age - t.start.SG) / t.tSg;
    s.stage = "SG";
    s.R = logLerp(tl.tams.R, tl.base.R, f);
    s.L = logLerp(tl.tams.L, tl.base.L, f);
    s.Teff = calcTeff(s.L, s.R);
    s.spec = `${specFromTeff(s.Teff)} ${tl.big ? "Ib" : "IV"}`;
    s.progress = f;
  } else if (age < t.start.REM) {
    const f = (age - t.start.GIANT) / t.tGi;
    // Red giants brighten late, supergiants and WR stars change more evenly
    const g = tl.gk === "RGB" ? f * f : f;
    s.stage = "GIANT";
    s.R = logLerp(tl.base.R, tl.tip.R, g);
    s.L = logLerp(tl.base.L, tl.tip.L, g);
    s.Teff = calcTeff(s.L, s.R);
    if (tl.gk === "WR") s.spec = `${tl.tip.label} (Wolf-Rayet)`;
    else s.spec = `${specFromTeff(s.Teff)} ${tl.gk === "RSG" ? "Iab" : "III"}`;
    if (massLoss) s.mass = m - tl.lossFrac * (m - tl.rem.mass) * f;
    s.progress = f;
  } else {
    const rem = tl.rem;
    const cool = Math.max(EPS_GYR, age - t.start.REM);
    const isBD = tl.tBD !== null && cool >= tl.tBD * (1 - 1e-9);
    s.stage = isBD ? "BD" : "REM";
    s.mass = rem.mass;
    s.cool = cool;
    if (rem.kind === "WD") {
      s.R = wdRadius(rem.mass);
      s.L = wdLuminosity(rem.mass, cool);
      s.Teff = calcTeff(s.L, s.R);
      s.spec = wdHint(s.Teff, isBD);
    } else if (rem.kind === "NS") {
      const km = nsRadius(rem.mass);
      s.R = km / R_SUN_KM;
      s.Teff = nsTeff(cool * 1e6);
      s.L =
        (4 * Math.PI * Math.pow(km * 1000, 2) * SIGMA * Math.pow(s.Teff, 4)) /
        L_SUN;
      s.spec = isBD
        ? "Black dwarf (cold neutron star)"
        : nsClass(s.Teff, cool * 1e6);
    } else {
      s.isBH = true;
      s.Rkm = bhRadiusKm(rem.mass);
      s.R = s.Rkm / R_SUN_KM;
      s.L = 0;
      s.Teff = bhHawkingK(rem.mass);
      s.spec = "n/a (black hole)";
    }
  }
  return s;
}

// ------------------------------------------------------------
// Printing
// ------------------------------------------------------------
function printState(title, st, tl, showSpan) {
  console.log(`\n=== ${title} ===`);
  console.log(`Stage:                 ${stageName(tl, st.stage, st.Teff)}`);
  console.log(`Age:                   ${fmtAge(st.age)}`);
  if (st.progress !== undefined)
    console.log(`Progress in stage:     ${fmtPct(st.progress * 100)}%`);
  if (showSpan) {
    const [a, b] = stageRange(tl, st.stage);
    console.log(
      `Stage lifespan:        ${Number.isFinite(b) ? `${fmt(b - a)} Gyr` : "open ended"}`,
    );
    console.log(
      `Total lifespan:        ${fmt(tl.t.start.REM)} Gyr  (formation to the end of the giant stage, when the remnant forms)`,
    );
  }
  if (st.cool !== undefined)
    console.log(`Remnant cooling age:   ${fmtAge(st.cool)}`);
  console.log(`Spectral type:         ${st.spec}`);
  console.log(`Mass:                  ${fmt(st.mass)} M_Sun`);
  if (tl.feh)
    console.log(
      `Metallicity:           [Fe/H] = ${tl.feh > 0 ? "+" : ""}${fmt(tl.feh)}  (lifetime, L, R and T_eff adjusted)`,
    );
  if (st.isBH) {
    console.log(`Schwarzschild radius:  ${fmt(st.Rkm)} km`);
    console.log(`Photon sphere:         ${fmt(1.5 * st.Rkm)} km`);
    console.log(`ISCO (non-rotating):   ${fmt(3 * st.Rkm)} km`);
    console.log(`Hawking temperature:   ${fmt(st.Teff)} K`);
    console.log(
      `Mean density:          ${fmt(calcDensity(st.mass, st.R))} g/cm3`,
    );
    return;
  }
  if (st.stage === "REM" || st.stage === "BD") {
    if (tl.rem.kind === "NS")
      console.log(
        `Radius:                ${fmt(st.R * R_SUN_KM)} km  /  ${fmt(st.R)} R_Sun`,
      );
    else
      console.log(
        `Radius:                ${fmt(st.R)} R_Sun  /  ${fmt(st.R * R_SUN_KM)} km  /  ${fmt((st.R * R_SUN_KM) / R_EARTH_KM)} R_Earth`,
      );
  } else {
    console.log(
      `Radius:                ${fmt(st.R)} R_Sun  /  ${fmt(st.R * R_SUN_KM)} km`,
    );
  }
  printLumBlock(
    st.L,
    tl.rem.kind === "NS" && (st.stage === "REM" || st.stage === "BD")
      ? null
      : st.Teff,
  );
  console.log(`T_eff:                 ${fmtTeff(st.Teff)} K`);
  console.log(
    `Mean density:          ${fmt(calcDensity(st.mass, st.R))} g/cm3`,
  );
}

function printChange(a, b) {
  console.log(`\n=== Change ===`);
  console.log(
    `Age:                   ${fmt(a.age)} Gyr -> ${fmt(b.age)} Gyr  (${b.age >= a.age ? "+" : ""}${fmt(b.age - a.age)} Gyr)`,
  );
  if (a.isBH || b.isBH) {
    console.log(
      `Mass:                  ${fmt(a.mass)} -> ${fmt(b.mass)} M_Sun`,
    );
    return;
  }
  console.log(`Mass:                  ${fmt(a.mass)} -> ${fmt(b.mass)} M_Sun`);
  console.log(`Radius:                x${fmt(b.R / a.R)}`);
  console.log(`Luminosity:            x${fmt(b.L / a.L)}`);
  console.log(
    `T_eff:                 ${fmtTeff(a.Teff)} K -> ${fmtTeff(b.Teff)} K`,
  );
}

// Compares what the user typed with the model star at the same age
function checkInputs(p, st) {
  const rows = [];
  if (p.radius !== null && !st.isBH)
    rows.push(["Radius (R_Sun)", p.radius, st.R]);
  if (p.lum !== null) {
    const mv = visLum(st.L, st.Teff);
    if (mv !== null) rows.push(["Lum (L_Sun)", p.lum, mv]);
  }
  if (p.lumBol !== null && !st.isBH)
    rows.push(["LumBol (L_Sun)", p.lumBol, st.L]);
  if (p.teff !== null && !st.isBH) rows.push(["T_eff (K)", p.teff, st.Teff]);
  if (rows.length === 0 && !p.spec) return;
  console.log(`\n--- Input check against the model track ---`);
  let big = false;
  for (const [name, entered, model] of rows) {
    const d = ((model - entered) / entered) * 100;
    if (Math.abs(d) > 25) big = true;
    console.log(
      `${name.padEnd(18)} entered ${fmt(entered)}  model ${fmt(model)}  (${d >= 0 ? "+" : ""}${fmt(d)}%)`,
    );
  }
  if (p.spec)
    console.log(
      `${"Spectral type".padEnd(18)} entered ${p.spec.text}  model ${st.spec}`,
    );
  if (big)
    console.log(
      `Gaps above 25% mean your star sits off this track. All results follow the track, not your typed values.`,
    );
}

// ------------------------------------------------------------
// Input helpers
// ------------------------------------------------------------
class Stop extends Error {}

const rl = readline.createInterface({ input: process.stdin });
const lineQueue = [];
let lineWaiter = null;
let inputClosed = false;
rl.on("line", (l) => {
  if (lineWaiter) {
    const w = lineWaiter;
    lineWaiter = null;
    w(l);
  } else lineQueue.push(l);
});
rl.on("close", () => {
  inputClosed = true;
  if (lineWaiter) {
    const w = lineWaiter;
    lineWaiter = null;
    w(null);
  }
});
// Own line queue so piped input never loses lines
function nextLine() {
  return new Promise((res) => {
    if (lineQueue.length) res(lineQueue.shift());
    else if (inputClosed) res(null);
    else lineWaiter = res;
  });
}
async function ask(q) {
  process.stdout.write(q);
  const line = await nextLine();
  if (line === null)
    throw new Error("Input closed before the script finished.");
  if (!process.stdin.isTTY) process.stdout.write(line + "\n");
  return line.trim();
}
async function askNum(q, o = {}) {
  for (;;) {
    const raw = await ask(q);
    if (raw === "") {
      if (o.optional) return null;
      if (o.def !== undefined) return o.def;
      console.log("A value is required.");
      continue;
    }
    const v = Number(raw);
    const bad =
      !Number.isFinite(v) ||
      (o.min !== undefined && v < o.min) ||
      (o.max !== undefined && v > o.max) ||
      (o.gt !== undefined && v <= o.gt);
    if (bad) {
      console.log(
        `Enter a number${o.min !== undefined ? ` >= ${o.min}` : ""}${o.gt !== undefined ? ` > ${o.gt}` : ""}${o.max !== undefined ? ` <= ${o.max}` : ""}.`,
      );
      continue;
    }
    return v;
  }
}
async function askChoice(title, labels, def) {
  console.log(`\n${title}`);
  labels.forEach((l, i) => console.log(`  ${i + 1}) ${l}`));
  for (;;) {
    const raw = await ask(
      def !== undefined ? `Choice [Enter = ${def + 1}]: ` : "Choice: ",
    );
    if (raw === "" && def !== undefined) return def;
    const v = parseInt(raw, 10);
    if (Number.isInteger(v) && v >= 1 && v <= labels.length) return v - 1;
    console.log(`Enter a number from 1 to ${labels.length}.`);
  }
}
async function askYesNo(q, defYes) {
  for (;;) {
    const raw = (
      await ask(`${q} ${defYes ? "[Y/n]" : "[y/N]"}: `)
    ).toLowerCase();
    if (raw === "") return defYes;
    if (raw.startsWith("y")) return true;
    if (raw.startsWith("n")) return false;
    console.log("Answer y or n.");
  }
}

function parseSpec(raw) {
  if (raw === "") return null;
  const m = /^([OBAFGKM])\s*(\d(?:\.\d)?)/i.exec(raw);
  if (!m) {
    console.log(
      "Spectral type not recognised, so it is ignored. Use a form like G2V.",
    );
    return null;
  }
  return {
    letter: m[1].toUpperCase(),
    sub: parseFloat(m[2]),
    text: raw.toUpperCase(),
  };
}

const KIND_NAME = { WD: "white dwarf", NS: "neutron star", BH: "black hole" };

async function askParams(stageKey, kind) {
  const isRem = stageKey === "REM";
  const p = {
    mass: null,
    prog: null,
    radius: null,
    lum: null,
    lumBol: null,
    teff: null,
    age: null,
    feh: 0,
    spec: null,
  };
  console.log(
    "\nEnter the initial parameters. Press Enter to skip any item you do not know.",
  );
  const massOpt = !isRem
    ? { optional: true, min: 0.08, max: 120 }
    : kind === "WD"
      ? { min: 0.1, max: 1.439 }
      : kind === "NS"
        ? { min: 1.0, max: 3.0 }
        : { min: 2.0, max: 200 };
  p.mass = await askNum(
    isRem
      ? `Mass of the ${KIND_NAME[kind]} (M_Sun): `
      : "Mass (M_Sun, 0.08-120): ",
    massOpt,
  );
  if (isRem) {
    p.prog = await askNum(
      "Progenitor (zero-age) mass in M_Sun [Enter to infer from the remnant mass]: ",
      { optional: true, min: 0.08, max: 120 },
    );
  }
  p.radius = await askNum("Radius (R_Sun): ", { optional: true, gt: 0 });
  p.lum = await askNum("Luminosity, visual band (L_Sun): ", {
    optional: true,
    gt: 0,
  });
  p.lumBol = await askNum("Bolometric luminosity (L_Sun): ", {
    optional: true,
    gt: 0,
  });
  p.teff = await askNum("Effective temperature T_eff (K): ", {
    optional: true,
    gt: 0,
  });
  p.age = await askNum(
    isRem
      ? "Total age since birth in Gyr (not the cooling age): "
      : "Age (Gyr) [Enter to estimate from the stage and radius]: ",
    isRem ? { min: 0 } : { optional: true, min: 0 },
  );
  p.feh = await askNum(
    "Metallicity [Fe/H] relative to the Sun (0 = solar, -2.0 to 0.5) [Enter = 0]: ",
    { def: 0, min: -2.0, max: 0.5 },
  );
  if (!isRem)
    p.spec = parseSpec(
      await ask("Spectral type, for example G2V [Enter to skip]: "),
    );
  if (p.mass === null) {
    if (p.spec && stageKey === "MS") {
      const row = msByType(p.spec.letter, p.spec.sub);
      p.mass = row.M;
      console.log(`Mass taken from ${p.spec.text}: ${fmt(p.mass)} M_Sun`);
    } else if (p.teff !== null && stageKey === "MS") {
      p.mass = massFromTeff(p.teff, p.feh);
      console.log(
        `Mass taken from the ZAMS relation at ${fmt(p.teff)} K: ${fmt(p.mass)} M_Sun`,
      );
    } else {
      p.mass = await askNum("A mass is required. Mass (M_Sun, 0.08-120): ", {
        min: 0.08,
        max: 120,
      });
    }
  }
  return p;
}

// Finds the age inside a stage where the model best matches the typed radius or luminosity
function inferAge(tl, stage, p, massLoss) {
  const [a0, b0] = stageRange(tl, stage);
  const b = b0 - (b0 - a0) * 1e-6;
  if (p.radius === null && p.lumBol === null && p.teff === null)
    return (a0 + b) / 2;
  let best = (a0 + b) / 2;
  let bestErr = Infinity;
  const n = 2000;
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const age =
      stage === "PMS"
        ? Math.max(1e-5, a0) * Math.pow(b / Math.max(1e-5, a0), f)
        : a0 + f * (b - a0);
    const st = stateAt(tl, age, massLoss);
    let err = 0;
    if (p.radius !== null) err += Math.abs(Math.log(st.R / p.radius));
    if (p.lumBol !== null) err += Math.abs(Math.log(st.L / p.lumBol));
    if (p.teff !== null) err += Math.abs(Math.log(st.Teff / p.teff));
    if (err < bestErr) {
      bestErr = err;
      best = age;
    }
  }
  return best;
}

function evolveTargets(tl, cur) {
  if (cur === "REM") return tl.tBD === null ? [] : ["BD"];
  if (cur === "BD") return [];
  const ci = STAGE_ORDER.indexOf(cur);
  return availableStages(tl).filter(
    (s) => STAGE_ORDER.indexOf(s) > ci && s !== "BD",
  );
}
function devolveTargets(tl, cur) {
  const ci = STAGE_ORDER.indexOf(cur);
  return availableStages(tl)
    .filter((s) => STAGE_ORDER.indexOf(s) < ci)
    .reverse();
}

// Age inside the target stage. Evolving lands at the entry point, devolving at the exit point.
async function pickAge(tl, stage, forward, extras) {
  const [a, b] = stageRange(tl, stage);
  if (stage === "BD") return a + tl.tBD * 1e-6;
  if (!extras) return forward ? a : b - (b - a) * 1e-6;
  const pos = await askChoice(
    "[Extra] Part of the target stage (each part covers one third of the stage):",
    ["Start (first third)", "Middle (second third)", "End (final third)"],
    forward ? 0 : 2,
  );
  const pct = await askNum(
    "Position inside that part, 0-100 percent [Enter = random point in the part]: ",
    { optional: true, min: 0, max: 100 },
  );
  // Stay clear of the exact boundary so the star is never a zero-age or last-moment star
  const within = pct === null ? Math.random() : pct / 100;
  const f = clamp((pos + within) / 3, 1e-6, 1 - 1e-6);
  // Remnants cool over many orders of magnitude, so their thirds are logarithmic
  if (stage === "REM") {
    const span = b - a;
    return a + EPS_GYR * Math.pow(span / EPS_GYR, f);
  }
  return a + f * (b - a);
}

// ============================================================
// 2. EXTRAS (added on top of the requested features)
// ============================================================
// Extra A: mass loss during the giant stage (switch lives in stateAt)
// Extra B: life timeline
function printTimeline(tl) {
  console.log(
    `\n--- [Extra] Life timeline for a ${fmt(tl.m)} M_Sun star, [Fe/H] = ${fmt(tl.feh)} ---`,
  );
  for (const s of availableStages(tl)) {
    const [a, b] = stageRange(tl, s);
    const dur = Number.isFinite(b) ? fmtLifetime(b - a) : "open ended";
    console.log(
      `${stageName(tl, s).padEnd(52)} starts ${fmt(a)} Gyr, lasts ${dur}`,
    );
  }
  console.log(`Remnant: ${tl.rem.sub}, ${fmt(tl.rem.mass)} M_Sun`);
}
// Extra C: snapshots at every stage boundary between two ages
function printTrail(tl, ageA, ageB, massLoss) {
  const lo = Math.min(ageA, ageB);
  const hi = Math.max(ageA, ageB);
  const marks = availableStages(tl)
    .slice(1)
    .map((s) => ({ s, age: stageRange(tl, s)[0] }))
    .filter((x) => x.age > lo && x.age < hi && Number.isFinite(x.age));
  if (marks.length === 0) return;
  if (ageB < ageA) marks.reverse();
  console.log(`\n--- [Extra] Stage boundaries crossed ---`);
  for (const mk of marks) {
    const st = stateAt(tl, mk.age, massLoss);
    const rad = st.isBH ? `${fmt(st.Rkm)} km` : `${fmt(st.R)} R_Sun`;
    const temp = st.isBH
      ? `Hawking T ${fmt(st.Teff)} K`
      : `T_eff ${fmtTeff(st.Teff)} K`;
    console.log(
      `${stageName(tl, mk.s).padEnd(52)} at ${fmt(mk.age)} Gyr: R ${rad}, L ${fmt(st.L)} L_Sun, ${temp}`,
    );
  }
}
// Extra D: habitable zone (Kopparapu et al. 2013) and frost line
const HZ_COEF = {
  runaway: [1.0512, 1.3242e-4, 1.5418e-8, -7.9895e-12, -1.8328e-15],
  maxGreen: [0.3438, 5.8942e-5, 1.6558e-9, -3.0045e-12, -5.2983e-16],
  recentVenus: [1.7753, 1.4316e-4, 2.9875e-9, -7.5702e-12, -1.1635e-15],
  earlyMars: [0.3179, 5.4513e-5, 1.5313e-9, -2.7786e-12, -4.8997e-16],
};
function hzAu(lum, teff, key) {
  const [s, a, b, c, d] = HZ_COEF[key];
  const t = teff - 5780;
  return Math.sqrt(lum / (s + a * t + b * t * t + c * t ** 3 + d * t ** 4));
}
function printZones(label, st) {
  if (st.isBH || st.L <= 0) return;
  console.log(`\n--- [Extra] Orbital zones, ${label} ---`);
  console.log(
    `Frost line (2.7 AU x sqrt(L)):  ${fmt(2.7 * Math.sqrt(st.L))} AU`,
  );
  if (st.Teff < 2600 || st.Teff > 7200) {
    console.log(
      `Habitable zone: not computed, T_eff ${fmtTeff(st.Teff)} K is outside the 2600-7200 K fit range.`,
    );
    return;
  }
  console.log(
    `Habitable zone, conservative:   ${fmt(hzAu(st.L, st.Teff, "runaway"))} to ${fmt(hzAu(st.L, st.Teff, "maxGreen"))} AU`,
  );
  console.log(
    `Habitable zone, optimistic:     ${fmt(hzAu(st.L, st.Teff, "recentVenus"))} to ${fmt(hzAu(st.L, st.Teff, "earlyMars"))} AU`,
  );
}
// Extra E: universe age flag
function printUniverseNote(st) {
  if (st.age > UNIVERSE_AGE_GYR) {
    console.log(
      `\n[Extra] Note: ${fmt(st.age)} Gyr is older than the present universe (${UNIVERSE_AGE_GYR} Gyr). Fine for fiction, not for a real star.`,
    );
  }
}

// ============================================================
// MAIN
// ============================================================
// Finds the zero-age mass whose model giant has the typed current mass.
// Bisection, because the mass lost depends on the zero-age mass itself.
function solveZeroAge(p, massLoss) {
  const diffFor = (m0) => {
    if (m0 < 0.4) return -1; // below 0.4 M_Sun there is no giant stage
    const tl = buildTimeline(m0, p.feh, null);
    const age = p.age !== null ? p.age : inferAge(tl, "GIANT", p, massLoss);
    return stateAt(tl, age, massLoss).mass - p.mass;
  };
  let lo = p.mass;
  let hi = Math.min(120, Math.max(3 * p.mass, 1));
  const dLo = diffFor(lo);
  if (dLo >= 0) return { m0: lo, resid: dLo, capped: false };
  const dHi = diffFor(hi);
  if (dHi < 0) return { m0: hi, resid: dHi, capped: true };
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (diffFor(mid) < 0) lo = mid;
    else hi = mid;
  }
  const m0 = (lo + hi) / 2;
  return { m0, resid: diffFor(m0), capped: false };
}

async function main() {
  console.log("Stellar Evolver / Devolver");
  console.log("--------------------------");
  const extras = await askYesNo(
    "Enable the extra features (mass loss, timeline, boundary trail, orbital zones)?",
    true,
  );
  const massLoss = extras;

  // Step 1: initial state
  const keys = ["PMS", "MS", "SG", "GIANT", "REM"];
  const stageKey =
    keys[
      await askChoice("Initial state of the star:", [
        "Pre-main sequence",
        "Main sequence",
        "Subgiant",
        "Giant (red giant, red supergiant or Wolf-Rayet)",
        "Stellar remnant",
      ])
    ];
  let kind = null;
  if (stageKey === "REM") {
    kind = ["WD", "NS", "BH"][
      await askChoice("Remnant type:", [
        "White dwarf",
        "Neutron star",
        "Black hole",
      ])
    ];
  }

  // Step 2: parameters
  const p = await askParams(stageKey, kind);
  let zeroMass = p.mass;
  let remOverride = null;
  if (stageKey !== "REM") {
    const isZero =
      (await askChoice(
        "Is the mass you entered the zero-age mass or the star's current mass?",
        [
          "Zero-age mass (the mass when the star formed)",
          "Current mass (the mass the star has right now)",
        ],
        0,
      )) === 0;
    if (!isZero) {
      if (stageKey !== "GIANT" || !massLoss) {
        console.log(
          stageKey !== "GIANT"
            ? "This model only loses mass during the giant stage, so the current mass equals the zero-age mass here."
            : "Mass loss is off (extras disabled), so the current mass equals the zero-age mass here.",
        );
      } else {
        const sol = solveZeroAge(p, massLoss);
        zeroMass = sol.m0;
        console.log(
          `Zero-age mass solved: ${fmt(zeroMass)} M_Sun  (mass difference left over: ${fmt(sol.resid)} M_Sun)`,
        );
        if (sol.capped)
          console.log(
            "Note: the solver hit the 120 M_Sun cap, so the match is approximate.",
          );
        else if (Math.abs(sol.resid) > 1e-6 * p.mass)
          console.log(
            "Note: the match is approximate because the stage boundaries shift with the zero-age mass.",
          );
      }
    }
  }
  if (stageKey === "REM") {
    zeroMass = p.prog !== null ? p.prog : progenitorFor(kind, p.mass);
    remOverride = { kind, mass: p.mass, sub: remLabel(kind, zeroMass) };
    if (p.prog === null)
      console.log(`Progenitor mass inferred: ${fmt(zeroMass)} M_Sun`);
  }
  const tl = buildTimeline(zeroMass, p.feh, remOverride);
  if ((stageKey === "SG" || stageKey === "GIANT") && !tl.post) {
    throw new Stop(
      `A ${fmt(zeroMass)} M_Sun star skips the subgiant and giant stages (below 0.4 M_Sun). Rerun with another stage.`,
    );
  }
  let age = p.age;
  if (age === null) {
    age = inferAge(tl, stageKey, p, massLoss);
    console.log(`Age estimated: ${fmt(age)} Gyr`);
  }
  if (stageKey === "REM" && age < tl.t.start.REM) {
    throw new Stop(
      `The progenitor needs ${fmt(tl.t.start.REM)} Gyr to reach the remnant stage. Your age of ${fmt(age)} Gyr is too young. Raise the age or change the progenitor mass.`,
    );
  }
  const st0 = stateAt(tl, age, massLoss);
  const fam = (s) => (s === "BD" ? "REM" : s);
  if (fam(st0.stage) !== stageKey) {
    console.log(
      `\nNote: at ${fmt(age)} Gyr the model places this star in the stage "${stageName(tl, st0.stage)}", so the model stage is used.`,
    );
  }
  printState("Initial state", st0, tl, true);
  checkInputs(p, st0);

  // Step 3: evolve or devolve
  const forward =
    (await askChoice("Do you want to evolve or devolve the star?", [
      "Evolve",
      "Devolve",
    ])) === 0;
  const cur = st0.stage;
  let targetAge;

  const optLabels = forward
    ? ["Evolve to an older age", "Evolve to a chosen stage"]
    : ["Devolve to a younger age", "Devolve to a chosen stage"];
  const opt = await askChoice("Choose how to move the star:", optLabels);

  if (opt === 0) {
    targetAge = await askNum(
      `Target age in Gyr (initial age is ${fmt(age)} Gyr): `,
      { min: 0 },
    );
    if (forward && targetAge < age)
      throw new Stop(
        "That age is younger than the initial age. Rerun the script and choose the devolve option.",
      );
    if (!forward && targetAge > age)
      throw new Stop(
        "That age is older than the initial age. Rerun the script and choose the evolve option.",
      );
    if (targetAge === age)
      throw new Stop(
        "The target age equals the initial age, so nothing changes.",
      );
  } else {
    if (forward) {
      if (cur === "BD")
        throw new Stop(
          "This star is already a black dwarf. Use the older age option or devolve it.",
        );
      if (cur === "REM" && tl.tBD === null) {
        throw new Stop(
          "A black hole has no later stage in this model. Rerun the script and use the option to enter your own older age.",
        );
      }
    } else if (cur === "PMS") {
      throw new Stop(
        "The pre-main sequence is the earliest stage. Rerun the script and use the option to enter a younger age.",
      );
    }
    const targets = forward ? evolveTargets(tl, cur) : devolveTargets(tl, cur);
    if (targets.length === 0)
      throw new Stop(
        "No stage is available in that direction. Rerun the script and use the age option.",
      );
    const pick = await askChoice(
      forward ? "Evolve the star to:" : "Devolve the star to:",
      targets.map((s) => stageName(tl, s)),
    );
    targetAge = await pickAge(tl, targets[pick], forward, extras);
  }

  const st1 = stateAt(tl, targetAge, massLoss);
  printState(forward ? "Evolved state" : "Devolved state", st1, tl);
  printChange(st0, st1);

  if (extras) {
    printTimeline(tl);
    printTrail(tl, age, targetAge, massLoss);
    printZones("initial state", st0);
    printZones("final state", st1);
    printUniverseNote(st1);
  }
  console.log(
    `\nTrack notes: the typed mass is read as the zero-age mass unless you chose current mass. A remnant counts as a black dwarf once T_eff falls to ${BLACK_DWARF_TEFF} K. Values are model estimates with large errors in the giant and remnant stages.`,
  );
}

// Runs the script once, then offers another run. A new run clears the screen.
async function runLoop() {
  for (;;) {
    try {
      await main();
    } catch (e) {
      if (e instanceof Stop) console.log(`\n${e.message}`);
      else {
        console.error(`\nError: ${e.message}`);
        process.exitCode = 1;
        return;
      }
    }
    if (inputClosed && lineQueue.length === 0) return;
    let again = false;
    try {
      again = await askYesNo(
        "\nWould you like to evolve or devolve another star?",
        false,
      );
    } catch (e) {
      return;
    }
    if (!again) return;
    // Wipe the screen and scrollback so the next star starts clean
    if (process.stdout.isTTY) process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
  }
}

runLoop().finally(() => rl.close());
