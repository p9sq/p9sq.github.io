// Moon Generator.js
// Console tool. Builds a moon system for one planet: mass budget, radii,
// and orbit spacing inside the true stable region of the planet's Hill sphere.

const readline = require("readline/promises");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EARTH_RADIUS_KM = 6378.137;
const EARTH_DENSITY = 5.5136; // g/cm3
const M_JUP = 317.828; // Earth masses
const M_SUN_EARTH = 332946.05; // Earth masses
const R_SUN_KM = 695700;
const R_JUP_KM = 71492; // equatorial, matches planetRadius.js
const AU_KM = 149597870.7;
const LUNAR_MASS_EARTH = 0.012293627139077726;
const GM_EARTH = 3.986004418e14; // m3/s2

// Neighbouring moons need at least this many mutual Hill radii between orbits.
// Chambers (1996) puts long-term stability for small bodies near 8-10.
const K_MIN = 8;
// The critical orbit is the edge of chaos, so the last moon stays inside this fraction.
const EDGE_MARGIN = 0.9;

// ---------------------------------------------------------------------------
// Moon types (same fits as planetRadius.js, moon-suitable subset)
// ---------------------------------------------------------------------------
const MOON_TYPES = {
  iron: { label: "Iron (Mercury-like)", scale: 0.8, exponent: 0.25 },
  rocky: { label: "Rocky (Earth-like)", scale: 1.0, exponent: 0.27 },
  water: { label: "Water/ocean (ice-rich)", scale: 1.26, exponent: 0.27 },
  icyBody: {
    label: "Icy body (Titan/Ganymede-like)",
    scale: 1.2335,
    exponent: 0.2948,
  },
  predIcy: {
    label: "Predominantly icy (Tethys/Dione/Rhea-like)",
    scale: 1.1008,
    exponent: 0.2816,
    scaleExt: 1.41,
    exponentExt: 0.3,
  },
  rockyIcy: {
    label: "Rocky-icy (Europa/Triton-like)",
    scale: 0.5838,
    exponent: 0.1799,
  },
  carbonia: { label: "Carbonia (SiC/diamond)", scale: 1.0357, exponent: 0.27 },
  rockyAsteroid: {
    label: "Rocky asteroid (~2.0 g/cm3)",
    scale: 1.402145,
    exponent: 1 / 3,
  },
  icyAsteroid: {
    label: "Icy asteroid/comet (~0.55 g/cm3)",
    scale: 2.156165,
    exponent: 1 / 3,
  },
  custom: { label: "Custom (you set the bulk density)" },
};
const MOON_TYPE_KEYS = Object.keys(MOON_TYPES);

// Mass to radius in Earth radii. Returns a note when the model is stretched.
function moonRadius(key, mass, dens) {
  const t = MOON_TYPES[key];
  if (key === "custom") {
    return { r: Math.cbrt((EARTH_DENSITY * mass) / dens), note: "" };
  }
  if (key === "predIcy") {
    const r =
      mass <= 0.002
        ? t.scale * Math.pow(mass, t.exponent)
        : t.scaleExt * Math.pow(mass, t.exponentExt);
    return { r, note: mass < 1e-4 ? "below predIcy calibration" : "" };
  }
  if (key === "rockyIcy" && (mass < 0.002 || mass > 0.02)) {
    // The rockyIcy fit collapses outside its range, so borrow a neighbour model
    const alt = mass < 0.002 ? "predIcy" : "icyBody";
    return { r: moonRadius(alt, mass, dens).r, note: `${alt} fallback` };
  }
  const note =
    (key === "rockyAsteroid" || key === "icyAsteroid") && mass > 0.001
      ? "above small-body range"
      : "";
  return { r: t.scale * Math.pow(mass, t.exponent), note };
}

