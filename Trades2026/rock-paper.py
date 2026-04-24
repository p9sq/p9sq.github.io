import random

def play_game():
    options = ["rock", "gun", "water", "air", "paper", "sponge", "human", "scissors", "fire"]
    while True:
        user_choice = input("Enter rock, gun, water, air, paper, sponge, human, scissors, or fire (or 'quit'): ").lower()
        if user_choice == 'quit': break
        if user_choice not in options:
            print("Invalid choice.")
            continue
        computer_choice = random.choice(options)
        print(f"You: {user_choice}, Computer: {computer_choice}")
        
        # Determine winner
        if user_choice == computer_choice:
            print("Tie!")
        elif (user_choice == "rock" and computer_choice == "fire") or \
             (user_choice == "rock" and computer_choice == "scissors") or \
             (user_choice == "rock" and computer_choice == "human") or \
             (user_choice == "rock" and computer_choice == "sponge") or \
             (user_choice == "fire" and computer_choice == "scissors") or \
             (user_choice == "fire" and computer_choice == "paper") or \
             (user_choice == "fire" and computer_choice == "human") or \
             (user_choice == "fire" and computer_choice == "sponge") or \
             (user_choice == "scissors" and computer_choice == "air") or \
             (user_choice == "scissors" and computer_choice == "paper") or \
             (user_choice == "scissors" and computer_choice == "human") or \
             (user_choice == "scissors" and computer_choice == "sponge") or \
             (user_choice == "human" and computer_choice == "sponge") or \
             (user_choice == "human" and computer_choice == "paper") or \
             (user_choice == "human" and computer_choice == "air") or \
             (user_choice == "human" and computer_choice == "water") or \
             (user_choice == "sponge" and computer_choice == "paper") or \
             (user_choice == "sponge" and computer_choice == "air") or \
             (user_choice == "sponge" and computer_choice == "water") or \
             (user_choice == "sponge" and computer_choice == "gun") or \
             (user_choice == "paper" and computer_choice == "air") or \
             (user_choice == "paper" and computer_choice == "rock") or \
             (user_choice == "paper" and computer_choice == "water") or \
             (user_choice == "paper" and computer_choice == "gun") or \
             (user_choice == "air" and computer_choice == "fire") or \
             (user_choice == "air" and computer_choice == "rock") or \
             (user_choice == "air" and computer_choice == "water") or \
             (user_choice == "air" and computer_choice == "gun") or \
             (user_choice == "water" and computer_choice == "rock") or \
             (user_choice == "water" and computer_choice == "fire") or \
             (user_choice == "water" and computer_choice == "scissors") or \
             (user_choice == "water" and computer_choice == "gun") or \
             (user_choice == "gun" and computer_choice == "rock") or \
             (user_choice == "gun" and computer_choice == "fire") or \
             (user_choice == "gun" and computer_choice == "scissors") or \
             (user_choice == "gun" and computer_choice == "human"):
            print("You win!")
        else:
            print("You lose!")

if __name__ == "__main__":
    play_game()
