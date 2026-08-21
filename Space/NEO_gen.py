# ============================================================
# Custom Space Engine NEO Generator
# ============================================================
# Generates:
# - Apollo analogues
# - Aten analogues
# - Amor analogues
# - Atira analogues
# - Trojan populations
# - Comet populations
# - Potentially Hazardous Asteroid (PHA) analogues
# - "All" mode: generates every population type at once for a given planet
#
# Fully procedural and interactive.
#
# Designed for Space Engine .sc generation.
# ============================================================

import random
import math
from dataclasses import dataclass, replace
from datetime import datetime

AU = 149597870.691
EARTH_MASS = 5.9736e24

# Every real population type the generator knows how to build.
# Used for validating input and for expanding the "all" option.
POPULATION_TYPES = [
    "apollo",
    "aten",
    "amor",
    "atira",
    "trojan",
    "comet",
    "pha",
]

# The built-in lower bound each population type uses for its semi-major
# axis, as a multiple of the planet's own orbit. Mirrors the values in
# generate_crossing_orbit -- used only to show a meaningful default when
# prompting for a minimum semi-major axis override.
MIN_SEMI_FACTORS = {
    "apollo": 1.02,
    "aten": 0.4,
    "amor": 1.05,
    "atira": 0.1,
    "comet": 3,
    "pha": 0.4,
}


# ============================================================
# SETTINGS
# ============================================================

@dataclass
class PopulationSettings:

    parent_body: str
    population_type: str
    count: int

    planet_orbit: float

    crossing_limit: float

    min_radius: float
    max_radius: float

    min_eccentricity: float
    max_eccentricity: float

    max_inclination: float
    min_inclination: float = 0.0

    refplane: str = "Ecliptic"

    epoch: float = 2459396.5

    base_name: str = "NEO"

    # Trojan-specific: the host planet's own orbital elements (needed to
    # compute its mean longitude, which anchors the L4/L5 Lagrange points),
    # which Lagrange point(s) to populate, and how tightly objects cluster
    # around that point.
    host_ascending_node: float = 0.0
    host_arg_pericenter: float = 0.0
    host_mean_anomaly: float = 0.0
    trojan_point: str = "L4"
    trojan_spread: float = 15.0

    # Optional floor on semi-major axis for all non-Trojan population
    # types (Apollo/Aten/Amor/Atira/Comet/PHA). 0.0 means "no override" --
    # each type keeps its own built-in minimum. Useful for systems with
    # multiple planets close together, where an asteroid meant to belong
    # to an outer planet could otherwise generate closer to an inner one.
    min_semi_override: float = 0.0

    output_file: str = "CustomNEOs.sc"


# ============================================================
# ORBIT CLASS
# ============================================================

class Orbit:

    def __init__(self):

        self.semi = 1.0
        self.eccen = 0.0
        self.incl = 0.0
        self.ascen = 0.0
        self.argof = 0.0
        self.mean = 0.0

        self.refplane = "Ecliptic"
        self.epoch = 2459396.5

    def print_sc(self):

        return f'''
\tOrbit
\t{{
\t\tEpoch\t\t\t{self.epoch}
\t\tSemiMajorAxis\t{self.semi}
\t\tEccentricity\t{self.eccen}
\t\tInclination\t\t{self.incl}
\t\tAscendingNode\t{self.ascen}
\t\tArgOfPericen\t{self.argof}
\t\tMeanAnomaly\t\t{self.mean}
\t\tRefPlane\t\t"{self.refplane}"
\t}}
'''


# ============================================================
# ASTEROID CLASS
# ============================================================

