from random import randint
from time import sleep

number = randint(1,100)

guesses = 0
print("You have a total of seven chances to guess the computer's number. Let's begin.")
while guesses < 7:
    guess = int(input("Please guess a number between 1 and 100: "))
    guesses += 1
    print("This is guess number " + str(guesses))

    if guess < number:
        print("Your guess is too low.")
    elif guess > number:
        print("Your guess is too high.")
    else:
        print("You guessed it in " + str(guesses) + "! Congratulations!")
        sleep(2)
        break
print("The program will now exit.")