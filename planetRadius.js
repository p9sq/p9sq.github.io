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
    label: "Predominantly icy (Tethys/Dione/Rhea-like)",
    scale: 1.1013,
    exponent: 0.2854,
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
    scale: 3.9833,
    exponent: -0.1904,
    massRef: 15,
  },
  gasGiant: { label: "Gas giant (Saturn/Jupiter-like)", scale: 10.9733 },
  hotJupiter: { label: "Hot Jupiter (irradiation-inflated gas giant)" },
  chthonian: {
    label: "Chthonian planet (stripped gas/ice giant core)",
    scale: 0.9978,
    exponent: 0.3346,
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
      r = comp.scale * Math.pow(mass / comp.massRef, comp.exponent);
      r = Math.max(2.5, Math.min(6.0, r));
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
        warning = `Warning: ${radiusEarth.toFixed(4)} R_Earth is outside the Mini-Neptune range (1.7-4.0 R_Earth). Result is an extrapolation.`;
      }
      mass = 5.0 * Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      break;
    }

    case "iceGiant": {
      if (radiusEarth < 2.5 || radiusEarth > 6.0) {
        warning = `Warning: ${radiusEarth.toFixed(4)} R_Earth is outside the Ice giant range (2.5-6.0 R_Earth). Result is an extrapolation.`;
      }
      mass =
        comp.massRef * Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
      break;
    }

    case "gasGiant": {
      if (radiusEarth < 7.5 || radiusEarth > 13.0) {
        warning = `Warning: ${radiusEarth.toFixed(4)} R_Earth is outside the Gas giant range (7.5-13.0 R_Earth). Result is an extrapolation.`;
      }
      mass = M_JUP * Math.pow(radiusEarth / comp.scale, 1 / 0.1516);
      break;
    }

    default:
      mass = Math.pow(radiusEarth / comp.scale, 1 / comp.exponent);
  }

  return { mass, warning };
}

// ---------------------------------------------------------------------------
// Shared density calculation
// ---------------------------------------------------------------------------
function calcDensity(massEarth, radiusEarth) {
  const radiusKm = radiusEarth * EARTH_RADIUS_KM;
  const volume = (4 / 3) * Math.PI * Math.pow(radiusKm * 1e5, 3); // cm^3
  const massG = massEarth * 5.972e27; // grams
  return massG / volume;
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
  console.log("5) Predominantly icy (Tethys/Dione/Rhea-like, ice-dominated)");
  console.log("6) Rocky-icy     (Europa/Triton-like, rock core + ice shell)");
  console.log("7) Carbonia      (carbon-rich, SiC/diamond interior)");
  console.log("8) Mini-Neptune  (K2-18b-like, H/He envelope)");
  console.log("9) Ice giant     (Uranus/Neptune-like)");
  console.log("10) Gas giant    (Saturn/Jupiter-like)");
  console.log(
    "11) Hot Jupiter  (irradiation-inflated, orbiting close to star)",
  );
  console.log("12) Chthonian    (exposed core of stripped gas/ice giant)");
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
  console.log("Estimated radius: " + radiusKm.toFixed(2) + " km");
  console.log("In Earth radii:   " + radiusEarth.toFixed(4) + " R_Earth");
  console.log("Mean density:     " + dens.toFixed(4) + " g/cm^3");
  console.log(
    "Note: density ~5.4-5.5 g/cm^3 reflects residual compression from former envelope.",
  );
  if (stellar) {
    console.log("\nStellar irradiation context:");
    console.log(
      "  Incident flux:    " +
        (stellar.flux / 1e6).toFixed(4) +
        " MW/m^2  (" +
        (stellar.flux / S_EARTH).toFixed(1) +
        " S_Earth)",
    );
    console.log("  Equilibrium temp: " + stellar.Teq.toFixed(1) + " K");
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
        `\n⚠️  ${massJup.toFixed(3)} M_Jupiter is outside the hot Jupiter range (0.1–13 Mj).`,
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
                console.log(
                  "  -> Derived luminosity: " + L_solar.toFixed(4) + " L_Sun",
                );
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
  const inflPct = (inflationFraction * 100).toFixed(1);

  console.log(
    `\nType:             Hot Jupiter (irradiation-inflated gas giant)`,
  );
  console.log(`Stellar luminosity: ${L_solar} L_Sun`);
  console.log(`Orbital distance:   ${a_AU} AU`);
  console.log(`Bond albedo:        ${A.toFixed(2)}`);
  const incidentFlux = calcFluxFromL(L_solar, a_AU);
  console.log(`Equilibrium temp:   ${Teq.toFixed(1)} K`);
  console.log(
    `Incident flux:      ${(incidentFlux / 1e6).toFixed(4)} MW/m²  (${(incidentFlux / S_EARTH).toFixed(1)} S_Earth)`,
  );

  if (Teq < 1000) {
    console.log(
      `\n⚠️  Teq = ${Teq.toFixed(1)} K is below the 1000 K inflation threshold.`,
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
      `\nNote: Raw inflation gave ${(rInflatedRaw * EARTH_RADIUS_KM).toFixed(0)} km — capped at 2.0 Rj physical limit.`,
    );
  }

  console.log(
    `\nCold baseline:    ${(rBase * EARTH_RADIUS_KM).toFixed(2)} km  /  ${rBase.toFixed(4)} R_Earth`,
  );
  console.log(`Inflated radius:  ${radiusKm.toFixed(2)} km`);
  console.log(`In Earth radii:   ${rFinal.toFixed(4)} R_Earth`);
  console.log(`In Jupiter radii: ${(rFinal / R_JUP_RE).toFixed(4)} R_Jupiter`);
  console.log(`Mean density:     ${density.toFixed(4)} g/cm^3`);

  askRepeat();
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
              console.log(
                `\n⚠️  Mass ${mass} M_Earth is outside the valid range for Rocky-icy.`,
              );
              console.log(
                `   This model is only calibrated up to 0.02 M_Earth (Europa/Triton scale).`,
              );
              console.log(
                `   For larger rock+ice bodies consider Water/ocean or Icy body instead.`,
              );
              return askRepeat();
            }

            const radiusKm = radiusEarth * EARTH_RADIUS_KM;
            const density = calcDensity(mass, radiusEarth);

            console.log(`\nType:             ${comp.label}`);
            console.log(`Estimated radius: ${radiusKm.toFixed(2)} km`);
            console.log(`In Earth radii:   ${radiusEarth.toFixed(4)} R_Earth`);
            console.log(`Mean density:     ${density.toFixed(4)} g/cm^3`);

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
                    `Input radius:     ${(radiusEarth * EARTH_RADIUS_KM).toFixed(2)} km  /  ${radiusEarth.toFixed(6)} R_Earth`,
                  );
                  console.log(`Estimated mass:   ${formatMass(mass)} M_Earth`);
                  if (mass >= 1 / M_JUP) {
                    console.log(
                      `                  ${(mass / M_JUP).toFixed(6)} M_Jupiter`,
                    );
                  }
                  console.log(`Mean density:     ${density.toFixed(4)} g/cm^3`);
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