class SmallBody:

    def __init__(self):

        self.name = ""
        self.parent = ""

        self.radius = 1.0
        self.mass = 0.0

        self.rotation = 1.0
        self.obliquity = 0.0

        self.orbit = Orbit()

        self.color = None

    def print_sc(self):

        output = []

        output.append(
f'''Asteroid "{self.name}"
{{
\tParentBody\t"{self.parent}"
\tClass\t\t"Asteroid"

\tRadius\t\t{self.radius}
\tMass\t\t{self.mass}

\tRotationPeriod\t{self.rotation}
\tObliquity\t\t{self.obliquity}
''')

        if self.color:
            output.append(f'\tColor\t\t\t{self.color}')

        output.append(self.orbit.print_sc())

        output.append("}")

        return "\n".join(output)


# ============================================================
# RANDOM HELPERS
# ============================================================

def gaussian(a, b):

    value = random.gauss(
        (a + b) / 2.0,
        (b - a) / 6.0
    )

    return max(min(value, b), a)


# ============================================================
# POWER-LAW RADIUS DISTRIBUTION
# ============================================================

def power_law_radius(min_radius, max_radius, exponent=2.8):

    r = random.random()

    minimum = min_radius ** (-exponent + 1)
    maximum = max_radius ** (-exponent + 1)

    result = (
        minimum + r * (maximum - minimum)
    ) ** (1 / (-exponent + 1))

    return result


# ============================================================
# ORBIT HELPERS
# ============================================================

def perihelion(a, e):
    return a * (1 - e)


def aphelion(a, e):
    return a * (1 + e)


# ============================================================
# NEO CLASSIFICATION
# ============================================================

def is_apollo(a, e, target_orbit, limit):

    q = perihelion(a, e)

    return (
        a > target_orbit and
        q <= target_orbit + limit
    )


def is_aten(a, e, target_orbit, limit):

    Q = aphelion(a, e)

    return (
        a < target_orbit and
        Q >= target_orbit - limit
    )


def is_amor(a, e, target_orbit, limit):

    q = perihelion(a, e)

    return (
        q > target_orbit + limit and
        q <= target_orbit + limit * 4
    )


def is_atira(a, e, target_orbit, limit):

    Q = aphelion(a, e)

    return Q < target_orbit - limit


def is_pha(a, e, target_orbit, limit):

    # Real Potentially Hazardous Asteroids are NEAs (Apollo/Aten/Amor-like)
    # whose orbit passes within a very tight distance of the target planet's
    # orbit (in reality: MOID <= 0.05 AU of Earth). Here "limit" plays the
    # role of that close-approach distance, scaled to the planet's orbit.

    q = perihelion(a, e)
    Q = aphelion(a, e)

    if a > target_orbit:
        approach_distance = q - target_orbit
    else:
        approach_distance = target_orbit - Q

    return abs(approach_distance) <= limit


# ============================================================
# AUTOMATIC POPULATION PRESETS
# ============================================================

