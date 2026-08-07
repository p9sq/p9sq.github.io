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
    MinInclination = 0.0
    asterSuffix = ''
    asterColor = ''

    # Trojan/Hilda resonance defaults (only meaningful when UseResonance = True)
    GenMode = 'Trojan'
    UseResonance = False
    HostSemi = 0.0
    ObjectSemi = 0.0
    HostArg = 0.0
    HostNode = 0.0
    HostMean = 0.0
    TrojanPoint = '1'
    HildaPoint = '4'
    ResonancePlanet = 3.0
    ResonanceObject = 2.0
    LibrationAmplitude = 30.0
    Spread = 20.0

    Preset = 0

    print ('------------------------------------------------------------------------------')

    if MaxPresets > 0:
        ts = LngStr01
        Preset = GetInput(ts)

        if Preset == 'x' or Preset == 'q':
            exit()
        if Preset == '':
            Preset = 0
        Preset = int(Preset)
        if Preset > MaxPresets:
            Preset = 0
        print (Preset)
        print ("")

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
    if Preset == 0:
        UseResonance = True

        # Generation mode: Trojans (1:1 co-orbital) or Hildas (resonant belt)
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

        # Number of objects
        NumberOfAster = GetInput("Number of " + GenMode + " objects\n Default = 50 : ")
        if NumberOfAster == '':
            NumberOfAster = 50
        NumberOfAster = int(NumberOfAster)
        print(NumberOfAster)
        print("")

        # Name of the asteroids - a serial number is appended
        AsterName = GetInput(LngStr04 + defObjName + ' : ')
        if AsterName == '':
            AsterName = defObjName
        print (AsterName + '\n')

        MinRadiusOfAster = GetInput(LngStr18)
        if MinRadiusOfAster == '':
            MinRadiusOfAster = 0.1
        MinRadiusOfAster = float(MinRadiusOfAster)
        print (MinRadiusOfAster)
        print ("")

        # Radius of asteroids in KM
        MaxRadiusOfAster = GetInput(LngStr19)
        if MaxRadiusOfAster == '':
            MaxRadiusOfAster = 50.0
        MaxRadiusOfAster = float(MaxRadiusOfAster)
        print (MaxRadiusOfAster)
        print ("")

        # Host (perturbing planet) orbital parameters
        HostSemi = GetInput("Host planet Semimajor Axis in AU \n Default = 5.2 : ")
        if HostSemi == '':
            HostSemi = 5.2
        HostSemi = float(HostSemi)
        print (HostSemi)
        print("")

        HostArgInput = GetInput("Host ArgOfPericen (deg) \n Default = 0.0 : ")
        HostArg = float(HostArgInput) if HostArgInput != '' else 0.0

        HostNodeInput = GetInput("Host AscendingNode (deg) \n Default = 0.0 : ")
        HostNode = float(HostNodeInput) if HostNodeInput != '' else 0.0

        HostMeanInput = GetInput("Host MeanAnomaly (deg) \n Default = 0.0 : ")
        HostMean = float(HostMeanInput) if HostMeanInput != '' else 0.0
        print("")

        #orbital eccentricity
        MaxEccentricity = GetInput(LngStr20)
        if MaxEccentricity == '':
            MaxEccentricity = 0.1
        MaxEccentricity = float(MaxEccentricity)
        print (MaxEccentricity)
        print ("")

        MinEccentricity = GetInput(LngStr21)
        if MinEccentricity == '':
            MinEccentricity = 0.0
        MinEccentricity = float(MinEccentricity)
        print (MinEccentricity)
        print ("")

        # Orbital inclination  in degrees
        MinInclination = GetInput(LngStr22)
        if MinInclination == '':
            MinInclination = 0.0
        MinInclination = float(MinInclination)
        print (MinInclination)
        print ("")

        MaxInclination = GetInput(LngStr225)
        if MaxInclination == '':
            MaxInclination = 10.0
        MaxInclination = float(MaxInclination)
        print (MaxInclination)
        print ("")

        # Refplane
        RefPlane = GetInput(LngStr23)
        if RefPlane == '':
            RefPlane = 'Ecliptic'
        print (RefPlane + '\n')

        if GenMode == 'Trojan':
            # Lagrange point selection
            TrojanPoint = GetInput("Trojan location\n 1 = L4 (leading)\n 2 = L5 (trailing)\n 3 = Both\n Default = 1 : ")
            if TrojanPoint == '':
                TrojanPoint = '1'

            # Trojans share the host planet's orbit (1:1 resonance)
            ResonancePlanet = 1.0
            ResonanceObject = 1.0
            ObjectSemi = HostSemi

            # Spread
            Spread = float(GetInput("Angular spreading around L-point (deg)\n Default = 20 : ") or 20)

        else:
            # Hilda-type asteroids dwell near Jupiter's L4, L3 and L5 relative
            # longitudes (+60, +180, -60 deg) -- NOT at conjunction (0 deg).
            # At true conjunction (0 deg) a Hilda is near its own perihelion,
            # moving fast; it lingers (spends most time) near these three
            # points, which is why they show up as the "Hilda triangle".
            HildaPoint = GetInput("Hilda libration vertex\n 1 = Vertex A (~L4, +60 deg)\n 2 = Vertex B (~L3, +180 deg, opposite host)\n 3 = Vertex C (~L5, -60 deg)\n 4 = All three\n Default = 4 : ")
            if HildaPoint == '':
                HildaPoint = '4'

            ResRatio = GetInput("Resonance with host planet (planet orbits : object orbits)\n Default = 3:2 (classic Hilda belt) : ")
            if ResRatio == '':
                ResRatio = '3:2'
            try:
                resNum, resDen = ResRatio.split(':')
                ResonancePlanet = float(resNum)
                ResonanceObject = float(resDen)
            except (ValueError, ZeroDivisionError):
                ResonancePlanet = 3.0
                ResonanceObject = 2.0

            # SemiMajorAxis ratio = (period ratio)^(2/3), period ratio = object/planet
            ObjectSemi = HostSemi * (ResonanceObject / ResonancePlanet) ** (2.0 / 3.0)
            print ("Resulting " + GenMode + " Semimajor Axis = " + str(ObjectSemi) + " AU\n")

            # How tightly the resonant angle libration is held around its
            # center. Real Hildas librate with amplitudes of roughly a few
            # degrees up to ~40 deg; 30 is a reasonable representative default.
            LibrationAmplitude = float(GetInput("Resonant angle libration amplitude (deg)\n Default = 30 : ") or 30)

            # Spread
            Spread = float(GetInput("Angular spreading around libration point (deg)\n Default = 20 : ") or 20)

        epoch = 2451545

        FileName = defFileName + '.sc'

    print ('\nCreating: ' + FileName + "\n\n")

    #---------------------------------------------------------------------------

    #rotation periods in hours. See https://www.boulder.swri.edu/~bottke/rubble/node3.html
    MaxRotationPeriod = 12
    MinRotationPeriod = 0.1

    ChanceOfMoon = 0.9      #1.0
    ChanceOfBinary = 0.1    #0.0

    if ObjectType == 'Comet':
        ChanceOfMoon = 1.0
        ChanceOfBinary = 0.2

    if AsterName == 'GR':
        ChanceOfMoon = 1.0
        ChanceOfBinary = 0.0
        
    # If you want dwarf moons with moons change these values:
    # ChanceOfMoon < 1.0
    # ChangeOfBinary > 0.0
    if ObjectType == 'DwarfMoon':
        ChanceOfMoon = 1.0
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
            result.append(orbit.PrintIt())
            result.append('}\n')

            density = randomGenerator(2,4) * 1e12 / EarthMass

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

    def makeMoon(parentAsteroid, moonCount):
        innerLimit = parentAsteroid.radius/AU * 1.1
        outerLimit = innerLimit * 20

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
        orbit.incl = randomGenerator(-90, 90)
        orbit.eccen = randomGenerator(0, 0.01)       # 0.1
        orbit.argof = random.uniform(0,360)
        orbit.ascen = random.uniform(0,360)
        orbit.mean = random.uniform(0,180)

        moon.orbit = orbit

        return moon.PrintIt()


    def makeAsteroid(count, orbit):
        asteroid = Asteroid()
        asteroid.name = AsterName + '{0}'.format(count)
        asteroid.parent = CenterObject
        asteroid.radius = randomGenerator(MinRadiusOfAster, MaxRadiusOfAster)
        
        asteroid.bumpH = asteroid.radius
        asteroid.bumpO = asteroid.radius /2
        
        asteroid.density = randomGenerator(2,4) * 1e12 / EarthMass
        asteroid.mass = 4/3 * math.pi * math.pow(asteroid.radius,3) * asteroid.density
        asteroid.rotation = randomGenerator(MinRotationPeriod,MaxRotationPeriod)
        asteroid.obliquity = random.uniform(0,360)
        asteroid.orbit = orbit

        output = [asteroid.PrintIt()]
        
        moonCount = 0
        while random.random() > ChanceOfMoon and moonCount < 10:
            moonCount = moonCount + 1
            output.append(makeMoon(asteroid, moonCount))
        
        return '\n'.join(output)

    def makeBinaryAsteroid(count, orbit):
        binary = BinaryAsteroid()
        binary.name = AsterName + '{0}'.format(count)
        binary.parent = CenterObject
        binary.radius1 = randomGenerator(MinRadiusOfAster, MaxRadiusOfAster)
        binary.radius2 = binary.radius1 * random.uniform(0.25,1)
        binary.orbit = orbit

        componentOrbit = Orbit()
        componentOrbit.period = random.uniform(0.1, 3) / daysYear
        componentOrbit.incl = random.uniform(0,360)
        componentOrbit.eccen = randomGenerator(0, 0.01)      # 0.1
        componentOrbit.argof = random.uniform(0,360)
        componentOrbit.ascen = random.uniform(0,360)
        componentOrbit.mean = random.uniform(0,180)
        componentOrbit.refplane = 'Equator'

        binary.componentorbit = componentOrbit

        return binary.PrintIt()


    with open(FileName, 'w') as outputfile:
        outputfile.write('// ' + ObjectType + 's made with AsterBeltCreator (by JackDole)\n// ' + Version + '\n// {0}'.format(datetime.today()))
        outputfile.write('// Trojan generator edited by mystic.xyz on Discord\n')
        outputfile.write('// Note: There is a slight imperfection where the trojans might not be aligned\n')
        outputfile.write('// DISCLAIMER: I have used ChatGPT to modify the code,\n')
        outputfile.write('//             but I have edited that code to prevent errors. I\'ve also added some slight adjustments.')
        
        outputfile.write('\n\n')
        outputfile.write('// ParentObject    = ' + CenterObject + '\n')
        outputfile.write('// Objecttype      = ' + ObjectType + '\n')
        outputfile.write('// NumberOffset    = ' + str(numberingOffset) + '\n')
        outputfile.write('// NumberOfAster   = ' + str(NumberOfAster) + '\n')
        outputfile.write('// AsterName       = ' + AsterName + '\n')

        if UseResonance:
            outputfile.write('// GenerationMode  = ' + GenMode + '\n')
            outputfile.write('// Host Semimajor Axis   = ' + str(HostSemi) + '\n')
            outputfile.write('// Object Semimajor Axis = ' + str(ObjectSemi) + '\n')
            outputfile.write('// Host ArgOfPericenter = ' + str(HostArg) + '\n')
            outputfile.write('// Host AscendingNode   = ' + str(HostNode) + '\n')
            outputfile.write('// Host MeanAnomaly     = ' + str(HostMean) + '\n')
            if GenMode == 'Trojan':
                outputfile.write('// TrojanPoint     = ' + str(TrojanPoint) + '\n')
            else:
                outputfile.write('// HildaPoint      = ' + str(HildaPoint) + '\n')
                outputfile.write('// Resonance (planet:object) = ' + str(ResonancePlanet) + ':' + str(ResonanceObject) + '\n')
                outputfile.write('// LibrationAmplitude (resonant angle) = ' + str(LibrationAmplitude) + '\n')
            outputfile.write('// Spread          = ' + str(Spread) + '\n')
        else:
            outputfile.write('// InnerRadius     = ' + str(InnerRadius) + '\n')
            outputfile.write('// OuterRadius     = ' + str(OuterRadius) + '\n')

        outputfile.write('// MinRadiusOfAster = ' + str(MinRadiusOfAster) + '\n')
        outputfile.write('// MaxRadiusOfAster = ' + str(MaxRadiusOfAster) + '\n')
        outputfile.write('// MaxEccentricity = ' + str(MaxEccentricity) + '\n')
        outputfile.write('// MinEccentricity = ' + str(MinEccentricity) + '\n')
        outputfile.write('// MinInclination  = ' + str(MinInclination) + '\n')
        outputfile.write('// MaxInclination  = ' + str(MaxInclination) + '\n')
        outputfile.write('// RefPlane        = ' + RefPlane + '\n')

        if AscNode >= 0:
            outputfile.write('// AscNode         = ' + str(AscNode) + '\n')
        outputfile.write('// FileName        = ' + FileName)

        for count in range(NumberOfAster):

            orbit = Orbit()
            orbit.eccen = randomGenerator(MinEccentricity, MaxEccentricity)
            orbit.incl = randomGenerator(MinInclination, MaxInclination) + MainInclination
            orbit.epoch = epoch
            orbit.refplane = RefPlane

            if UseResonance:
                orbit.semi = ObjectSemi

                # Host mean longitude
                host_lambda = HostMean + HostArg + HostNode

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

                    # Trojans aren't perihelion-locked the way Hildas are --
                    # their stability comes from the effective potential well
                    # at L4/L5, not from a resonant angle involving perihelion.
                    # So orientation can be randomized freely.
                    orbit.ascen = random.uniform(0, 360)
                    orbit.argof = random.uniform(0, 360)
                    orbit.mean = target_lambda - orbit.argof - orbit.ascen

                else:
                    # Hilda vertices sit near the host's L4, L3, L5 relative
                    # longitudes (+60, +180, -60 deg) -- NOT at conjunction.
                    vertexOffsets = {'1': 60, '2': 180, '3': -60}
                    if HildaPoint in vertexOffsets:
                        target_lambda = host_lambda + vertexOffsets[HildaPoint]
                    else:                            # All three, cycle through
                        target_lambda = host_lambda + [60, 180, -60][count % 3]

                    # Apply spreading (how far around the vertex the object sits).
                    # A Gaussian taper (dense near the vertex, thinning out
                    # toward the edges) reads as a natural swarm; a uniform
                    # box just produces a flat, hard-edged "blob". Treat
                    # Spread as roughly the 1-sigma width, allowing occasional
                    # objects out to 3x that for a longer, more realistic tail.
                    target_lambda += gaussian(-3*Spread, 3*Spread)

                    # Resonant-angle locking: Phi = ResonancePlanet*lambda_host
                    # - ResonanceObject*lambda_object - varpi_object librates
                    # around 0. Solving for varpi (longitude of perihelion)
                    # ties the object's perihelion direction to the resonance,
                    # so it is genuinely near perihelion whenever it passes
                    # through conjunction with the host -- the real Hilda
                    # protection mechanism, not just a matching mean longitude.
                    libration = random.uniform(-LibrationAmplitude, LibrationAmplitude)
                    peri_longitude = (ResonancePlanet * host_lambda) - (ResonanceObject * target_lambda) - libration

                    orbit.ascen = random.uniform(0, 360)
                    orbit.argof = peri_longitude - orbit.ascen

                    # Mean anomaly is solved so the object's current position
                    # (mean longitude) actually sits at target_lambda -- this
                    # is what produces the clustered "arcs with gaps" look at
                    # L4/L3/L5, matching real snapshots of the Hilda group.
                    orbit.mean = target_lambda - peri_longitude

                # Normalize for SpaceEngine range (-360 to 360)
                while orbit.mean > 360:
                    orbit.mean -= 360
                while orbit.mean < -360:
                    orbit.mean += 360
                while orbit.argof > 360:
                    orbit.argof -= 360
                while orbit.argof < 0:
                    orbit.argof += 360

            else:
                # Legacy behavior: objects spread randomly across a belt
                orbit.semi = randomGenerator(InnerRadius, OuterRadius)
                orbit.ascen = random.uniform(0, 360) if AscNode == 0 else AscNode
                orbit.argof = random.uniform(0, 360)
                orbit.mean = random.uniform(0, 360)

            outputfile.write('\n\n')
            outputfile.write(makeAsteroid(count+1, orbit))