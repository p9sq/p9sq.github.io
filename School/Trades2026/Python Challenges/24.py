# Challenge 24: Check Palindrome
def check_palindrome(string):
    return string == string[::-1]

string = input("Enter a string: ")
if check_palindrome(string):
    print("Palindrome")
else:
    print("Not a Palindrome")