def ApplyPopulationPreset(settings):

    population = settings.population_type.lower()

    # ========================================================
    # Apollo
    # ========================================================

    if population == "apollo":

        settings.crossing_limit = (
            0.03 + settings.planet_orbit * 0.04
        )

        settings.min_radius = 0.05
        settings.max_radius = 60

        settings.min_eccentricity = 0.15
        settings.max_eccentricity = 0.70

        settings.max_inclination = 40

    # ========================================================
    # Aten
    # ========================================================

    elif population == "aten":

        settings.crossing_limit = (
            0.02 + settings.planet_orbit * 0.025
        )

        settings.min_radius = 0.03
        settings.max_radius = 35

        settings.min_eccentricity = 0.10
        settings.max_eccentricity = 0.60

        settings.max_inclination = 35

    # ========================================================
    # Amor
    # ========================================================

    elif population == "amor":

        settings.crossing_limit = (
            0.04 + settings.planet_orbit * 0.06
        )

        settings.min_radius = 0.05
        settings.max_radius = 80

        settings.min_eccentricity = 0.10
        settings.max_eccentricity = 0.60

        settings.max_inclination = 30

    # ========================================================
    # Atira
    # ========================================================

    elif population == "atira":

        settings.crossing_limit = (
            0.01 + settings.planet_orbit * 0.015
        )

        settings.min_radius = 0.02
        settings.max_radius = 20

        settings.min_eccentricity = 0.05
        settings.max_eccentricity = 0.35

        settings.max_inclination = 25

    # ========================================================
    # Trojan
    # ========================================================

    elif population == "trojan":

        settings.crossing_limit = (
            settings.planet_orbit * 0.002
        )

        settings.min_radius = 0.1
        settings.max_radius = 120

        # Based on the two known real Earth Trojans: 2010 TK7 (e=0.191)
        # and 2020 XL5 (e=0.387).
        settings.min_eccentricity = 0.15
        settings.max_eccentricity = 0.40

        # Based on the same two real Earth Trojans: 2010 TK7 (i=20.9 deg)
        # and 2020 XL5 (i=13.8 deg). Inclination is a positive angle from
        # the reference plane, not symmetric about 0.
        settings.min_inclination = 10
        settings.max_inclination = 25

    # ========================================================
    # Comets
    # ========================================================

    elif population == "comet":

        settings.crossing_limit = (
            0.2 + settings.planet_orbit * 0.08
        )

        settings.min_radius = 0.2
        settings.max_radius = 80

        settings.min_eccentricity = 0.6
        settings.max_eccentricity = 0.995

        settings.max_inclination = 180

    # ========================================================
    # PHA (Potentially Hazardous Asteroid)
    # ========================================================

    elif population == "pha":

        # Real PHAs are NEAs with MOID <= 0.05 AU of the target planet
        # and H <= 22 (roughly >= 140 m diameter). The crossing_limit
        # here stands in for that tight close-approach distance, scaled
        # to the planet's own orbit rather than a fixed absolute value.

        settings.crossing_limit = (
            0.01 + settings.planet_orbit * 0.008
        )

        # Real PHAs skew larger than the general NEA population since
        # small bodies aren't classified as "hazardous".
        settings.min_radius = 0.07
        settings.max_radius = 60

        # PHAs tend to be more eccentric on average than the general
        # NEA population, since higher eccentricity favors planet-crossing.
        settings.min_eccentricity = 0.20
        settings.max_eccentricity = 0.75

        settings.max_inclination = 45

    return settings


# ============================================================
# ORBIT GENERATOR
# ============================================================

