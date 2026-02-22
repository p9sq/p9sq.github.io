let planetsArray = [];

async function loadPlanets() {
  try {
    const response = await fetch("worlds/terraformed.json");
    const data = await response.json();

    planetsArray = Object.entries(data).map(([name, world]) => {
      const card = document.createElement("div");
      card.classList.add("world-card");

      return {
        altName: world.altName,
        name: name,
        systemName: world.systemName,
        systemType: world.systemType,
        parentSun: world.parentSun,
        spectralClass: world.spectralClass,
        distToSun: world.distToSun,
        type: world.type,
        parent: world.parent,
        orbit: world.orbit,
        radius: world.radius,
        mass: world.mass,
        moonCount: world.moonCount,
        thumbnail: world.thumbnail,
        life: {
          exists: world.life.exists,
          type: world.life.type,
          biome: world.life.biome,
          origin: world.life.origin,
        },
      };
    });

    renderPlanets(planetsArray);
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
}

loadPlanets();

function renderPlanets(planets) {
  if (!planets || !Array.isArray(planets)) {
    console.error("renderPlanets received invalid data:", planets);
    return;
  }

  const container = document.getElementById("worldContainer");
  container.innerHTML = "";

  planets.forEach((world) => {
    const card = document.createElement("div");
    card.classList.add("world-card");

    const mass = world.mass;
    let displayMass;
    let parentText;

    if (world.type === "Moon") {
      parentText = `${world.type} (Parent: ${world.parent})`;
    } else {
      parentText = world.type;
    }

    if (mass < 0.05) {
      displayMass = `${(world.mass * 81.28).toLocaleString({
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })} M☾`;
    } else if (mass > 0.05 && mass < 90) {
      displayMass = `${world.mass.toLocaleString({
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })} M🜨`;
    } else if (mass >= 90) {
      displayMass = `${(world.mass / 317.9).toLocaleString({
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })} M♃`;
    }

    card.innerHTML = `
                <div class="world-info">
                    <div><strong><i class="fa-solid fa-address-card"></i> Name:</strong> ${
                      world.name
                    } ${world.altName ? `(${world.altName})</div>` : "</div>"}
                    <div><strong><i class="fa-solid fa-tag"></i> System Name:</strong> ${
                      world.systemName
                    }</div>
                    <div><strong><i class="fa-solid fa-diagram-project"></i> System Type:</strong> ${
                      world.systemType
                    }</div>
                    <div><strong><i class="fa-solid fa-sun"></i> Parent Sun:</strong> ${
                      world.parentSun
                    }</div>
                    <div><strong><i class="fa-solid fa-wave-square"></i> Spectral Class:</strong> ${
                      world.spectralClass
                    } (${getStarType(world.spectralClass)})</div>
                    <div><strong><i class="fa-solid fa-ruler-horizontal"></i> Distance to Sun:</strong> ${(
                      world.distToSun * 3.262
                    ).toLocaleString({
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })} ly</div>
                    <div><strong><i class="fa-solid fa-globe"></i> Type:</strong> ${parentText}</div>
                    <div><strong><i class="fa-solid fa-arrows-rotate"></i> Orbit:</strong> ${world.orbit.toFixed(
                      3
                    )} AU</div>
                    <div><strong><i class="fa-solid fa-arrows-left-right"></i> Radius:</strong> ${world.radius.toLocaleString(
                      {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      }
                    )} km (${(world.radius / 6371.01).toLocaleString({
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })} R🜨)</div>
                    <div><strong><i class="fa-solid fa-scale-balanced"></i> Mass:</strong> ${displayMass}</div>
                    <div><strong><i class="fa-solid fa-layer-group"></i> Density:</strong> ${calculateDensity(
                      world.radius,
                      world.mass
                    )} g/cm³</div>
                    <div><strong><i class="fa-solid fa-moon"></i> Moons:</strong> ${
                      world.moonCount
                    }</div>
                    <div><strong><i class="fa-solid fa-dna"></i> Life?:</strong> ${
                      world.life.exists
                        ? `<div class="tooltip">${world.life.type}
                        <span class="tooltiptext">Origin: ${world.life.origin}</span>
                        </div>: ${world.life.biome}`
                        : "No"
                    }</div>
                </div>
                <div class="world-image">
                    <img src="${world.thumbnail}" alt="${
      world.name
    }" class=\"world-image\">
                </div>
            `;

    container.appendChild(card);
  });
}

document.getElementById("sortBy").addEventListener("change", sortPlanets);
document.getElementById("sortOrder").addEventListener("change", sortPlanets);

function sortPlanets() {
  const sortBy = document.getElementById("sortBy").value;
  const order = document.getElementById("sortOrder").value;

  const sorted = [...planetsArray].sort((a, b) => {
    if (order === "asc") {
      return a[sortBy] - b[sortBy];
    } else if (order === "desc") {
      return b[sortBy] - a[sortBy];
    }
  });

  renderPlanets(sorted);
}

function calculateDensity(radiusKm, massEarths) {
  const radiusEarths = radiusKm / 6378.14;

  const EARTH_DENSITY = 5.5136;

  const density = EARTH_DENSITY * (massEarths / Math.pow(radiusEarths, 3));

  return density.toFixed(3);
}

function getStarType(spectralClass) {
  if (!spectralClass) return "Unknown";

  const classes = spectralClass.split(",").map((s) => s.trim());

  const results = classes.map((singleClass) => classifySingleStar(singleClass));

  return results.join(", ");
}

function classifySingleStar(spectralClass) {
  const cleaned = spectralClass.toUpperCase();

  if (cleaned.startsWith("SD")) {
    const letter = cleaned.charAt(2);
    return `${getSpectralColor(letter)} Subdwarf`;
  }

  const spectralLetter = cleaned.charAt(0);

  const specialClasses = {
    D: "White Dwarf",
    X: "Black Hole",
    W: "Wolf-Rayet Star",
    C: "Carbon Star",
    S: "Zirconium Star",
    Q: "Neutron Star",
    P: "Rogue Planet",
  };

  if (specialClasses[spectralLetter]) {
    return specialClasses[spectralLetter];
  }

  if (["Y", "T", "L"].includes(spectralLetter)) {
    return "Brown Dwarf";
  }

  const color = getSpectralColor(spectralLetter);

  const luminosityMatch = cleaned.match(/(IA|IAB|IB|II|III|IV|V)/);
  const luminosityClass = luminosityMatch ? luminosityMatch[0] : null;

  if (luminosityClass) {
    if (luminosityClass === "V") {
      if (["M", "K", "G"].includes(spectralLetter)) {
        return `${color} Dwarf`;
      }

      if (["F", "A", "B", "O"].includes(spectralLetter)) {
        return `${color} Main Sequence`;
      }
    }

    const luminosityMap = {
      IA: "Luminous Supergiant",
      IAB: "Luminous Supergiant",
      IB: "Supergiant",
      I: "Supergiant",
      II: "Bright Giant",
      III: "Giant",
      IV: "Subgiant",
    };

    if (luminosityMap[luminosityClass]) {
      return `${color} ${luminosityMap[luminosityClass]}`;
    }
  }

  if (["M", "K", "G"].includes(spectralLetter)) {
    return `${color} Dwarf`;
  }

  if (spectralLetter === "F") {
    return `${color} Main Sequence`;
  }

  if (["A", "B", "O"].includes(spectralLetter)) {
    return `${color} Main Sequence`;
  }

  return "Unknown";
}

function getSpectralColor(letter) {
  const spectralMap = {
    O: "Blue",
    B: "Blue-White",
    A: "White",
    F: "White",
    G: "Yellow",
    K: "Orange",
    M: "Red",
  };

  return spectralMap[letter] || "Unknown";
}
