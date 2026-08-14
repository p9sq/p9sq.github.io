// shared distance/mass/density formatting, respects the settings panel

const PC_TO_LY = 3.26156;
const EARTH_RADIUS_KM = 6371;
const AU_TO_KM = 149597870.7;
const KM_TO_MI = 0.621371;
const GCM3_TO_LBFT3 = 62.42796;

// scales a distance value up into k/m/g/t prefixes once it passes 1000
function scaleDistance(value, unitRoot) {
  const abs = Math.abs(value);
  if (abs >= 1e12) return { v: value / 1e12, suffix: "t" + unitRoot };
  if (abs >= 1e9) return { v: value / 1e9, suffix: "g" + unitRoot };
  if (abs >= 1e6) return { v: value / 1e6, suffix: "m" + unitRoot };
  if (abs >= 1e3) return { v: value / 1e3, suffix: "k" + unitRoot };
  return { v: value, suffix: unitRoot };
}

// distToSun is always stored in parsecs, convert on the way out based on settings
function fmtDist(pc) {
  if (pc == null) return "—";
  const distUnit = getSettings().distUnit;
  if (pc === 0) return distUnit === "pc" ? "< 0.01 pc" : "< 0.01 ly";

  const base = distUnit === "pc" ? pc : pc * PC_TO_LY;
  const { v, suffix } = scaleDistance(base, distUnit);
  return (
    v.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " " + suffix
  );
}

function fmtRadius(radiusKm) {
  if (radiusKm == null) return "—";
  return (radiusKm / EARTH_RADIUS_KM).toFixed(3) + " R⊕";
}

// orbits at or under 10,000,000 km (~0.0668 AU) read better in km (or miles, under imperial)
const SMA_KM_THRESHOLD_AU = 0.066845871223;

function fmtSma(au) {
  if (au == null) return "—";
  if (Math.abs(au) > SMA_KM_THRESHOLD_AU) return au + " AU";

  const km = au * AU_TO_KM;
  if (getSettings().units === "imperial") {
    const mi = km * KM_TO_MI;
    return mi.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " mi";
  }
  return km.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " km";
}

function fmtDensity(density) {
  if (density == null) return "—";
  if (getSettings().units === "imperial") {
    const lbft3 = density * GCM3_TO_LBFT3;
    return (
      lbft3.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " lb/ft³"
    );
  }
  return density + " g/cm³";
}

const DAYS_PER_YEAR = 365.25;

// orbital period is stored in years, drop to days then hours for short orbits
function fmtPeriod(years) {
  if (years == null) return "—";
  if (Math.abs(years) >= 1) return years + " yr";

  const days = years * DAYS_PER_YEAR;
  if (Math.abs(days) >= 1) {
    return (
      days.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " days"
    );
  }

  const hours = days * 24;
  return (
    hours.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " hours"
  );
}
