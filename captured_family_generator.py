# -*- coding: utf-8 -*-
# captured_family_generator.py
# Generates a Space Engine .sc file for a captured minor moon family
# orbiting a PLANET (never a star). Modeled on AsBeCre v0.4.0 Krypton
# (JackDole / FaceDeer / JD) input flow, restyled for irregular outer
# moon families like Jupiter's Ananke/Carme/Pasiphae groups.
#
# Mass-from-radius uses the same constant-density sphere model as
# planetRadius.js rockyAsteroid / icyAsteroid types:
#   rocky: 2.0 g/cm3   icy: 0.55 g/cm3
#   R_Earth = scale * M_Earth^(1/3)

import random
import math

AU = 149597870.691
EARTH_RADIUS_KM = 6371.0
SOL_MASS_OF_EARTH = 3.00316726157558694887e-6

# constant-density scale constants, lifted straight from planetRadius.js
ROCKY_DENSITY_GCM3 = 2.0
ICY_DENSITY_GCM3 = 0.55
ROCKY_SCALE = 1.402145   # (3*ME / (4*pi*2000 kg/m3))^(1/3) / RE
ICY_SCALE = 2.156165     # (3*ME / (4*pi*550 kg/m3))^(1/3) / RE

def get_input(prompt):
    return input(prompt)

def ask_float(prompt, default):
    raw = get_input(f"{prompt}\nDefault = {default} : ")
    if raw.strip() == '':
        return default
    return float(raw)

def ask_int(prompt, default):
    raw = get_input(f"{prompt}\nDefault = {default} : ")
    if raw.strip() == '':
        return default
    return int(raw)

def ask_str(prompt, default):
    raw = get_input(f"{prompt}\nDefault = {default} : ")
    if raw.strip() == '':
        return default
    return raw

# radius (km) -> mass (M_Earth), constant bulk density sphere
def radius_to_mass_earth(radius_km, composition):
    r_earth = radius_km / EARTH_RADIUS_KM
    scale = ROCKY_SCALE if composition == 'rocky' else ICY_SCALE
    mass_earth = (r_earth / scale) ** 3
    return mass_earth

# gaussian clamp helper, same distribution style as AsBeCre's randomGenerator
def gaussian(a, b):
    result = random.gauss((a + b) / 2.0, (b - a) / 6.0)
    return max(min(result, b), a)

def uniform(a, b):
    return random.uniform(a, b)

random_generator = gaussian

class Orbit:
    def print_it(self):
        lines = ['\tOrbit\n\t{']
        lines.append(f'\t\tEpoch\t\t\t{self.epoch}')
        lines.append(f'\t\tSemiMajorAxis\t{self.semi}')
        lines.append(f'\t\tEccentricity\t{self.eccen}')
        lines.append(f'\t\tInclination\t\t{self.incl}')
        lines.append(f'\t\tAscendingNode\t{self.ascen}')
        lines.append(f'\t\tArgOfPericenter\t{self.argof}')
        lines.append(f'\t\tMeanAnomaly\t\t{self.mean}')
        lines.append(f'\t\tRefPlane\t\t"{self.refplane}"')
        lines.append('\t}')
        return '\n'.join(lines)

class Moon:
    def print_it(self):
        lines = [f'DwarfMoon "{self.name}"\n{{']
        lines.append(f'\tParentBody\t"{self.parent}"')
        lines.append(f'\tClass\t\t"Asteroid"')
        lines.append(f'\tMass\t\t{self.mass:.10e}')
        lines.append(f'\tRadius\t\t{self.radius:.4f}')
        lines.append(f'\tAlbedo\t\t{self.albedo:.2f}')
        lines.append(self.orbit.print_it())
        lines.append('}')
        return '\n'.join(lines)

