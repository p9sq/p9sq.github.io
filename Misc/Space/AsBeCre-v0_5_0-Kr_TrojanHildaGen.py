# -*- coding: utf-8 -*- 

import locale, platform, sys, random, math
from datetime import datetime

# AsterBeltCreator v0.4.0 Krypton version
# by JackDole
# 2018.12.22 07:51:22
# converted to Python and enhanced by FaceDeer
# more enhanced by JD

# Some English strings corrected by LookAtDaDakka
# Object type 'DwarfMoon' added at the suggestion of LookAtDatDakka
# Default number of items reduced to 50
# Order of the parameter query changed. Now parent object is asked first.
# Numbering offset added for dwarf moons. So that with an offset of 1000, the numbering starts at 'ParentBody.D1001' instead at 'ParentBody.D1'.
# Binaries and moons for dwarf moons disabled.
# Shall moons and binary partners be classified as 'DwarfMoon'

# this version works with Python  2.7 and 3.4

#-------------------------------------------------------------------------------

Locale = locale.getdefaultlocale()
Version = 'Python ' + (platform.python_version())
print (Version + '\n')

# english default strings
LngStr01 = "Preset \n 1 = Vulcanoids \n 2 = Oort cloud \n 0 = No preset \n x = Exit : "
LngStr02 = "Type of object \n 1 = Asteroid \n 2 = DwarfMoon \n Default = 1 : "
LngStr03 = "Number of objects \n Default = 50 : "
LngStr04 = "Name for group of objects \n Default = "
LngStr05 = "Parent object \n Default = Sol : "
LngStr06 = "Is the Parent object a barycenter?\n 1 = yes \n 0 = no \n Default = 0 : "
LngStr07 = "Total mass of the main objects in solar mass."
LngStr08 = "If your object have Earth Mass, put a '-' sign for the number"
LngStr09 = "Example = Earth + Moon = 1 + 0.012302 = -1.012302"
LngStr10 = "Must be specified; an approximate value is sufficient. : "
LngStr11 = "Minimum radius in AU or KM"
LngStr12 = "If you have KM, put a '-' sign for the number"
LngStr14 = " Default = 5.0 AU : "
LngStr15 = "Maximum radius in AU or KM"
LngStr16 = "If you have KM, put a '-' sign for the number"
LngStr17 = " Default = 6.0 AU : "
LngStr18 = "Minimum radius of objects in km \n Default = 0.1 : "
LngStr19 = "Maximum radius of objects in km \n Default = 50.0 : "
LngStr20 = "Maximum eccentricity of orbit\n Default = 0.1 : "
LngStr21 = "Minimum eccentricity of orbit\n Default = 0.0 : "
LngStr22 = "Minimum inclination in degrees \n Default = 0.0 : "
LngStr225 = "Maximum inclination in degrees \n Default = 10.0 : "
LngStr23 = "RefPlane (Ecliptic, Equator, Extrasolar) \n Default = Ecliptic : "
LngStr24 = "Epoch \n Default = 2451545 : "
LngStr25 = "Output file name \n Default = "
LngStr26 = "Inclination to the reference plane in degree \n Default = 0 : "
LngStr27 = "AscendingNode in degrees \n Random value if 0 \n Default = 0 : "
LngStr28 = "Numbering Offset for dwarf moons \n Default = 0 : "
LngStr29 = "Shall moons and binary partners be classified as 'DwarfMoon'? \n 1 = Yes \n 0 = No \n Default = 0 (No)"
#LngStr30 = "Minimum distance between binary objects in km \n Default = 0 (Value is generated randomly) : "

if Locale[0] == 'de_DE':
    # german strings
    LngStr01 = "Voreinstellungen \n 1 = Vulkanoiden \n 2 = Oortsche Wolke \n 0 = Keine Voreinstellungen \n x = Ende : "
    LngStr02 = "Typ der Objekte \n 1 = Asteroiden \n 2 = Kometen \n 3 = Zwergmond \n Standard = 1 : "
    LngStr03 = "Anzahl der Objekte \n Standard = 50 : "
    LngStr04 = "Name der Objekte \n Eine laufende Nummer wird angefuegt. \n Standard = "
    LngStr05 = "Zentralobjekt \n Standard = Sol : "
    LngStr06 = "Ist das Zentralobjekt ein Barycenter ?\n 1 = Ja \n 0 = Nein \n Standard = 0 : "
    LngStr07 = "Totale Masse der Hauptobjekte des Systems in Sonnenmassen."
    LngStr08 = "Wenn du die Angaben in Erdmassen hast, setze ein '-' Zeichen vor der Zahl"
    LngStr09 = "Beispiel = Erde + Mond = 1 + 0.012302 = -1.012302"
    LngStr10 = "Muss angegeben werden. \n Ein angenaeherter Wert ist ausreichend. : "
    LngStr11 = "Innerer Radius in AU oder KM"
    LngStr12 = "Bei KM, setze ein '-' Zeichen vor der Zahl"
    LngStr14 = " Standard = 5.0 AU : "
    LngStr15 = "Aeusserer Radius in AU oder KM"
    LngStr16 = "Bei KM, setze ein '-' Zeichen vor der Zahl"
    LngStr17 = " Standard = 6.0 AU : "
    LngStr18 = "Minimaler Radius der Objekte in km \n Standard = 0.1 : "
    LngStr19 = "Maximaler Radius der Objekte in km \n Standard = 50.0 : "
    LngStr20 = "Maximale Exzentrizitaet der Umlaufbahn \n Standard = 0.1 : "
    LngStr21 = "Minimale Exzentrizitaet der Umlaufbahn \n Standard = 0.0 : "
    LngStr22 = "Maximale Variation der Inklination der Umlaufbahn in Grad \n Standard = 10.0 : "
    LngStr23 = "Referenze Ebene (Ecliptic, Equator, Extrasolar) \n Standard = Ecliptic : "
    LngStr24 = "Epoche \n Standard = 2451545 : "
    LngStr25 = "Name der Ausgabedatei \n Standard = "
    LngStr26 = "Neigung zur Referenzeebene in Grad \n Standard = 0 : "
    LngStr27 = "AscendingNode in Grad \n Wenn 0 wird ein zufaelliger Wert erzeugt \n Standard = 0 : "
    LngStr28 = "Numbering Offset for dwarf moons \n Default = 0 : "
    LngStr29 = "Sollen Monde und binaere Partner als 'DwarfMoon' eingestuft werden?"
    #LngStr30 = "Minimaler Abstand zwischen Binaeren Objekten in km \n Standard = 0 (Wert wird zufaellig erzeugt) : "

