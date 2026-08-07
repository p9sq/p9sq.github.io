import re
import os

def int_to_roman(num):
    val = [
        1000, 900, 500, 400,
        100, 90, 50, 40,
        10, 9, 5, 4, 1
    ]
    syms = [
        "M", "CM", "D", "CD",
        "C", "XC", "L", "XL",
        "X", "IX", "V", "IV", "I"
    ]
    roman = ""
    for i in range(len(val)):
        while num >= val[i]:
            roman += syms[i]
            num -= val[i]
    return roman

file = input("Enter the name of the .sc file: ").strip()

filename = file + ".sc"

input_path = os.path.join(os.getcwd(), filename)

if not os.path.isfile(input_path):
    print(f"File '{filename}' not found in current directory: {os.getcwd()}")
    exit(1)

name, ext = os.path.splitext(filename)
output_path = os.path.join(os.getcwd(), f"{name}_modified{ext}")

with open(input_path, "r", encoding="utf-8") as file:
    content = file.read()

def replacer(match):
    base_name = match.group(1)
    number = int(match.group(2))
    roman = int_to_roman(number)
    return f'{base_name} {roman}'

modified_content = re.sub(r'(\b\w+)\.D(\d+)\b', replacer, content)

with open(output_path, "w", encoding="utf-8") as file:
    file.write(modified_content)

input("\nPress Enter to close this window...")