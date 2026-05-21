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
#
# Fully procedural and interactive.
#
# Designed for Space Engine .sc generation.
# ============================================================

import random
import math
from dataclasses import dataclass
from datetime import datetime

AU = 149597870.691
EARTH_MASS = 5.9736e24


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

    refplane: str = "Ecliptic"

    epoch: float = 2459396.5

    base_name: str = "NEO"

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
        settings.max_eccentricity = 0.45

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

        settings.min_eccentricity = 0.10
        settings.max_eccentricity = 0.50

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

        settings.min_eccentricity = 0.0
        settings.max_eccentricity = 0.12

        settings.max_inclination = 15

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

    return settings


# ============================================================
# ORBIT GENERATOR
# ============================================================

def generate_crossing_orbit(settings):

    while True:

        orbit = Orbit()

        population = settings.population_type.lower()

        # ====================================================
        # SEMI-MAJOR AXIS
        # ====================================================

        if population == "apollo":

            orbit.semi = gaussian(
                settings.planet_orbit * 1.02,
                settings.planet_orbit * 3.5
            )

        elif population == "aten":

            orbit.semi = gaussian(
                settings.planet_orbit * 0.4,
                settings.planet_orbit * 0.98
            )

        elif population == "amor":

            orbit.semi = gaussian(
                settings.planet_orbit * 1.05,
                settings.planet_orbit * 2.5
            )

        elif population == "atira":

            orbit.semi = gaussian(
                settings.planet_orbit * 0.1,
                settings.planet_orbit * 0.95
            )

        elif population == "trojan":

            orbit.semi = gaussian(
                settings.planet_orbit * 0.995,
                settings.planet_orbit * 1.005
            )

        elif population == "comet":

            orbit.semi = gaussian(
                settings.planet_orbit * 3,
                settings.planet_orbit * 100
            )

        else:

            orbit.semi = gaussian(
                settings.planet_orbit * 0.5,
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

        else:

            orbit.incl = gaussian(
                -settings.max_inclination,
                settings.max_inclination
            )

        # ====================================================
        # OTHER ORBITAL ELEMENTS
        # ====================================================

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

        else:

            valid = True

        if valid:
            return orbit


# ============================================================
# MAIN GENERATOR
# ============================================================

def GeneratePopulation(settings):

    output = []

    output.append(
f'''// =====================================================
// Custom NEO Population Generator
// Generated {datetime.today()}
// =====================================================

// Parent Body: {settings.parent_body}
// Population: {settings.population_type}
// Count: {settings.count}
// Planet Orbit: {settings.planet_orbit} AU
'''
    )

    for i in range(settings.count):

        body = SmallBody()

        body.name = (
            f"{settings.base_name}{i+1}"
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

        body.orbit = generate_crossing_orbit(settings)

        # ====================================================
        # COLORS
        # ====================================================

        population = settings.population_type.lower()

        if population == "comet":

            body.color = "(0.7 0.8 1.0)"

        elif population == "trojan":

            body.color = "(1.0 0.8 0.4)"

        elif random.random() < 0.15:

            body.color = "(0.5 0.5 0.6)"

        # ====================================================
        # WRITE OBJECT
        # ====================================================

        output.append(body.print_sc())

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


# ============================================================
# INTERACTIVE INPUT
# ============================================================

if __name__ == "__main__":

    print("====================================================")
    print("Custom Space Engine NEO Generator")
    print("====================================================")

    parent_body = input("Parent body: ")

    population_type = input(
        "Population type (Apollo/Aten/Amor/Atira/Trojan/Comet): "
    )

    count = int(
        input("Number of objects: ")
    )

    base_name = input(
        "Asteroid base name/prefix: "
    )

    if base_name == "":
        base_name = population_type[:2]

    planet_orbit = float(
        input("Planet orbit (AU): ")
    )

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

        output_file=output_file
    )

    settings = ApplyPopulationPreset(settings)

    GeneratePopulation(settings)