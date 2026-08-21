# Challenge 13: Check Palindrome
string = input("Enter a string: ")

if string == string[::-1]:
    print("Palindrome")
else:
    print("Not a Palindrome")