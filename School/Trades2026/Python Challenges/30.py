# Challenge 30: Print Pattern
def print_pattern(rows):
    for i in range(1, rows + 1):
        print("*" * i)

rows = int(input("Enter the number of rows: "))
print_pattern(rows)