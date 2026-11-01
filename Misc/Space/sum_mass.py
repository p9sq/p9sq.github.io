import re

# Matches a line like "Mass 5.972" or "Mass 1.2e-5" and skips keys like SolMass
massPat = re.compile(r"^\s*Mass\s+([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*$")


def readMass(path):
    total = 0.0
    count = 0
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            # Commented lines hold old values, so drop them first
            line = line.split("//")[0]
            match = massPat.match(line)
            if match:
                total += float(match.group(1))
                count += 1
    return total, count


def main():
    path = input("Input file name: ").strip().strip('"')
    try:
        total, count = readMass(path)
    except FileNotFoundError:
        print(f"File not found: {path}")
        return
    except OSError as err:
        print(f"Read failed: {err}")
        return
    print(f"Mass entries found: {count}")
    print(f"Combined mass: {total:.10g} Earth masses")


main()