def generate_crossing_orbit(settings, index=0):

    while True:

        orbit = Orbit()

        population = settings.population_type.lower()

        # ====================================================
        # SEMI-MAJOR AXIS
        # ====================================================

        if population == "apollo":

            orbit.semi = gaussian(
                max(settings.planet_orbit * 1.02, settings.min_semi_override),
                settings.planet_orbit * 3.5
            )

        elif population == "aten":

            orbit.semi = gaussian(
                max(settings.planet_orbit * 0.4, settings.min_semi_override),
                settings.planet_orbit * 0.98
            )

        elif population == "amor":

            orbit.semi = gaussian(
                max(settings.planet_orbit * 1.05, settings.min_semi_override),
                settings.planet_orbit * 2.5
            )

        elif population == "atira":

            orbit.semi = gaussian(
                max(settings.planet_orbit * 0.1, settings.min_semi_override),
                settings.planet_orbit * 0.95
            )

        elif population == "trojan":

            # Trojans sit in exact 1:1 co-orbital resonance with the host
            # planet. Locking the semi-major axis to exactly match the
            # planet's (rather than adding noise) keeps their orbital
            # period identical to the planet's, so the resonance holds up
            # over long timescales in SE instead of slowly drifting apart.
            orbit.semi = settings.planet_orbit

        elif population == "comet":

            orbit.semi = gaussian(
                max(settings.planet_orbit * 3, settings.min_semi_override),
                settings.planet_orbit * 100
            )

        elif population == "pha":

            # PHAs are drawn from the combined Apollo/Aten/Amor
            # semi-major axis range, all tied to the planet's orbit.
            orbit.semi = gaussian(
                max(settings.planet_orbit * 0.4, settings.min_semi_override),
                settings.planet_orbit * 2.5
            )

        else:

            orbit.semi = gaussian(
                max(settings.planet_orbit * 0.5, settings.min_semi_override),
                settings.planet_orbit * 5
            )

        # ====================================================
        # ECCENTRICITY
        # ====================================================

        orbit.eccen = gaussian(
            settings.min_eccentricity,
            settings.max_eccentricity
        )

        # ====================================================
        # INCLINATION
        # ====================================================

        if population == "comet":

            orbit.incl = random.uniform(0, 180)

        elif population == "trojan":

            orbit.incl = gaussian(
                settings.min_inclination,
                settings.max_inclination
            )

        else:

            orbit.incl = gaussian(
                -settings.max_inclination,
                settings.max_inclination
            )

        # ====================================================
        # OTHER ORBITAL ELEMENTS
        # ====================================================

        if population == "trojan":

            # Follows the AsBeCre Trojan/Hilda generator's approach exactly:
            # the planet's mean longitude anchors the L4/L5 points, and
            # Trojans are scattered around whichever point(s) were chosen.
            host_lambda = (
                settings.host_mean_anomaly +
                settings.host_arg_pericenter +
                settings.host_ascending_node
            )

            point = settings.trojan_point.lower()

            if point == "l4":
                target_lambda = host_lambda + 60
            elif point == "l5":
                target_lambda = host_lambda - 60
            else:  # both -- alternate L4/L5 by object index
                if index % 2 == 0:
                    target_lambda = host_lambda + 60
                else:
                    target_lambda = host_lambda - 60

            # Angular spreading around the Lagrange point.
            target_lambda += random.uniform(
                -settings.trojan_spread, settings.trojan_spread
            )

            # Trojans aren't perihelion-locked the way Hildas are -- their
            # stability comes from the effective potential well at L4/L5,
            # not from a resonant angle involving perihelion. So orientation
            # can be randomized freely.
            orbit.ascen = random.uniform(0, 360)
            orbit.argof = random.uniform(0, 360)
            orbit.mean = target_lambda - orbit.argof - orbit.ascen

            # Normalize for SpaceEngine's expected range (-360 to 360).
            while orbit.mean > 360:
                orbit.mean -= 360
            while orbit.mean < -360:
                orbit.mean += 360
            while orbit.argof > 360:
                orbit.argof -= 360
            while orbit.argof < 0:
                orbit.argof += 360

        else:

            orbit.ascen = random.uniform(0, 360)
            orbit.argof = random.uniform(0, 360)
            orbit.mean = random.uniform(0, 360)

        orbit.refplane = settings.refplane
        orbit.epoch = settings.epoch

        # ====================================================
        # VALIDATION
        # ====================================================

        valid = False

        if population == "apollo":

            valid = is_apollo(
                orbit.semi,
                orbit.eccen,
                settings.planet_orbit,
                settings.crossing_limit
            )

        elif population == "aten":

            valid = is_aten(
                orbit.semi,
                orbit.eccen,
                settings.planet_orbit,
                settings.crossing_limit
            )

        elif population == "amor":

            valid = is_amor(
                orbit.semi,
                orbit.eccen,
                settings.planet_orbit,
                settings.crossing_limit
            )

        elif population == "atira":

            valid = is_atira(
                orbit.semi,
                orbit.eccen,
                settings.planet_orbit,
                settings.crossing_limit
            )

        elif population == "pha":

            valid = is_pha(
                orbit.semi,
                orbit.eccen,
                settings.planet_orbit,
                settings.crossing_limit
            )

        else:

            valid = True

        if valid:
            return orbit


# ============================================================
# MAIN GENERATOR
# ============================================================

