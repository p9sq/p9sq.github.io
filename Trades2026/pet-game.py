# Part 1: Variables and Sequence
pet_name = input("What is your pet's name? ")
health = 10
hunger = 5
energy = 10

print(pet_name + " has arrived!")
print("Health:", health)
print("Hunger:", hunger)
print("Energy:", energy)

# Part 2: Selection
action = input("Do you want to 'feed' or 'play' with your pet? Or do you want to put it to 'sleep'? ")

if action == "feed":
    hunger = hunger - 2
    print("Munch munch! Hunger is now lower.")
elif action == "play":
    health = health + 2
    print("Yay! Your pet is happy.")
elif action == "sleep":
    energy = energy + 5
    print("Shh... Your pet is sleeping now...")
else:
    print("Your pet looks confused...")

if hunger <= 0:
    print("Your pet is full!")

# Part 3: Repetition
is_alive = True

while is_alive == True:
    print("\n--- Status Check ---")
    action = input("Command (feed/play/sleep/quit): ")

    if action == "quit":
        is_alive = False
        print("Goodbye!")
    elif action == "feed":
        hunger = hunger - 2
        print("Munch munch! Hunger is now lower.")
    elif action == "play":
        health = health + 2
        print("Yay! Your pet is happy.")
    elif action == "sleep":
        energy = energy + 5
        print("Shh... Your pet is sleeping now...")
    else:
        print("Your pet looks confused...")