#-------------------------------------------------------------------------------

daysYear = 365.24218985
AU = 149597870.691
SolMassOfEarth = 3.00316726157558694887e-6
EarthMass = 5.9736e24

#uncomment this line if you want repeatable results
#random.seed(100)

#-------------------------------------------------------------------------------

def GetInput(s):
    if sys.version_info >= (3,0):
        return input(s)
    else:
        return raw_input(s)


def AskFloat(prompt, default):
    while True:
        text = GetInput(prompt)
        if text == '':
            return default
        try:
            return float(text)
        except ValueError:
            print ('Enter a number.')


# Select preset
MaxPresets = 20

while 1 == 1:
    ObjectType = 'Asteroid'
    nameOfAster = "Asteroid"
    defObjName = 'S'
    defFileName = "AsterBelt"
    RefPlane = 'Ecliptic'
    epoch = 2451545
    TotalMass = 0.0
    AscNode = 0.0
    numberingOffset = 0
    binAsDwarf = 0
    MainInclination = 0.0
    asterSuffix = ''
    asterColor = ''

    Preset = 0

    print ('------------------------------------------------------------------------------')

    if MaxPresets > 0:
        ts = LngStr01
        Preset = GetInput(ts)

        if Preset == 'x' or Preset == 'q':
            exit()
        if Preset == '':
            Preset = 0
        try:
            Preset = int(Preset)
        except ValueError:
            print ('Enter a number, or x to exit.\n')
            continue
        if Preset > MaxPresets:
            Preset = 0
        print (Preset)
        print ("")
        if Preset != 0:
            print ("Presets do not work in the Trojan version. Choose 0.\n")
            continue

    # Preset Vulcanoids
    if Preset == 1:
        NumberOfAster = 200
        AsterName = 'VS'
        CenterObject = 'Sol'
        InnerRadius = 0.15
        OuterRadius = 0.18
        MaxRadiusOfAster = 3
        MinRadiusOfAster = 0.1
        MaxEccentricity = 0.001
        MinEccentricity = 0.0
        MaxInclination = 10
        FileName = 'Vulcanoids'
        
    # Preset Oort cloud
    if Preset == 2:
        ObjectType = 'Comet'
        NumberOfAster = 7500        # 2000
        AsterName = 'OC'
        CenterObject = 'Sol'
        InnerRadius = 5000
        OuterRadius = 50000
        MaxRadiusOfAster = 500
        MinRadiusOfAster = 0.1
        MaxEccentricity = 0.3
        MinEccentricity = 0.0
        MaxInclination = 180
        FileName = 'OortCloud'
        #FileName = 'OortCloudComets'

    # Preset Kryptonit
    if Preset == 3:
        CenterObject    = 'LHS 2520'
        NumberOfAster   = 2000
        AsterName       = 'Kryptonit'
        InnerRadius     = 0.0501977
        OuterRadius     = 0.0601977
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 250.0
        MaxEccentricity = 0.1
        MinEccentricity = 0.0
        MaxInclination  = 3.0
        RefPlane        = 'Equator'
        FileName        = 'KryptonDebris'

    # Preset Halo
    if Preset == 4:
        CenterObject    = '34 Tauri(2020)'
        TotalMass       = 10.68
        NumberOfAster   = 1000
        AsterName       = 'Halo'
        InnerRadius     = 40
        OuterRadius     = 43
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 50.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 5.0
        RefPlane        = 'Ecliptic'
        epoch           = 2640740.5
        FileName        = 'Halo'
        
    # Preset Motherlode
    if Preset == 5:
        CenterObject    = '34 Tauri(2020) C'
        NumberOfAster   = 500
        AsterName       = 'Motherlode'
        InnerRadius     = 3.15
        OuterRadius     = 5.025
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 50.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 5.0
        RefPlane        = 'Ecliptic'
        epoch           = 2640740.5
        FileName        = 'Motherlode'
        
    # Preset Uroborus
    if Preset == 6:
        CenterObject    = '34 Tauri(2020) E'
        NumberOfAster   = 500
        AsterName       = 'Uroborus'
        InnerRadius     = 6.9
        OuterRadius     = 8.4
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 50.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 5.0
        RefPlane        = 'Ecliptic'
        epoch           = 2640740.5
        FileName        = 'Uroborus'
        
    # Preset Black Rose Seeds
    if Preset == 7:
        CenterObject    = 'Black Rose'
        ObjectType      = 'Asteroid'
        TotalMass       = 5
        NumberOfAster   = 500
        AsterName       = 'BRS'
        InnerRadius     = 230
        OuterRadius     = 240
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 250.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 3.0
        MainInclination = 36.0
        AscNode         = 320.0
        RefPlane        = 'Ecliptic'
        epoch           = 2640740.5
        FileName        = 'BlackRoseSeeds'
        
    # Preset Black Rose Dust
    if Preset == 8:
        CenterObject    = 'Black Rose'
        ObjectType      = 'Comet'
        TotalMass       = 5
        NumberOfAster   = 1500
        AsterName       = 'BRD'
        InnerRadius     = 900
        OuterRadius     = 1100
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 100.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 180.0
        MainInclination = 0.0
        RefPlane        = 'Ecliptic'
        epoch           = 2640740.5
        FileName        = 'BlackRoseDust'
        
    # Preset Black Rosary
    if Preset == 9:
        CenterObject    = 'Black Rose'
        ObjectType      = 'Asteroid'
        TotalMass       = 5
        NumberOfAster   = 1000
        AsterName       = 'BRos'
        InnerRadius     = 1800
        OuterRadius     = 2200
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 250.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 3.0
        MainInclination = 36.0
        AscNode         = 320.0
        RefPlane        = 'Ecliptic'
        epoch           = 2640740.5
        FileName        = 'BlackRosary'
        
    # Preset Eps Eri
    if Preset == 10:
        CenterObject    = 'Eps Eri'
        Objecttype      = 'Asteroid'
        NumberOfAster   = 1000
        AsterName       = 'EpsilonBeltA'
        InnerRadius     = 2.9
        OuterRadius     = 3.1
        MinRadiusOfAster = 0.1
        MaxRadiusOfAster = 250.0
        MaxEccentricity = 0.1
        MinEccentricity = 0.0
        MainInclination = 30.0
        MaxInclination  = 5.0
        AscNode         = 30.0
        RefPlane        = 'ExtraSolar'
        epoch           = 2454207.5
        FileName        = 'Eps_Eri_BeltA'
        
    # Preset Eps Eri
    if Preset == 11:
        CenterObject    = 'Eps Eri'
        Objecttype      = 'Asteroid'
        NumberOfAster   = 1000
        AsterName       = 'EpsilonBeltB'
        InnerRadius     = 19.5
        OuterRadius     = 20.5
        MinRadiusOfAster = 0.1
        MaxRadiusOfAster = 250.0
        MaxEccentricity = 0.1
        MinEccentricity = 0.0
        MainInclination = 30.0
        MaxInclination  = 5.0
        AscNode         = 30.0
        RefPlane        = 'ExtraSolar'
        epoch           = 2454207.5
        FileName        = 'Eps_Eri_BeltB'
        
    # Preset Golden Ribbon
    if Preset == 12:
        CenterObject    = 'Mars'
        Objecttype      = 'Asteroid'
        NumberOfAster   = 2000      # 1000
        AsterName       = 'GR'
        InnerRadius     = 0.0001336      #1.7
        OuterRadius     = 0.0001336      #1.7
        MinRadiusOfAster = 50.0          #5.0
        MaxRadiusOfAster = 50.0          #10.0
        MaxEccentricity = 0.0       #0934
        MinEccentricity = 0.0       #0934
        MainInclination = 0.0       #1.8506
        MaxInclination  = 5.0       #0.001
        AscNode         = 0.0         #49.479
        RefPlane        = 'Equator'
        epoch           = 2454207.5
        FileName        = 'GoldenRibbon'
        
    # Preset Incipisphere
    if Preset == 13:        
        CenterObject    = 'Skaia'
        Objecttype      = 'Asteroid'
        numberingOffset = 0
        NumberOfAster   = 500
        AsterName       = 'Skaia S'
        InnerRadius     = 0.000461236511464
        OuterRadius     = 0.00047460568571
        MinRadiusOfAster = 250.0
        MaxRadiusOfAster = 500.0
        MaxEccentricity = 0.0
        MinEccentricity = 0.0
        MainInclination = 0.0
        MaxInclination  = 1.0
        AscNode         = 0.0
        RefPlane        = 'Equator'
        FileName        = 'SkaiaAsterBelt'      #_500.sc
        
    # Preset Extra Asteroids
    if Preset == 14:
        NumberOfAster = 10000       #20000       #50000
        AsterName = 'xkcd'
        CenterObject = 'Sun (xkcd)'
        InnerRadius = 2.0
        OuterRadius = 3.4
        MaxRadiusOfAster = 50
        MinRadiusOfAster = 0.1
        MaxEccentricity = 0.001
        MinEccentricity = 0.0
        MaxInclination = 5
        FileName = 'xkcdAster'
        
    # Preset Castor C
    if Preset == 15:
        CenterObject    = 'Castor C'
        ObjectType      = 'Asteroid'
        TotalMass       = 1.19
        NumberOfAster   = 2500
        AsterName       = 'C-C S'
        # MiddleRadius  = 1.552
        InnerRadius     = 1.452
        OuterRadius     = 2.152
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 75.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 3.0
        MainInclination = 100
        AscNode         = 56.7
        RefPlane        = 'ExtraSolar'
        epoch           = 2640740.5
        FileName        = 'C-C_Ring'
        
     # Preset Castor A
    if Preset == 16:
        CenterObject    = 'Castor A'
        ObjectType      = 'Asteroid'
        TotalMass       = 2.65
        NumberOfAster   = 2000
        AsterName       = 'C-A S'
        # MiddleRadius  = 1.28
        InnerRadius     = 1.18
        OuterRadius     = 1.68
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 75.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 3.0
        MainInclination = 100
        AscNode         = 56.7
        RefPlane        = 'ExtraSolar'
        epoch           = 2640740.5
        FileName        = 'C-A_Ring'
        
     # Preset Castor B
    if Preset == 17:
        CenterObject    = 'Castor B'
        ObjectType      = 'Asteroid'
        TotalMass       = 2.65
        NumberOfAster   = 2000
        AsterName       = 'C-B S'
        # MiddleRadius  = 0.32
        InnerRadius     = 0.27
        OuterRadius     = 0.47
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 75.0
        MaxEccentricity = 0.01
        MinEccentricity = 0.0
        MaxInclination  = 3.0
        MainInclination = 100
        AscNode         = 56.7
        RefPlane        = 'ExtraSolar'
        epoch           = 2640740.5
        FileName        = 'C-B_Ring'
        
    # Preset Castor A comets
    if Preset == 18:
        CenterObject    = 'Castor A'
        ObjectType      = 'Comet'
        TotalMass       = 2.65
        NumberOfAster   = 500
        AsterName       = 'C-A C'
        InnerRadius     = 0.2
        OuterRadius     = 30
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 50.0
        MaxEccentricity = 0.1
        MinEccentricity = 0.0
        MaxInclination  = 180.0
        MainInclination = 0.0
        RefPlane        = 'Equator'
        epoch           = 2640740.5
        FileName        = 'C-A_Comets'
        
    # Preset Castor B comets
    if Preset == 19:
        CenterObject    = 'Castor B'
        ObjectType      = 'Comet'
        TotalMass       = 2.2
        NumberOfAster   = 500
        AsterName       = 'C-B C'
        InnerRadius     = 0.2
        OuterRadius     = 30
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 50.0
        MaxEccentricity = 0.1
        MinEccentricity = 0.0
        MaxInclination  = 180.0
        MainInclination = 0.0
        RefPlane        = 'Equator'
        epoch           = 2640740.5
        FileName        = 'C-B_Comets'
        
    # Preset Castor B comets
    if Preset == 20:
        CenterObject    = 'Castor C'
        ObjectType      = 'Comet'
        TotalMass       = 1.19
        NumberOfAster   = 500
        AsterName       = 'C-C C'
        InnerRadius     = 0.2
        OuterRadius     = 500
        MinRadiusOfAster = 0.01
        MaxRadiusOfAster = 50.0
        MaxEccentricity = 0.1
        MinEccentricity = 0.0
        MaxInclination  = 180.0
        MainInclination = 0.0
        RefPlane        = 'Equator'
        epoch           = 2640740.5
        FileName        = 'C-C_Comets'
        
   # No preset
    AutoLock = False
    if Preset == 0:
        # Generation mode: Trojans (1:1 co-orbital) or Hildas (first-order resonant belt, e.g. 3:2)
        GenModeInput = GetInput("Generate what?\n 1 = Trojans (1:1 co-orbital resonance)\n 2 = Hildas (resonant belt, e.g. 3:2)\n Default = 1 : ")
        if GenModeInput == '2':
            GenMode = 'Hilda'
        else:
            GenMode = 'Trojan'
        print (GenMode + '\n')

        # Center object
        CenterObject = GetInput(LngStr05)
        if CenterObject == '':
            CenterObject = 'Sol'
        print (CenterObject + '\n')
        
        # BaryCenter object
        isBaryCenter = GetInput(LngStr06)
        if isBaryCenter == '1' or isBaryCenter == 'y' or isBaryCenter == 'j':
            isBaryCenter = 1
        else:
            isBaryCenter = 0
        print (isBaryCenter)
        print ("")

        if isBaryCenter == 1:
            TotalMass = ''
            while TotalMass == '' or TotalMass >= 'A':
                print(LngStr07)
                print(LngStr08)
                print(LngStr09)
                TotalMass = GetInput(LngStr10)
            TotalMass = float(TotalMass)
            if TotalMass < 0:
                TotalMass = abs(TotalMass * SolMassOfEarth)
            print (TotalMass)
            print ("")

        # ObjectType = Asteroid or DwarfMoon
        AskObjectType = GetInput(LngStr02)
        if AskObjectType == '2' or AskObjectType == 'C':
            ObjectType = 'DwarfMoon'
            defObjName = CenterObject + '.C'
            defFileName = CenterObject + 'DwarfMoons'
        else:
            ObjectType =  'Asteroid'
            if GenMode == 'Hilda':
                defObjName = CenterObject + '.H'
                defFileName = CenterObject + 'Hildas'
            else:
                defObjName = CenterObject + '.T'
                defFileName = CenterObject + 'Trojans'
        print (ObjectType + "\n")
        
        # Numbering offset
        if ObjectType == 'DwarfMoon':
            numberingOffset = GetInput(LngStr28)
            if numberingOffset == '':
                numberingOffset = 0
            numberingOffset = int(numberingOffset)
            print (numberingOffset)
            print("")
            
        # DwarfMoon or not DwarfMoon, thats the question
        if ObjectType != 'DwarfMoon':
            binAsDwarf = GetInput(LngStr29)
            if binAsDwarf == '1' or binAsDwarf == 'Y' or binAsDwarf == 'j':
                binAsDwarf = 1
            else:
                binAsDwarf = 0
            print (binAsDwarf)
            print("")
            
        # Minmus distance binarys
        #minDistBin = GetInput(LngStr28)
        #if minDistBin == '':
        #    minDistBin = 0
        #minDistBin = float(minDistBin)
        #print (minDistBin)
        #print ("")

        # Number of Trojans
        NumberOfAster = int(AskFloat("Number of " + GenMode + " objects\n Default = 50 : ", 50))
        print(NumberOfAster)
        print("")

        # Name of the asteroids - a serial number is appended
        AsterName = GetInput(LngStr04 + defObjName + ' : ')
        if AsterName == '':
            AsterName = defObjName
        print (AsterName + '\n')

        MinRadiusOfAster = AskFloat(LngStr18, 0.1)
        print (MinRadiusOfAster)
        print ("")

        # Radius of asteroids in KM
        MaxRadiusOfAster = AskFloat(LngStr19, 50.0)
        if MaxRadiusOfAster < MinRadiusOfAster:
            MaxRadiusOfAster = MinRadiusOfAster
        print (MaxRadiusOfAster)
        print ("")

        # Parent star mass, used for the stable zone of moons and binary partners
        StarMass = AskFloat("Mass of the parent star in solar masses \n (keeps moons and binary partners inside the stable zone) \n Default = 1.0 : ", 1.0)
        print (StarMass)
        print("")

        # SE adds the host planet's mass to the star's mass when it works out the host's period,
        # so the host runs slightly faster than a body with the same semimajor axis and no mass.
        # The semimajor axis of the swarm is shortened by the same factor to keep the lock.
        HostMass = AskFloat("Host planet mass in Earth masses \n (SE counts it in the host's period) \n Default = 0 : ", 0.0)
        print (HostMass)
        print("")

        # Host orbital parameters
        HostSemi = AskFloat("Host planet Semimajor Axis in AU \n Default = 5.2 : ", 5.2)
        print (HostSemi)
        print("")

        print("Use the same RefPlane and Epoch as the host's Orbit block for the next values.\n")
        HostEpoch = AskFloat("Host Epoch \n Default = 2451545 : ", 2451545)
        HostIncl = AskFloat("Host Inclination (deg) \n Default = 0 : ", 0.0)
        HostNode = AskFloat("Host AscendingNode (deg) \n Default = 0 : ", 0.0)
        HostArg = AskFloat("Host ArgOfPericen (deg) \n Default = 0 : ", 0.0)
        HostMean = AskFloat("Host MeanAnomaly (deg) \n Default = 0 : ", 0.0)
        print("")

        #orbital eccentricity
        MaxEccentricity = AskFloat(LngStr20, 0.1)
        print (MaxEccentricity)
        print ("")

        MinEccentricity = AskFloat(LngStr21, 0.0)
        print (MinEccentricity)
        print ("")

        # Tilt of each orbit away from the host orbit plane, in degrees
        MinInclination = AskFloat("Minimum tilt away from the host orbit plane in degrees \n Default = 0.0 : ", 0.0)
        print (MinInclination)
        print ("")

        MaxInclination = AskFloat("Maximum tilt away from the host orbit plane in degrees \n Default = 10.0 : ", 10.0)
        print (MaxInclination)
        print ("")

        # Refplane
        RefPlane = GetInput(LngStr23)
        if RefPlane == '':
            RefPlane = 'Ecliptic'
        print (RefPlane + '\n')

        PeriodFactor = math.pow(StarMass / (StarMass + HostMass * SolMassOfEarth), 1.0 / 3.0)

        if GenMode == 'Trojan':
            # Lagrange selection
            TrojanPoint = ''
            while TrojanPoint not in ('1', '2', '3'):
                TrojanPoint = GetInput("Trojan location\n 1 = L4\n 2 = L5\n 3 = Both\n Default = 1 : ")
                if TrojanPoint == '':
                    TrojanPoint = '1'

            # Trojans share the host semimajor axis (1:1 resonance)
            ObjOrbits = 1
            HostOrbits = 1
            SemiChoice = GetInput("Trojan semimajor axis\n 1 = host's value exactly\n 2 = shortened for the host mass (stays in sync with the host in SE)\n Default = 1 : ")
            if SemiChoice == '2':
                ObjectSemi = HostSemi * PeriodFactor
            else:
                ObjectSemi = HostSemi

            # Spread
            Spread = AskFloat("Angular spreading around L-point (deg)\n Default = 20 : ", 20.0)

        else:
            # Resonance: the object makes ObjOrbits orbits while the host makes HostOrbits.
            # Only first-order resonances (difference of 1) use the angle below.
            while True:
                ResRatio = GetInput("Resonance (object orbits : host orbits), first order only\n Default = 3:2 (classic Hilda belt) : ")
                if ResRatio == '':
                    ResRatio = '3:2'
                try:
                    parts = ResRatio.split(':')
                    ObjOrbits = int(parts[0])
                    HostOrbits = int(parts[1])
                except (ValueError, IndexError):
                    print ('Enter two whole numbers, for example 3:2')
                    continue
                if HostOrbits >= 1 and ObjOrbits - HostOrbits == 1:
                    break
                print ('Only first-order resonances work here: 2:1, 3:2, 4:3, 5:4 ...')

            # Kepler's third law: period ratio is HostOrbits/ObjOrbits for the object
            ObjectSemi = HostSemi * math.pow(float(HostOrbits) / ObjOrbits, 2.0 / 3.0) * PeriodFactor
            print ("Resulting Semimajor Axis = " + str(ObjectSemi) + " AU\n")

            # The slow, crowded parts of the orbit sit at ObjOrbits points around the host orbit
            HildaPoint = int(AskFloat("Hilda vertex\n 1 to " + str(ObjOrbits) + " = one vertex (1 is ahead of the host)\n 0 = all vertices\n Default = 0 : ", 0))
            if HildaPoint < 0 or HildaPoint > ObjOrbits:
                HildaPoint = 0

            # Real Hildas librate with amplitudes from a few degrees up to about 40 degrees
            LibrationAmplitude = AskFloat("Resonant angle libration amplitude (deg)\n Default = 30 : ", 30.0)

            # Spread (1-sigma) around each vertex
            Spread = AskFloat("Angular spreading around each vertex (deg, 1-sigma)\n Default = 20 : ", 20.0)

        epoch = HostEpoch

        # Tidal locking: lock a body when its locking time is shorter than the system age
        AutoLock = GetInput("Tidally lock bodies that have time to lock? (y/n)\n Default = y : ").lower() != 'n'
        if AutoLock:
            SystemAge = AskFloat("System age in Gyr\n Default = 5.2 : ", 5.2)
            Rigidity = AskFloat("Rigidity in Pa (solid rock 3e10, rubble pile 1e8)\n Default = 3e10 : ", 3e10)
            LockQ = AskFloat("Tidal Q\n Default = 100 : ", 100.0)
            print ("")

        nameInput = GetInput("File name (without .sc)\n Default = " + defFileName + " : ").strip()
        if nameInput.lower().endswith('.sc'):
            nameInput = nameInput[:-3]
        if nameInput != '':
            defFileName = nameInput
        FileName = defFileName + '.sc'

    print ('\nCreating: ' + FileName + "\n\n")

    #---------------------------------------------------------------------------

    #rotation periods in hours. See https://www.boulder.swri.edu/~bottke/rubble/node3.html
    MaxRotationPeriod = 12
    MinRotationPeriod = 2.2      # spin barrier of rubble piles

    # Chance that a body has a moon, and chance that it is a binary pair.
    # Close to the star, YORP spin-up makes both common.
    ChanceOfMoon = 0.15
    ChanceOfBinary = 0.15

    # Dwarf moons get no moons and no binary partners
    if ObjectType == 'DwarfMoon':
        ChanceOfMoon = 0.0
        ChanceOfBinary = 0.0

    class Surface:
        def PrintIt(self):
            result = ['\tSurface\n\t{']
            if hasattr(self, 'bumpH'):
                result.append('\t\tBumpHeight\t{0}'.format(self.bumpH))
            if hasattr(self, 'bumpO'):
                   result.append('\t\tBumpOffset\t{0}'.format(self.bumpO))
            result.append('\t}')
            return '\n'.join(result)

    class Orbit:
        def PrintIt(self):
            result = ['\tOrbit\n\t{']
            if hasattr(self, 'epoch'):
                result.append('\t\tEpoch\t\t\t{0}'.format(self.epoch))
            else:
                result.append('\t\tEpoch\t\t\t2451545')
            if hasattr(self, 'semi'):
                result.append('\t\tSemiMajorAxis\t{0}'.format(self.semi))
            if hasattr(self, 'period'):
                result.append('\t\tPeriod\t\t\t{0}'.format(self.period))
            if hasattr(self, 'eccen'):
                result.append('\t\tEccentricity\t{0}'.format(self.eccen))
            if hasattr(self, 'incl'):
                result.append('\t\tInclination\t\t{0}'.format(self.incl))
            if hasattr(self, 'ascen'):
                result.append('\t\tAscendingNode\t{0}'.format(self.ascen))
            if hasattr(self, 'argof'):
                result.append('\t\tArgOfPericen\t{0}'.format(self.argof))
            if hasattr(self, 'refplane'):
                result.append('\t\tRefPlane\t\t"{0}"'.format(self.refplane))
            else:
                result.append('\t\tRefPlane\t\t"Ecliptic"')
            #result.append('\t\tMeanAnomaly\t\t0.0')
            result.append('\t\tMeanAnomaly\t\t{0}'.format(self.mean))
            result.append('\t}')
            return '\n'.join(result)

    class Asteroid:
        def PrintIt(self):
            asterSuffix = ''
            if AsterName == 'Kryptonit':
                krypType = random.random()
                if krypType > 0.25:
                    asterColor = '(0.1 1.0 0.2)'                  # green
                    asterSuffix = '.gre'
                elif krypType < 0.03:
                    rareKrypType = random.random()
                    if rareKrypType <= 0.166667:
                        asterColor = '(1.0 0.843137 0.0)'             # gold
                        asterSuffix = '.gol'
                    elif rareKrypType <= 0.333333:
                        asterColor = '(0.05 0.1 0.2)'                  # black 
                        asterSuffix = '.bla'
                    elif rareKrypType <= 0.5:
                        asterColor = '(1.0 1.0 1.0)'                  # white
                        asterSuffix = '.whi'
                    elif rareKrypType <= 0.666667:
                        asterColor = '(0.05 0.0 1.0)'                  # blue
                        asterSuffix = '.blu'
                    elif rareKrypType <= 0.833333:
                        asterColor = '(0.937255 0.909804 0.937255)'   # silver
                        asterSuffix = '.sil'
                    elif rareKrypType <= 1.0:
                        asterColor = '(0.5 0.5 0.5)'                  # colorless
                        asterSuffix = ''
                else:
                    asterColor = '(0.8 0.0 0.3)'                  # red
                    asterSuffix = '.red'
                
            if AsterName == 'GR':
                #asterColor = '(1.0 0.843137 0.0)'             # gold
                asterColor = '(' + str(random.uniform(0.5, 0.574)) + ' ' + str(random.uniform(0.43, 0.504)) + ' ' + str(random.uniform(0.06, 0.104)) + ')'
                # (0.537 0.467 0.082)
                    
            result = [ObjectType + ' "{0}"\n{{\n\tParentBody\t"{1}"\n\tClass\t\t"Asteroid"'.format(self.name, self.parent)]
            if hasattr(self, 'mass'):
                result.append('\tMass\t\t{0}'.format(self.mass))
            if hasattr(self, 'radius'):
                result.append('\tRadius\t\t{0}\n'.format(self.radius))
            if hasattr(self, 'rotation'):
                result.append('\tRotationPeriod\t{0}'.format(self.rotation))
            if hasattr(self, 'obliquity'):
                result.append('\n\tObliquity\t\t{0}\n'.format(self.obliquity))
            if getattr(self, 'locked', False):
                result.append('\tTidalLocked\t\ttrue\n')
            if AsterName == 'Kryptonit':
                result.append('\tAlbedo\t\t\t' + str(random.random() / 10) + '\n')
                result.append('\tColor\t\t\t' + asterColor + '\n')
                result.append('\tSurface\n\t{')
                result.append('\t\tModulateColor\t' + asterColor + '\n')
                result.append('\t\tcraterMagn\t\t{0}' .format(random.random() / 3 + 0.4))
                result.append('\t\tBumpHeight\t\t{0}'.format(self.radius))
                result.append('\t\tBumpOffset\t\t{0}'.format(self.radius / 2))
                result.append('\t\tDiffMapAlpha\t"Ice"')
                result.append('\t}\n')
            if AsterName == 'GR':
                result.append('\tOblateness\t\t(0.0 0.0 0.9)\n')
                result.append('\tTidalLocked\t\ttrue\n')
                result.append('\tAlbedo\t\t\t' + str(random.uniform(0.3, 0.6)) + '\n')
                result.append('\tColor\t\t\t' + asterColor + '\n')
                result.append('\tSurface\n\t{')
                result.append('\t\tModulateColor\t' + asterColor)
                result.append('\t\tBumpHeight\t\t0.0')
                result.append('\t\tBumpOffset\t\t0.0')
                result.append('\t}\n')
                #result.append('\tNoLighting\t\ttrue\n')
            result.append(self.orbit.PrintIt())
            result.append('}')
            return '\n'.join(result)

        def getSafeMoonRadius(self):
            return self.radius/AU * 1.2

    class DwarfMoon:
        def PrintIt(self):
            result = ['DwarfMoon "{0}"\n{{\n\tParentBody\t"{1}"\n\tClass\t\t"Asteroid"'.format(self.name, self.parent)]
            if hasattr(self, 'mass'):
                result.append('\tMass\t\t{0}'.format(self.mass))
            if hasattr(self, 'radius'):
                result.append('\tRadius\t\t{0}\n'.format(self.radius))
            if hasattr(self, 'rotation'):
                result.append('\tRotationPeriod\t{0}'.format(self.rotation))
            if hasattr(self, 'obliquity'):
                result.append('\n\tObliquity\t\t{0}\n'.format(self.obliquity))
            result.append(self.orbit.PrintIt())
            result.append('}')
            return '\n'.join(result)

    class BinaryAsteroid:
        def PrintIt(self):
            result = ['Barycenter "{0}"\n{{\n\tParentBody\t"{1}"'.format(self.name, self.parent)]
            result.append(self.orbit.PrintIt())
            result.append('}\n')

            density = self.rho * 1e12 / EarthMass

            #asteroid = Asteroid()
            if binAsDwarf == 1:
                asteroid = DwarfMoon()
            else:
                asteroid = Asteroid()
            
            asteroid.name = self.name + " A"
            asteroid.parent = self.name
            asteroid.radius = self.radius1
            asteroid.mass = 4/3 * math.pi * math.pow(asteroid.radius,3) * density
            asteroid.orbit = self.componentorbit
            result.append(asteroid.PrintIt())

            asteroid.name = self.name + " B"
            asteroid.radius = self.radius2
            asteroid.mass = 4/3 * math.pi * math.pow(asteroid.radius,3) * density
            asteroid.orbit.argof = (asteroid.orbit.argof + 180) % 360
            result.append(asteroid.PrintIt())
            return '\n'.join(result)

    #three different random number generators that give a floating point number between
    #the two parameters but with different distributions

    def uniform(a, b):
        return random.uniform(a, b)

    # A normal distribution placing a and b at three standard deviations out from the mean
    # clamping the result so that there are no outliers beyond the desired range
    def gaussian(a, b):
        result = random.gauss((a+b)/2.0, (b-a)/6.0)
        return max(min(result, b), a)

    randomGenerator = gaussian

    # Power law keeps small bodies common, as in real size counts.
    def powerlaw(a, b, slope=2.0):
        if a <= 0 or b <= a:
            return gaussian(a, b)
        u = random.random()
        return (a**-slope - u*(a**-slope - b**-slope)) ** (-1/slope)

    SolMassKg = 1.98847e30
    GravConst = 6.674e-11

    # Hill radius of a body in units of its own radius. rho in g/cm3.
    def hillOverRadius(rho):
        return ObjectSemi * AU * math.pow(4 * math.pi * rho * 1e12 / (9 * StarMass * SolMassKg), 1.0/3.0)

    # Rotate the host orbit normal by 'tilt' degrees toward 'direction' degrees.
    # Gives the inclination and node of an orbit tilted away from the host plane.
    def tiltOrbit(hostIncl, hostNode, tilt, direction):
        i = math.radians(hostIncl)
        n = math.radians(hostNode)
        nh = (math.sin(i)*math.sin(n), -math.sin(i)*math.cos(n), math.cos(i))
        e1 = (math.cos(n), math.sin(n), 0.0)
        e2 = (nh[1]*e1[2] - nh[2]*e1[1], nh[2]*e1[0] - nh[0]*e1[2], nh[0]*e1[1] - nh[1]*e1[0])
        t = math.radians(tilt)
        d = math.radians(direction)
        v = [math.cos(t)*nh[k] + math.sin(t)*(math.cos(d)*e1[k] + math.sin(d)*e2[k]) for k in range(3)]
        incl = math.degrees(math.acos(max(-1.0, min(1.0, v[2]))))
        if math.hypot(v[0], v[1]) < 1e-9:
            node = hostNode % 360
        else:
            node = math.degrees(math.atan2(v[0], -v[1])) % 360
        return incl, node

    def makeMoon(parentAsteroid, moonCount):
        # Rubble piles hold a moon outside about 2.4 radii (Roche limit)
        # and inside about 0.3 of their Hill sphere.
        innerLimit = parentAsteroid.radius/AU * 2.4
        outerLimit = parentAsteroid.radius/AU * min(20.0, 0.3 * parentAsteroid.hill)

        if binAsDwarf == 1:
            moon = DwarfMoon()
        else:
            moon = Asteroid()

        moon.radius = random.uniform(parentAsteroid.radius/20, parentAsteroid.radius/4)
        moon.mass = 4/3 * math.pi * math.pow(moon.radius,3) * parentAsteroid.density
        moon.name = parentAsteroid.name + '.{0}'.format(moonCount)
        moon.parent = parentAsteroid.name

        orbit = Orbit()
        orbit.parent = parentAsteroid.name
        orbit.refplane = 'Equator'
        orbit.semi = random.uniform(innerLimit, outerLimit)
        orbit.incl = math.degrees(math.acos(random.uniform(-1, 1)))
        orbit.eccen = randomGenerator(0, 0.01)       # 0.1
        orbit.argof = random.uniform(0,360)
        orbit.ascen = random.uniform(0,360)
        orbit.mean = random.uniform(0,360)

        moon.orbit = orbit

        return moon.PrintIt()


    def lockTimeYears(a_au, radius_km, rho_gcc, startSpinHours):
        # Gladman et al. 1996 with k2 = 1.5 / (1 + 19 mu / (2 rho g R))
        a = a_au * AU * 1000.0   # AU constant is in km
        R = radius_km * 1000.0
        rho = rho_gcc * 1000.0
        m = 4.0 / 3.0 * math.pi * R**3 * rho
        g = GravConst * m / R**2
        k2 = 1.5 / (1.0 + 19.0 * Rigidity / (2.0 * rho * g * R))
        w = 2 * math.pi / (startSpinHours * 3600.0)
        I = 0.4 * m * R**2
        sec = w * a**6 * I * LockQ / (3.0 * GravConst * math.pow(StarMass * SolMassKg, 2) * k2 * R**5)
        return sec / 3.15576e7

    def makeAsteroid(count, orbit):
        asteroid = Asteroid()
        asteroid.name = AsterName + '{0}'.format(count)
        asteroid.parent = CenterObject
        asteroid.radius = powerlaw(MinRadiusOfAster, MaxRadiusOfAster)

        asteroid.bumpH = asteroid.radius
        asteroid.bumpO = asteroid.radius /2

        asteroid.rho = randomGenerator(2,4)
        asteroid.density = asteroid.rho * 1e12 / EarthMass
        asteroid.hill = hillOverRadius(asteroid.rho)
        asteroid.mass = 4/3 * math.pi * math.pow(asteroid.radius,3) * asteroid.density
        asteroid.rotation = randomGenerator(MinRotationPeriod,MaxRotationPeriod)
        asteroid.obliquity = random.uniform(0,360)
        asteroid.orbit = orbit
        asteroid.locked = False
        if AutoLock and lockTimeYears(orbit.semi, asteroid.radius, asteroid.rho, asteroid.rotation) < SystemAge * 1e9:
            asteroid.locked = True
            del asteroid.rotation       # SE sets the period from the orbit

        output = [asteroid.PrintIt()]

        # One moon at most, and only where the stable zone is wide enough
        if 0.3 * asteroid.hill > 3.0 and random.random() < ChanceOfMoon:
            output.append(makeMoon(asteroid, 1))

        return '\n'.join(output)

    def makeBinaryAsteroid(count, orbit):
        binary = BinaryAsteroid()
        binary.name = AsterName + '{0}'.format(count)
        binary.parent = CenterObject
        binary.radius1 = powerlaw(MinRadiusOfAster, MaxRadiusOfAster)
        binary.radius2 = binary.radius1 * random.uniform(0.25,1)
        binary.rho = randomGenerator(2,4)
        binary.orbit = orbit

        # Separation between a loose contact and 0.3 of the Hill sphere
        sepMin = 1.5 * (binary.radius1 + binary.radius2)
        sepMax = 0.3 * hillOverRadius(binary.rho) * binary.radius1
        if sepMax <= sepMin:
            return None
        sep = random.uniform(sepMin, sepMax)
        totalMass = 4/3 * math.pi * (math.pow(binary.radius1*1000, 3) + math.pow(binary.radius2*1000, 3)) * binary.rho * 1000
        periodSec = 2 * math.pi * math.sqrt(math.pow(sep*1000, 3) / (GravConst * totalMass))

        componentOrbit = Orbit()
        componentOrbit.period = periodSec / 86400.0 / daysYear
        componentOrbit.incl = math.degrees(math.acos(random.uniform(-1, 1)))
        componentOrbit.eccen = randomGenerator(0, 0.01)      # 0.1
        componentOrbit.argof = random.uniform(0,360)
        componentOrbit.ascen = random.uniform(0,360)
        componentOrbit.mean = random.uniform(0,360)
        componentOrbit.refplane = 'Equator'

        binary.componentorbit = componentOrbit

        return binary.PrintIt()


    with open(FileName, 'w') as outputfile:
        outputfile.write('// ' + ObjectType + 's made with AsterBeltCreator (by JackDole)\n// ' + Version + '\n// {0}\n'.format(datetime.today()))
        outputfile.write('// Trojan generator made with AI by mystic.xyz on Discord\n')
        if GenMode == 'Hilda':
            outputfile.write('// Hildas sit at the exact resonant semimajor axis. Each has resonant angle ' + str(ObjOrbits) + '*L(host) - ' + str(HostOrbits) + '*L(object) - varpi near 0')
        else:
            outputfile.write('// Trojans share the host semimajor axis and keep a fixed mean longitude offset of +60 (L4) or -60 (L5) degrees')

        outputfile.write('\n\n')
        outputfile.write('// ParentObject    = ' + CenterObject + '\n')
        outputfile.write('// Objecttype      = ' + ObjectType + '\n')
        outputfile.write('// NumberOffset    = ' + str(numberingOffset) + '\n')
        outputfile.write('// NumberOfAster   = ' + str(NumberOfAster) + '\n')
        outputfile.write('// AsterName       = ' + AsterName + '\n')
        outputfile.write('// StarMass        = ' + str(StarMass) + '\n')
        outputfile.write('// GenerationMode  = ' + GenMode + '\n')
        outputfile.write('// Host Mass (Earth masses) = ' + str(HostMass) + '\n')
        outputfile.write('// Host Semimajor Axis   = ' + str(HostSemi) + '\n')
        outputfile.write('// Object Semimajor Axis = ' + str(ObjectSemi) + '\n')
        if AutoLock:
            outputfile.write('// AutoLock: age ' + str(SystemAge) + ' Gyr, rigidity ' + str(Rigidity) + ' Pa, Q ' + str(LockQ) + '\n')
        outputfile.write('// Host Epoch      = ' + str(HostEpoch) + '\n')
        outputfile.write('// Host Inclination = ' + str(HostIncl) + '\n')
        outputfile.write('// ArgOfPericenter = ' + str(HostArg) + '\n')
        outputfile.write('// AscendingNode   = ' + str(HostNode) + '\n')
        outputfile.write('// MeanAnomaly     = ' + str(HostMean) + '\n')
        outputfile.write('// MinRadiusOfAster = ' + str(MinRadiusOfAster) + '\n')
        outputfile.write('// MaxRadiusOfAster = ' + str(MaxRadiusOfAster) + '\n')
        outputfile.write('// MaxEccentricity = ' + str(MaxEccentricity) + '\n')
        outputfile.write('// MinEccentricity = ' + str(MinEccentricity) + '\n')
        outputfile.write('// MinTilt         = ' + str(MinInclination) + '\n')
        outputfile.write('// MaxTilt         = ' + str(MaxInclination) + '\n')
        outputfile.write('// RefPlane        = ' + RefPlane + '\n')
        if GenMode == 'Hilda':
            outputfile.write('// Resonance (object:host) = ' + str(ObjOrbits) + ':' + str(HostOrbits) + '\n')
            outputfile.write('// HildaPoint      = ' + str(HildaPoint) + '\n')
            outputfile.write('// LibrationAmplitude = ' + str(LibrationAmplitude) + '\n')
        else:
            outputfile.write('// TrojanPoint     = ' + TrojanPoint + '\n')
        outputfile.write('// Spread          = ' + str(Spread) + '\n')
        outputfile.write('// FileName        = ' + FileName)

        # Host mean longitude
        host_lambda = HostMean + HostArg + HostNode

        for count in range(NumberOfAster):

            orbit = Orbit()
            orbit.semi = ObjectSemi
            orbit.eccen = randomGenerator(MinEccentricity, MaxEccentricity)
            orbit.epoch = epoch
            orbit.refplane = RefPlane

            # Plane tilted away from the host plane by a random angle in a random direction
            tilt = randomGenerator(MinInclination, MaxInclination)
            orbit.incl, orbit.ascen = tiltOrbit(HostIncl, HostNode, tilt, random.uniform(0, 360))

            if GenMode == 'Trojan':
                # Choose L4 / L5
                if TrojanPoint == '1':          # L4
                    target_lambda = host_lambda + 60
                elif TrojanPoint == '2':        # L5
                    target_lambda = host_lambda - 60
                else:                           # Both
                    if count % 2 == 0:
                        target_lambda = host_lambda + 60
                    else:
                        target_lambda = host_lambda - 60

                # Apply spreading
                target_lambda += random.uniform(-Spread, Spread)

                # Mean longitude = node + argument of pericenter + mean anomaly
                orbit.argof = random.uniform(0, 360)
                orbit.mean = (target_lambda - orbit.argof - orbit.ascen) % 360

            else:
                # Resonant angle: phi = ObjOrbits*L(host) - HostOrbits*L(object) - varpi
                # With ObjOrbits - HostOrbits = 1 this gives mean anomaly M = ObjOrbits*dL + phi,
                # where dL is the object's longitude ahead of the host. An object is slowest
                # near aphelion (M = 180), so it dwells at dL = (180 + 360 k) / ObjOrbits.
                # For 3:2 these are +60, +180 and +300 (-60), the Hilda triangle.
                if HildaPoint == 0:
                    k = count % ObjOrbits
                else:
                    k = HildaPoint - 1
                vertex = (180.0 + 360.0 * k) / ObjOrbits
                dlam = vertex + gaussian(-3 * Spread, 3 * Spread)
                libration = random.uniform(-LibrationAmplitude, LibrationAmplitude)

                mean = ObjOrbits * dlam + libration
                peri_longitude = (host_lambda + dlam) - mean
                orbit.mean = mean % 360
                orbit.argof = (peri_longitude - orbit.ascen) % 360

            outputfile.write('\n\n')
            text = None
            if random.random() < ChanceOfBinary:
                text = makeBinaryAsteroid(count+1, orbit)
            if text is None:
                text = makeAsteroid(count+1, orbit)
            outputfile.write(text)