def generate_bodies(settings, name_offset=0):

    # Generates the small-body .sc blocks for a single population and
    # returns them as a list of strings. Does not write anything to disk,
    # so it can be reused for both single-population runs and the
    # combined "all" mode.

    bodies = []

    for i in range(settings.count):

        body = SmallBody()

        body.name = (
            f"{settings.base_name}{name_offset + i + 1}"
        )

        body.parent = settings.parent_body

        # ====================================================
        # RADIUS
        # ====================================================

        body.radius = power_law_radius(
            settings.min_radius,
            settings.max_radius
        )

        # ====================================================
        # DENSITY
        # ====================================================

        density = random.uniform(1.8, 4.0)
        density *= 1e12 / EARTH_MASS

        body.mass = (
            4 / 3 *
            math.pi *
            body.radius ** 3 *
            density
        )

        # ====================================================
        # ROTATION
        # ====================================================

        body.rotation = random.uniform(0.5, 18)
        body.obliquity = random.uniform(0, 180)

        # ====================================================
        # ORBIT
        # ====================================================

        body.orbit = generate_crossing_orbit(settings, index=i)

        # ====================================================
        # COLORS
        # ====================================================

        population = settings.population_type.lower()

        if population == "comet":

            body.color = "(0.7 0.8 1.0)"

        elif population == "trojan":

            body.color = "(1.0 0.8 0.4)"

        elif population == "pha":

            body.color = "(0.9 0.3 0.25)"

        elif random.random() < 0.15:

            body.color = "(0.5 0.5 0.6)"

        # ====================================================
        # WRITE OBJECT
        # ====================================================

        bodies.append(body.print_sc())

    return bodies


def GeneratePopulation(settings):

    output = []

    header = f'''// =====================================================
// Custom NEO Population Generator
// Generated {datetime.today()}
// =====================================================

// Parent Body: {settings.parent_body}
// Population: {settings.population_type}
// Count: {settings.count}
// Planet Orbit: {settings.planet_orbit} AU
'''

    if settings.min_semi_override > 0 and settings.population_type.lower() != "trojan":
        header += f"// Minimum Semimajor Axis: {settings.min_semi_override} AU\n"

    if settings.population_type.lower() == "trojan":
        header += f'''// Planet AscendingNode: {settings.host_ascending_node} deg
// Planet ArgOfPericenter: {settings.host_arg_pericenter} deg
// Planet MeanAnomaly: {settings.host_mean_anomaly} deg
// Epoch: {settings.epoch}  (MUST match the epoch of the planet elements above)
// Trojan Location: {settings.trojan_point}
'''

    output.append(header)

    output.extend(generate_bodies(settings))

    # ========================================================
    # AUTO ADD .SC EXTENSION
    # ========================================================

    filename = settings.output_file

    if not filename.lower().endswith(".sc"):
        filename += ".sc"

    # ========================================================
    # WRITE FILE
    # ========================================================

    with open(filename, "w", encoding="utf-8") as file:

        file.write("\n\n".join(output))

    print(f"\nGenerated {filename}")