def main():
    print('Captured Minor Moon Family Generator')
    print('For PLANETS only -- never for stars.\n')
    print('-' * 70)

    # Parent PLANET (never a star)
    parent_planet = get_input('Parent planet name (required, e.g. "Viron") : ')
    while parent_planet.strip() == '':
        print('A parent planet is required. This tool does not generate families around stars.')
        parent_planet = get_input('Parent planet name : ')
    print(parent_planet + '\n')

    # rocky or icy composition -- drives the mass-from-radius model
    print('Asteroid composition:\n  1 = Rocky (silicate/metallic, ~2.0 g/cm3)\n  2 = Icy (cometary nucleus, ~0.55 g/cm3)')
    comp_choice = get_input('Default = 1 : ')
    composition = 'icy' if comp_choice.strip() == '2' else 'rocky'
    density = ICY_DENSITY_GCM3 if composition == 'icy' else ROCKY_DENSITY_GCM3
    print(f'{composition} ({density} g/cm3)\n')

    family_name = ask_str('Name for this family of moons (a serial number is appended)', parent_planet + '.F')

    count = ask_int('Number of moons in this family', 15)

    # orbital radius bounds around the planet, in km (irregular moon families sit
    # tens of millions of km out, so km is the natural unit here, not AU)
    inner_radius_km = ask_float('Inner semi-major axis of family (km from planet center)', 15000000.0)
    outer_radius_km = ask_float('Outer semi-major axis of family (km from planet center)', 22000000.0)

    min_moon_radius_km = ask_float('Minimum moon radius (km)', 0.5)
    max_moon_radius_km = ask_float('Maximum moon radius (km)', 30.0)

    min_eccen = ask_float('Minimum eccentricity', 0.10)
    max_eccen = ask_float('Maximum eccentricity', 0.35)

    main_incl = ask_float('Family center inclination (degrees, 0-180)', 150.0)
    incl_spread = ask_float('Inclination variation +/- (degrees)', 8.0)

    retrograde = main_incl > 90.0

    asc_node = ask_float('Ascending node (degrees, random if 0)', 0.0)

    ref_plane = ask_str('Reference plane (Ecliptic, Equator, Extrasolar)', 'Ecliptic')

    epoch = ask_float('Epoch (Julian date)', 2457395.5)

    file_name = ask_str('Output file name', family_name.replace('.', '_'))
    file_name = f'{file_name}_{count}.sc'

    print(f'\nCreating: {file_name}\n')
    print('-' * 70)

    moons_text = []
    for i in range(1, count + 1):
        semi_km = random_generator(inner_radius_km, outer_radius_km)
        radius_km = random_generator(min_moon_radius_km, max_moon_radius_km)
        mass_earth = radius_to_mass_earth(radius_km, composition)

        incl = random_generator(-incl_spread, incl_spread) + main_incl
        eccen = random_generator(min_eccen, max_eccen)
        argof = uniform(0, 360)
        ascen = asc_node if asc_node != 0.0 else uniform(0, 360)
        mean = uniform(0, 180)

        orbit = Orbit()
        orbit.semi = semi_km / AU  # SE wants AU for SemiMajorAxis
        orbit.eccen = round(eccen, 4)
        orbit.incl = round(incl, 2)
        orbit.ascen = round(ascen, 2)
        orbit.argof = round(argof, 2)
        orbit.mean = round(mean, 2)
        orbit.refplane = ref_plane
        orbit.epoch = epoch

        moon = Moon()
        moon.name = f'{family_name}{i}'
        moon.parent = parent_planet
        moon.radius = round(radius_km, 3)
        moon.mass = mass_earth
        moon.albedo = round(random_generator(0.03, 0.12), 3)  # dark captured-body albedo
        moon.orbit = orbit

        moons_text.append(moon.print_it())

    with open(file_name, 'w') as f:
        f.write(f'// Captured minor moon family made with captured_family_generator.py\n')
        f.write(f'// ParentPlanet    = {parent_planet}\n')
        f.write(f'// FamilyName      = {family_name}\n')
        f.write(f'// Composition     = {composition} ({density} g/cm3)\n')
        f.write(f'// Count           = {count}\n')
        f.write(f'// InnerRadiusKm   = {inner_radius_km}\n')
        f.write(f'// OuterRadiusKm   = {outer_radius_km}\n')
        f.write(f'// MinMoonRadiusKm = {min_moon_radius_km}\n')
        f.write(f'// MaxMoonRadiusKm = {max_moon_radius_km}\n')
        f.write(f'// MainInclination = {main_incl}  ({"retrograde" if retrograde else "prograde"})\n')
        f.write(f'// InclSpread      = {incl_spread}\n')
        f.write(f'// EccentricityRange = {min_eccen}-{max_eccen}\n')
        f.write(f'// RefPlane        = {ref_plane}\n\n')
        f.write('\n\n'.join(moons_text))

    print(f'Done. {count} moons written to {file_name}.')
    print(f'Family is {"retrograde" if retrograde else "prograde"} (center inclination {main_incl} deg).')

if __name__ == '__main__':
    main()