function calcDensity(mass, radius) {
  return EARTH_DENSITY * (mass / Math.pow(radius, 3));
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------
async function askNum(q, opts = {}) {
  const { min = -Infinity, max = Infinity, def = null, int = false } = opts;
  const { minExcl = false, skip = false } = opts;
  const hint =
    def !== null ? ` (Enter for ${def})` : skip ? " (Enter to skip)" : "";
  while (true) {
    const raw = (await rl.question(`${q}${hint}: `)).trim();
    if (raw === "" && def !== null) return def;
    if (raw === "" && skip) return null;
    const n = Number(raw);
    const bad =
      raw === "" ||
      !Number.isFinite(n) ||
      (int && !Number.isInteger(n)) ||
      n < min ||
      n > max ||
      (minExcl && n === min);
    if (!bad) return n;
    console.log("Invalid input. Try again.");
  }
}

// Returns the 1-based choice number
async function askChoice(q, labels, def = 1) {
  console.log(`\n${q}`);
  labels.forEach((l, i) => console.log(`  ${i + 1}) ${l}`));
  return askNum("Enter option number", {
    min: 1,
    max: labels.length,
    int: true,
    def,
  });
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
const sig = (n, d = 5) => Number(n.toPrecision(d)).toString();

function formatMass(m) {
  if (m === 0) return "0";
  if (m < 5e-7) return m.toExponential(4);
  const decimals = Math.max(6, Math.ceil(-Math.log10(m)) + 4);
  return m.toFixed(decimals);
}

// ---------------------------------------------------------------------------
// Mass generation (from massdistribution.js)
// ---------------------------------------------------------------------------
function randNormal() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function icyKmToMass(km) {
  return Math.pow(km / EARTH_RADIUS_KM / 1.2335, 1 / 0.2948);
}

// Finds the log-uniform width where the average largest:smallest ratio hits the target
function calibrateLogUniformWidth(moonCount, targetSpread) {
  if (moonCount <= 1) return 0;
  let loW = 0.01;
  let hiW = 12.0;
  for (let iter = 0; iter < 14; iter++) {
    const midW = (loW + hiW) / 2;
    let total = 0;
    for (let t = 0; t < 120; t++) {
      let max = -Infinity;
      let min = Infinity;
      for (let i = 0; i < moonCount; i++) {
        const v = Math.exp((Math.random() - 0.5) * midW);
        if (v > max) max = v;
        if (v < min) min = v;
      }
      total += max / min;
    }
    if (total / 120 < targetSpread) loW = midW;
    else hiW = midW;
  }
  return (loW + hiW) / 2;
}

function genMasses(count, totalMass, style, spread) {
  if (style === "saturn") {
    if (count === 1) return [totalMass];
    const dom = totalMass * (0.55 + Math.random() * 0.15);
    const small = [];
    for (let i = 1; i < count; i++) {
      const maxKm = Math.max(200, 800 - (i - 1) * 100);
      small.push(icyKmToMass(200 + Math.random() * (maxKm - 200)));
    }
    // Scale down the small moons when they would blow the budget
    const room = totalMass - dom;
    const sum = small.reduce((a, b) => a + b, 0);
    const k = sum > room ? room / sum : 1;
    return [dom, ...small.map((m) => m * k)];
  }

  const raw = [];
  if (style === "galilean") {
    const width = calibrateLogUniformWidth(count, spread);
    for (let i = 0; i < count; i++) {
      raw.push(Math.exp((Math.random() - 0.5) * width));
    }
  } else if (count === 1) {
    raw.push(1);
  } else {
    const dom = 0.35 + Math.random() * 0.15;
    raw.push(dom);
    for (let i = 1; i < count; i++) {
      raw.push((1 - dom) * Math.pow(0.75, i) * (0.7 + Math.random() * 0.6));
    }
  }
  const rawSum = raw.reduce((a, b) => a + b, 0);
  return raw.map((m) => (m / rawSum) * totalMass);
}

// Sort order sets the orbit order, innermost first
function sortMasses(masses, order) {
  const out = [...masses];
  if (order === "descending") out.sort((a, b) => b - a);
  else if (order === "ascending") out.sort((a, b) => a - b);
  else {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Orbit spacing
// Two neighbours with masses m1, m2 and semi-major axes a1 < a2 sit K mutual
// Hill radii apart when a2 - a1 = K * cbrt((m1+m2)/(3M)) * (a1+a2)/2.
// Solving for a2 gives a2/a1 = (1 + K*mu/2) / (1 - K*mu/2).
// ---------------------------------------------------------------------------
function muOf(m1, m2, planetMass) {
  return Math.cbrt((m1 + m2) / (3 * planetMass));
}

// Log of the orbit ratio for a gap of K mutual Hill radii. The cap keeps
// very massive pairs finite. They fail the crowding check afterwards.
function gapLog(m1, m2, K, planetMass) {
  const x = Math.min((K * muOf(m1, m2, planetMass)) / 2, 0.95);
  return Math.log((1 + x) / (1 - x));
}

function minGapLogs(masses, planetMass) {
  const gaps = [];
  for (let i = 0; i < masses.length - 1; i++) {
    gaps.push(gapLog(masses[i], masses[i + 1], K_MIN, planetMass));
  }
  return gaps;
}

// Returns { fits: true, a } or { fits: false, spanMin, room, capped, maxFit }
function placeMoons(masses, planetMass, inner, outer, mode) {
  const n = masses.length;
  const gaps = minGapLogs(masses, planetMass);
  const spanMin = gaps.reduce((a, b) => a + b, 0);
  const room = Math.log(outer / inner);
  const slack = room - spanMin;
  let capped = false;
  for (let i = 0; i < n - 1; i++) {
    if ((K_MIN * muOf(masses[i], masses[i + 1], planetMass)) / 2 >= 0.95) {
      capped = true;
    }
  }

  if (slack < 0 || capped) {
    let pos = 0;
    let maxFit = 1;
    for (let i = 0; i < n - 1; i++) {
      pos += gaps[i];
      if (pos > room) break;
      maxFit++;
    }
    return { fits: false, spanMin, room, capped, maxFit };
  }

  const logs = [];
  if (mode === "full") {
    // Spare log-space goes to random shares: before the first moon, between moons, after the last
    const w = Array.from({ length: n + 1 }, () => -Math.log(1 - Math.random()));
    const wSum = w.reduce((a, b) => a + b, 0);
    let pos = Math.log(inner) + (slack * w[0]) / wSum;
    logs.push(pos);
    for (let i = 0; i < n - 1; i++) {
      pos += gaps[i] + (slack * w[i + 1]) / wSum;
      logs.push(pos);
    }
  } else {
    // Compact: tight chain near the planet, extras drawn from a log-normal
    // around 6 mutual Hill radii, shrunk until the chain fits.
    const extra = Array.from(
      { length: n - 1 },
      () => 6 * Math.exp(0.5 * randNormal()),
    );
    const start = Math.log(inner) + Math.min(0.22, slack / 2);
    const build = (f) => {
      const out = [start];
      for (let i = 0; i < n - 1; i++) {
        out.push(
          out[i] +
            gapLog(masses[i], masses[i + 1], K_MIN + f * extra[i], planetMass),
        );
      }
      return out;
    };
    let chain = build(1);
    if (chain[n - 1] > Math.log(outer)) {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (build(mid)[n - 1] > Math.log(outer)) hi = mid;
        else lo = mid;
      }
      chain = build(lo);
    }
    logs.push(...chain);
  }
  return { fits: true, a: logs.map(Math.exp) };
}

// Last resort: squeeze the minimum chain into the zone. The check flags the result.
function placeCompressed(masses, planetMass, inner, outer) {
  const gaps = minGapLogs(masses, planetMass);
  const spanMin = gaps.reduce((a, b) => a + b, 0);
  const g = spanMin > 0 ? Math.min(1, Math.log(outer / inner) / spanMin) : 1;
  const a = [inner];
  for (let i = 0; i < masses.length - 1; i++) {
    a.push(a[i] * Math.exp(gaps[i] * g));
  }
  return a;
}

// Period in days for a moon at aKm around a planet
function moonPeriodDays(aKm, planetMass, moonMass) {
  const a = aKm * 1000;
  const gm = GM_EARTH * (planetMass + moonMass);
  return (2 * Math.PI * Math.sqrt((a * a * a) / gm)) / 86400;
}

const RESONANCES = [
  [2, "2:1"],
  [3 / 2, "3:2"],
  [4 / 3, "4:3"],
  [5 / 3, "5:3"],
  [5 / 2, "5:2"],
  [3, "3:1"],
];

// ---------------------------------------------------------------------------
// Main run
// ---------------------------------------------------------------------------
async function runOnce() {
  console.log("\n=== Parent star ===");
  const starMass = await askNum("Star mass (Solar masses)", {
    min: 0,
    minExcl: true,
  });
  const starRad = await askNum("Star radius (Solar radii)", {
    min: 0,
    minExcl: true,
  });

  console.log("\n=== Planet ===");
  const hillUnit = await askChoice("Hill sphere unit:", ["km", "AU"]);
  const hillIn = await askNum(
    `Hill sphere radius (${hillUnit === 1 ? "km" : "AU"})`,
    {
      min: 0,
      minExcl: true,
    },
  );
  const hillKm = hillUnit === 1 ? hillIn : hillIn * AU_KM;
  const ecc = await askNum("Planet orbital eccentricity", {
    min: 0,
    max: 0.9999,
    def: 0,
  });

  const massUnit = await askChoice("Planet mass unit:", [
    "Earth masses",
    "Jupiter masses",
  ]);
  const massIn = await askNum(
    `Planet mass (${massUnit === 1 ? "Earth masses" : "Jupiter masses"})`,
    { min: 0, minExcl: true },
  );
  const planetMass = massUnit === 1 ? massIn : massIn * M_JUP;

  // Optional. The radius sets the inner edge of the moon zone.
  const radUnit = await askChoice("Planet radius unit (sets the inner edge):", [
    "km",
    "Earth radii",
    "Jupiter radii",
    "Skip",
  ]);
  let planetRadKm = null;
  if (radUnit !== 4) {
    const unitName = ["km", "Earth radii", "Jupiter radii"][radUnit - 1];
    const radIn = await askNum(`Planet radius (${unitName})`, {
      min: 0,
      minExcl: true,
    });
    planetRadKm = [1, EARTH_RADIUS_KM, R_JUP_KM][radUnit - 1] * radIn;
  }

  // Hill sphere is read as a_p * cbrt(M_p / 3M_star), with no (1-e) factor.
  // This matches the definition the Domingos et al. (2006) fit uses.
  const starMassEarth = starMass * M_SUN_EARTH;
  const aPlanetAU =
    hillKm / AU_KM / Math.cbrt(planetMass / (3 * starMassEarth));
  const periAU = aPlanetAU * (1 - ecc);
  const periStarRadii = (periAU * AU_KM) / (starRad * R_SUN_KM);
  const planetYears = Math.sqrt(
    Math.pow(aPlanetAU, 3) / (starMass + planetMass / M_SUN_EARTH),
  );

  console.log("\n=== Planet orbit (derived) ===");
  console.log(`Semi-major axis:   ${sig(aPlanetAU)} AU`);
  console.log(
    `Periapsis:         ${sig(periAU)} AU  (${sig(periStarRadii, 4)} stellar radii)`,
  );
  console.log(`Orbital period:    ${sig(planetYears)} years`);
  console.log(
    `Planet mass:       ${sig(planetMass)} M_Earth  (${sig(planetMass / M_JUP)} M_Jupiter)`,
  );
  if (periStarRadii < 10) {
    console.log(
      "Warning: periapsis sits within 10 stellar radii. Expect strong tides.",
    );
  }

  // Prograde critical orbit, Domingos et al. (2006), moon eccentricity near 0
  const fracCrit = 0.4895 * (1 - 1.0305 * ecc);
  if (fracCrit <= 0) {
    console.log("\nNo stable prograde region exists at this eccentricity.");
    return;
  }
  const critKm = fracCrit * hillKm;
  const outerKm = critKm * EDGE_MARGIN;
  const innerKm = planetRadKm !== null ? 2.5 * planetRadKm : 0.002 * hillKm;
  if (innerKm >= outerKm) {
    console.log(
      "\nThe inner edge sits outside the stable region. Check your inputs.",
    );
    return;
  }

  console.log("\n=== True stable region for moons ===");
  console.log(
    `Stable fraction:    ${sig(fracCrit, 4)} Hill radii (prograde, e = ${ecc})`,
  );
  console.log(
    `Critical orbit:     ${sig(critKm)} km  /  ${sig(critKm / AU_KM)} AU`,
  );
  console.log(
    `Usable outer edge:  ${sig(outerKm)} km  /  ${sig(outerKm / AU_KM)} AU  (${EDGE_MARGIN * 100}% of critical)`,
  );
  console.log(
    `Inner edge:         ${sig(innerKm)} km  /  ${sig(innerKm / AU_KM)} AU  (${
      planetRadKm !== null
        ? "2.5 planet radii"
        : "0.2% of Hill radius, no planet radius given"
    })`,
  );

  // maxmoonmass: upper and lower bounds on the combined moon mass
  console.log("\n=== Moon mass budget ===");
  const planetType = await askChoice(
    "Planet type:",
    [
      "Terrestrial (giant impacts possible)",
      "Ice giant (Uranus/Neptune-like)",
      "Gas giant (Jupiter/Saturn-like)",
    ],
    3,
  );
  // Giant range: Canup & Ward (2006), satellite to planet mass fraction 1.1e-4 to 2.5e-4
  const ranges = [
    { min: 1e-4, max: 1e-2 },
    { min: 1.1e-4, max: 2.5e-4 },
    { min: 1.1e-4, max: 2.5e-4 },
  ];
  const { min: fMin, max: fMax } = ranges[planetType - 1];
  const maxBudget = planetMass * fMax;
  const minBudget = planetMass * fMin;
  console.log(
    `Max combined moon mass:  ${formatMass(maxBudget)} M_Earth  (${sig(maxBudget / LUNAR_MASS_EARTH, 4)} lunar masses, 1 : ${Math.round(1 / fMax).toLocaleString()})`,
  );
  console.log(
    `Lower plausible bound:   ${formatMass(minBudget)} M_Earth  (1 : ${Math.round(1 / fMin).toLocaleString()})`,
  );
  console.log("Real systems often fall 2 to 10 times below the max.");

  const denomDef = Math.round(1 / Math.sqrt(fMin * fMax));
  const denom = await askNum("Moon system mass ratio, enter N for 1 : N", {
    min: 1,
    def: denomDef,
  });
  if (denom < 1 / fMax) {
    console.log("Warning: this ratio sits above the theoretical upper limit.");
  }
  const totalMass = planetMass / denom;

  let count = await askNum("Number of moons", { min: 1, int: true });
  const styleKey = ["saturn", "hybrid", "galilean"][
    (await askChoice(
      "Distribution style:",
      [
        "Saturn-like (one dominant moon, many small)",
        "Hybrid (one large moon, graduated smaller ones)",
        "Galilean-like (several comparable moons)",
      ],
      2,
    )) - 1
  ];
  const spread =
    styleKey === "galilean"
      ? await askNum("Target largest:smallest moon mass ratio", {
          min: 1.01,
          def: 4.5,
        })
      : 4.5;
  const sortKey = ["descending", "ascending", "random"][
    (await askChoice("Orbit order of masses, innermost first:", [
      "Descending (largest innermost)",
      "Ascending (smallest innermost)",
      "Random",
    ])) - 1
  ];
  const spacingMode =
    (await askChoice("Spacing style:", [
      "Fill the stable zone",
      "Compact chain near the planet",
    ])) === 1
      ? "full"
      : "compact";

  const typeKey =
    MOON_TYPE_KEYS[
      (await askChoice(
        "Moon type:",
        MOON_TYPE_KEYS.map((k) => MOON_TYPES[k].label),
        4,
      )) - 1
    ];
  const customDens =
    typeKey === "custom"
      ? await askNum("Bulk density (g/cm3)", { min: 0, minExcl: true })
      : null;

  // Generate masses and place orbits. A crowded zone sends you back to the count.
  let masses;
  let axes;
  let compressed = false;
  while (true) {
    masses = sortMasses(genMasses(count, totalMass, styleKey, spread), sortKey);
    const res = placeMoons(masses, planetMass, innerKm, outerKm, spacingMode);
    if (res.fits) {
      axes = res.a;
      break;
    }
    console.log("\n=== Crowding check: FAILED ===");
    if (res.capped) {
      console.log(
        "Some neighbouring moons are too massive for this planet to keep 8 mutual Hill radii apart.",
      );
    }
    console.log(
      `Safe spacing needs the outer moon at ${sig(Math.exp(res.spanMin), 4)}x the inner orbit.`,
    );
    console.log(`The zone gives ${sig(Math.exp(res.room), 4)}x.`);
    console.log(
      `Up to ${res.maxFit} moon${res.maxFit > 1 ? "s" : ""} fit with these masses.`,
    );
    const retry = await askNum(
      "Enter a lower moon count to retry, or press Enter to place all with compressed spacing",
      { min: 1, int: true, skip: true },
    );
    if (retry === null) {
      axes = placeCompressed(masses, planetMass, innerKm, outerKm);
      compressed = true;
      break;
    }
    count = retry;
  }

  // Radii from masses, no random variation
  const moons = masses.map((m, i) => {
    const { r, note } = moonRadius(typeKey, m, customDens);
    return { m, r, rKm: r * EARTH_RADIUS_KM, note, a: axes[i] };
  });

  // Final stability check on every neighbouring pair
  const problems = [];
  const notes = [];
  moons.forEach((moon, i) => {
    moon.k = null;
    moon.res = "";
    if (moon.a > critKm)
      problems.push(`Moon ${i + 1} sits beyond the critical orbit.`);
    if (moon.note) notes.push(`Moon ${i + 1}: ${moon.note}.`);
    if (i === moons.length - 1) return;
    const next = moons[i + 1];
    const mu = muOf(moon.m, next.m, planetMass);
    moon.k = (next.a - moon.a) / (mu * ((moon.a + next.a) / 2));
    if (moon.k < K_MIN) {
      problems.push(
        `Moons ${i + 1} and ${i + 2} sit ${sig(moon.k, 3)} mutual Hill radii apart (min ${K_MIN}). They risk ejection or collision.`,
      );
    }
    if (next.a - moon.a <= moon.rKm + next.rKm) {
      problems.push(`Moons ${i + 1} and ${i + 2} overlap physically.`);
    }
    const pr = Math.pow(next.a / moon.a, 1.5);
    const hit = RESONANCES.find(([v]) => Math.abs(pr / v - 1) < 0.02);
    if (hit) moon.res = `near ${hit[1]}`;
  });

  console.log(
    `\n=== Moon system (${count} moon${count > 1 ? "s" : ""}, ${MOON_TYPES[typeKey].label}) ===`,
  );
  console.log(
    `Total moon mass: ${formatMass(moons.reduce((s, x) => s + x.m, 0))} M_Earth  (budget ${formatMass(totalMass)} M_Earth)`,
  );
  console.table(
    moons.map((x, i) => ({
      Moon: i + 1,
      "Mass (M_Earth)": formatMass(x.m),
      "Mass (Luna)": sig(x.m / LUNAR_MASS_EARTH, 4),
      "Radius (km)": sig(x.rKm, 5),
      "Density (g/cm3)": sig(calcDensity(x.m, x.r), 3),
      "a (km)": sig(x.a, 6),
      "a (AU)": sig(x.a / AU_KM, 5),
      "% of Hill": sig((x.a / hillKm) * 100, 3),
      "Period (d)": sig(moonPeriodDays(x.a, planetMass, x.m), 5),
      "Gap to next (mutual Hill)": x.k === null ? "-" : sig(x.k, 3),
      "Period ratio": x.res,
    })),
  );

  if (notes.length) console.log(notes.join("\n"));
  if (compressed) console.log("Spacing was compressed on request.");
  if (problems.length === 0) {
    console.log(
      `Stability check: PASS. Every gap is at least ${K_MIN} mutual Hill radii and every orbit sits inside the stable zone.`,
    );
  } else {
    console.log("Stability check: FAIL");
    problems.forEach((p) => console.log(`  ${p}`));
  }
}

async function main() {
  while (true) {
    try {
      await runOnce();
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
    const again = (await rl.question("\nGenerate another system? (y/n): "))
      .trim()
      .toLowerCase();
    if (!again.startsWith("y")) break;
  }
  console.log("Goodbye!");
  rl.close();
}

if (require.main === module) main();