def GenerateAllPopulations(base_settings, split_count=False):

    # Generates every population type for the same parent body/planet,
    # each with its own preset applied, and writes them into a single
    # combined .sc file.
    #
    # split_count=False -> base_settings.count objects are generated
    #                       for EACH population type.
    # split_count=True  -> base_settings.count is treated as a TOTAL,
    #                       divided as evenly as possible across all
    #                       population types (remainder distributed to
    #                       the first few types).

    if split_count:

        base_count, remainder = divmod(
            base_settings.count, len(POPULATION_TYPES)
        )

        type_counts = [
            base_count + (1 if i < remainder else 0)
            for i in range(len(POPULATION_TYPES))
        ]

    else:

        type_counts = [base_settings.count] * len(POPULATION_TYPES)

    total_count = sum(type_counts)

    output = []

    header = f'''// =====================================================
// Custom NEO Population Generator ("All" mode)
// Generated {datetime.today()}
// =====================================================

// Parent Body: {base_settings.parent_body}
// Populations: {", ".join(t.title() for t in POPULATION_TYPES)}
// Count: {base_settings.count} ({"split across all populations" if split_count else "per population"})
// Total Objects: {total_count}
// Planet Orbit: {base_settings.planet_orbit} AU
'''

    if base_settings.min_semi_override > 0:
        header += (
            f"// Minimum Semimajor Axis (non-Trojan types): "
            f"{base_settings.min_semi_override} AU\n"
        )

    header += f'''// Planet AscendingNode: {base_settings.host_ascending_node} deg
// Planet ArgOfPericenter: {base_settings.host_arg_pericenter} deg
// Planet MeanAnomaly: {base_settings.host_mean_anomaly} deg
// Epoch: {base_settings.epoch}  (MUST match the epoch of the planet elements above)
// Trojan Location: {base_settings.trojan_point}
'''

    output.append(header)

    for population_type, type_count in zip(POPULATION_TYPES, type_counts):

        settings = replace(
            base_settings,
            population_type=population_type,
            base_name=f"{base_settings.base_name}{population_type.title()}",
            count=type_count,
        )

        settings = ApplyPopulationPreset(settings)

        output.append(
            f"// --- {population_type.title()} population ({type_count} objects) ---"
        )

        output.extend(generate_bodies(settings))

    filename = base_settings.output_file

    if not filename.lower().endswith(".sc"):
        filename += ".sc"

    with open(filename, "w", encoding="utf-8") as file:

        file.write("\n\n".join(output))

    print(f"\nGenerated {filename} (all population types)")


# ============================================================
# INTERACTIVE INPUT
# ============================================================

