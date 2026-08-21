# Challenge 6: Count Vowels in a String
string = input("Enter a string: ")

count = 0
for char in string:
    if char.lower() in 'aeiou':
        count += 1

print("Number of vowels:", count)