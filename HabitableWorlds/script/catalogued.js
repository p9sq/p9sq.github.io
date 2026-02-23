async function loadSystems() {
  try {
    const response = await fetch("worlds/catalogued.json");
    const data = await response.json();

    const container = document.getElementById("systemContainer");

    Object.entries(data).forEach(([name, system]) => {
      const card = document.createElement("div");
      card.classList.add("system-card");

      const mc = system.moonCount?.dwarf;

      const dMoonCount = Array.isArray(mc)
        ? mc.reduce((sum, n) => sum + n, 0)
        : typeof mc === "number"
          ? mc
          : 0;

      let dist, unit;
      const distToSun = system.distToSun * 3.262;
      if (distToSun >= 0 && distToSun <= 999) {
        dist = distToSun;
        unit = "ly";
      } else if (distToSun >= 1000 && distToSun <= 999999) {
        dist = distToSun / 1000;
        unit = "kly";
      } else if (distToSun >= 1000000 && distToSun <= 999999999) {
        dist = distToSun / 1000000;
        unit = "mly";
      } else if (distToSun >= 1000000000) {
        dist = distToSun / 1000000000;
        unit = "gly";
      }

      card.innerHTML = `
                <div class="system-info">
                    <div><strong><i class="fa-solid fa-address-card"></i> Name:</strong> ${name}
                    <div><strong><i class="fa-solid fa-pencil"></i> Designation:</strong> ${
                      system.designation
                    }
                    <div><strong><i class="fa-solid fa-calendar-days"></i> Discovery Date:</strong> ${
                      system.discDate
                    }
                    <div><strong><i class="fa-solid fa-satellite-dish"></i> Discovery Method:</strong> ${
                      system.discMethod
                    }
                    <div><strong><i class="fa-solid fa-user-secret"></i> Pioneer:</strong> ${
                      system.pioneer
                    }
                    <div><strong><i class="fa-solid fa-diagram-project"></i> System Type:</strong> ${
                      system.systemType
                    }</div>
                    <div><strong><i class="fa-solid fa-sun"></i> Parent Sun:</strong> ${
                      system.parentSun
                    }</div>
                    <div><strong><i class="fa-solid fa-wave-square"></i> Spectral Class:</strong> ${
                      system.spectralClass
                    } (${getStarType(system.spectralClass)})</div>
                    <div><strong><i class="fa-solid fa-ruler-horizontal"></i> Distance to Sun:</strong> ${dist.toFixed(3)} ${unit}</div>
                    <div><strong><i class="fa-solid fa-globe"></i> Planet Count:</strong> Major: ${
                      system.planetCount.major
                    }, Dwarf: ${
                      system.planetCount.dwarf
                    } - Total: ${(system.planetCount.major += system.planetCount.dwarf)}</div>
                    <div><strong><i class="fa-solid fa-moon"></i> Moon Count:</strong> Major: ${
                      system.moonCount.major
                    }, Dwarf: ${dMoonCount} - Total: ${(system.moonCount.major +=
                      dMoonCount)}</div>
                    <div><strong><i class="fa-solid fa-dna"></i> Life?:</strong> ${
                      system.life.exists ? "Yes" : "No"
                    }</div>
                </div>
                <div class="system-image">
                    <img src="${
                      system.thumbnail
                    }" alt="${name}" class=\"system-image\">
                </div>
            `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
}

loadSystems();

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