if __name__ == "__main__":

    print("====================================================")
    print("Custom Space Engine NEO Generator")
    print("====================================================")

    parent_body = input("Parent body: ")

    # Numbered menu: population types first, "All" last.
    menu_types = POPULATION_TYPES + ["all"]

    print("Population type:")

    for i, type_name in enumerate(menu_types, start=1):

        label = type_name.upper() if type_name == "pha" else type_name.title()

        if type_name == "all":
            label += "  (generates every type above for this planet)"

        print(f"  {i}. {label}")

    while True:

        choice = input(f"Choose a population type (1-{len(menu_types)}): ").strip()

        if choice.isdigit() and 1 <= int(choice) <= len(menu_types):
            population_type = menu_types[int(choice) - 1]
            break

        print(f"Please enter a number from 1 to {len(menu_types)}.")

    split_count = False

    if population_type == "all":

        print("How should the object count be applied?")
        print("  1. Same count for EACH population type")
        print("  2. Split a TOTAL count evenly across all population types")

        while True:

            count_mode = input("Choose an option (1-2): ").strip()

            if count_mode in ("1", "2"):
                split_count = (count_mode == "2")
                break

            print("Please enter 1 or 2.")

    count = int(
        input(
            "Total number of objects: " if split_count
            else ("Number of objects per population type: " if population_type == "all"
                  else "Number of objects: ")
        )
    )

    base_name = input(
        "Asteroid base name/prefix: "
    )

    if base_name == "":
        if population_type == "all":
            base_name = "NEO"
        else:
            base_name = population_type[:2]

    planet_orbit = float(
        input("Planet orbit (AU): ")
    )

    # Optional floor on semi-major axis, for every population type except
    # Trojans (which are locked to the planet's own orbit anyway). Useful
    # when a system has multiple planets close together and an asteroid
    # meant for the outer one could otherwise generate too close to an
    # inner one.
    min_semi_override = 0.0

    if population_type != "trojan":

        print(
            "Minimum semimajor axis: sets a floor on how close-in "
            "generated asteroids/comets can be. Applies to whichever "
            "population type(s) you're generating here (all of "
            "Apollo/Aten/Amor/Atira/Comet/PHA -- not Trojans, which are "
            "locked to the planet's own orbit)."
        )

        if population_type == "all":
            default_text = (
                "0 (no override -- each population type keeps its own "
                "built-in minimum)"
            )
        else:
            natural_default = (
                MIN_SEMI_FACTORS.get(population_type, 0.5) * planet_orbit
            )
            default_text = (
                f"{natural_default:g} AU (this population type's built-in "
                "minimum, based on planet orbit)"
            )

        min_semi_input = input(
            f"Minimum semimajor axis (AU)\nDefault = {default_text} : "
        ).strip()

        if min_semi_input != "":
            min_semi_override = float(min_semi_input)

    # Trojans are anchored to the planet's Lagrange points, which requires
    # knowing the planet's own orbital orientation. Ask for this whenever
    # Trojans could be generated -- either directly, or as part of "All".
    host_ascending_node = 0.0
    host_arg_pericenter = 0.0
    host_mean_anomaly = 0.0
    trojan_point = "L4"
    epoch = 2459396.5

    if population_type in ("trojan", "all"):

        print("\nOrbital parameters for Trojans:")

        host_node_input = input(
            "Planet Ascending Node (deg)\nDefault = 0.0 : "
        )
        host_ascending_node = (
            float(host_node_input) if host_node_input != "" else 0.0
        )

        host_arg_input = input(
            "Planet Argument of Pericenter (deg)\nDefault = 0.0 : "
        )
        host_arg_pericenter = (
            float(host_arg_input) if host_arg_input != "" else 0.0
        )

        host_mean_input = input(
            "Planet Mean Anomaly (deg)\nDefault = 0.0 : "
        )
        host_mean_anomaly = (
            float(host_mean_input) if host_mean_input != "" else 0.0
        )

        # CRITICAL for alignment: the Node/Peri/Anomaly above only describe
        # where the planet actually is if paired with the epoch they were
        # taken from. If the Trojans are stamped with a different epoch,
        # SpaceEngine will propagate them from a different moment in time
        # than the planet's real position, and they will NOT appear near
        # L4/L5 no matter how correct the angular math is. This should
        # match whatever epoch the planet's own .sc file uses.
        while True:

            epoch_input = input(
                "Epoch matching the planet's orbital elements above\n"
                "Default = 2451545 (J2000) : "
            ).strip()

            if epoch_input == "":
                # Keep the default as plain text -- no numeric parsing --
                # so it never picks up a spurious '.0'.
                epoch = "2451545"
                break

            try:
                float(epoch_input)  # validate it's actually numeric
                # Keep exactly what was typed (decimal or not) instead of
                # reformatting through float(), which would turn a whole
                # number like "2451545" into "2451545.0".
                epoch = epoch_input
                break
            except ValueError:
                print("Please enter a valid number.")

        print("Trojan location:")
        print("  1. L4 (leading)")
        print("  2. L5 (trailing)")
        print("  3. Both")

        while True:

            trojan_choice = input("Choose Trojan location (1-3): ").strip()

            if trojan_choice in ("1", "2", "3"):
                trojan_point = {"1": "L4", "2": "L5", "3": "both"}[trojan_choice]
                break

            print("Please enter 1, 2, or 3.")

    refplane = input(
        "Reference plane (Ecliptic/Equator/Extrasolar): "
    )

    if refplane == "":
        refplane = "Ecliptic"

    output_file = input(
        "Output file name: "
    )

    if output_file == "":
        output_file = "CustomNEOs"

    settings = PopulationSettings(

        parent_body=parent_body,
        population_type=population_type,
        count=count,
        base_name=base_name,

        planet_orbit=planet_orbit,

        crossing_limit=0.0,

        min_radius=0.0,
        max_radius=0.0,

        min_eccentricity=0.0,
        max_eccentricity=0.0,

        max_inclination=0.0,

        refplane=refplane,

        epoch=epoch,

        host_ascending_node=host_ascending_node,
        host_arg_pericenter=host_arg_pericenter,
        host_mean_anomaly=host_mean_anomaly,
        trojan_point=trojan_point,

        min_semi_override=min_semi_override,

        output_file=output_file
    )

    if population_type == "all":

        GenerateAllPopulations(settings, split_count=split_count)

    else:

        settings = ApplyPopulationPreset(settings)

        GeneratePopulation(settings)