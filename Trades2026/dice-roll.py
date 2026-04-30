import random

class DiceGame:
    def __init__(self):
        self.reset()

    def reset(self):
        """Resets the game state."""
        self.rolls = 0
        self.total_sum = 0
        self.history = []

    def roll_dice(self):
        die1 = random.randint(1, 6)
        die2 = random.randint(1, 6)
        die3 = random.randint(1, 6)
        die4 = random.randint(1, 6)
        roll_total = die1 + die2 + die3 + die4
        
        self.rolls += 1
        self.total_sum += roll_total
        self.history.append(roll_total)
        
        average = self.total_sum / self.rolls
        return die1, die2, die3, die4, roll_total, average

def main():
    game = DiceGame()
    print("Welcome to the Dice Rolling Game!")
    print("Type 'roll' to roll the dice or 'quit' to exit.")
    print(f"{'Roll #':<8} | {'Dice':<12} | {'Total':<6} | {'Running Avg'}")
    print("-" * 50)

    while True:
        user_input = input("Enter command (roll/quit): ").strip().lower()
        if user_input == 'roll':
            d1, d2, d3, d4, total, avg = game.roll_dice()
            print(f"{game.rolls:<8} | {d1},{d2},{d3},{d4:<6} | {total:<6} | {avg:.2f}")
        elif user_input == 'quit':
            print("Thanks for playing! Goodbye.")
            break
        else:
            print("Invalid command. Please type 'roll' to roll the dice or 'quit' to exit.")

if __name__ == "__main__":
    main()
