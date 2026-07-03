import random
score = 0

questions = [
    {
        "text": "Which planet is the smallest?",
        "correct_answer": "Mercury",
        "correct_letter": "D",
        "possible_answers": [
            "A. Earth",
            "B. Jupiter",
            "C. Uranus",
            "D. Mercury"
        ],
        "explanation": "Mercury is only 5% of Earth's mass and only 38% of Earth's radius, making it the smallest and least-massive planet in the Solar System! (Sorry Pluto lovers)"
    },
    {
        "text": "Which planet is the hottest?",
        "correct_answer": "Venus",
        "correct_letter": "A",
        "possible_answers": [
            "A. Venus",
            "B. Mercury",
            "C. Mars",
            "D. Saturn"
        ],
        "explanation": "Dispite Mercury being closer to the Sun than Venus, Venus is hotter because of its thick atmosphere that traps heat."
    },
    {
        "text": "Which planet has life?",
        "correct_answer": "Earth",
        "correct_letter": "C",
        "possible_answers": [
            "A. Mars",
            "B. Venus",
            "C. Earth",
            "D. Neptune"
        ],
        "explanation": "Earth is the only planet known in the entire universe to host complex life."
    },
    {
        "text": "Which planet is named after the Roman god of war?",
        "correct_answer": "Mars",
        "correct_letter": "C",
        "possible_answers": [
            "A. Earth",
            "B. Mercury",
            "C. Mars",
            "D. Uranus"
        ],
        "explanation": "Mars (the planet), aka the \"Red Planet\" is named after the Roman god of war, Mars."
    },
    {
        "text": "Which planet is the biggest?",
        "correct_answer": "Jupiter",
        "correct_letter": "B",
        "possible_answers": [
            "A. Earth",
            "B. Jupiter",
            "C. Mercury",
            "D. Saturn"
        ],
        "explanation": "Jupiter is roughly 11 times bigger than Earth and 314 times more massive than Earth, making it the biggest and most massive planet in the Solar System!"
    },
    {
        "text": "Which planet has the largest rings?",
        "correct_answer": "Saturn",
        "correct_letter": "A",
        "possible_answers": [
            "A. Saturn",
            "B. Jupiter",
            "C. Neptune",
            "D. Uranus"
        ],
        "explanation": "Saturn is the only planet in the Solar System with the largest, densest, and most prominant ring system."
    },
    {
        "text": "Which planet is tilted on its side?",
        "correct_answer": "Uranus",
        "correct_letter": "C",
        "possible_answers": [
            "A. Earth",
            "B. Venus",
            "C. Uranus",
            "D. Saturn"
        ],
        "explanation": "Uranus is the only planet to be rotating on its side. This is likely due to another planet colliding with Uranus in the past."
    },
    {
        "text": "Which planet has the fastest wind speeds?",
        "correct_answer": "Neptune",
        "correct_letter": "A",
        "possible_answers": [
            "A. Neptune",
            "B. Venus",
            "C. Jupiter",
            "D. Earth"
        ],
        "explanation": "Neptune has wind speeds that go up to 2,100 km/h (1,300 mph)."
    },
]

random.shuffle(questions)

print("Welcome to the Solar System quiz!")
print("Answer the following questions:")

for question in questions:
    print(question["text"])
    print("Possible answers:\n" + "\n".join(question["possible_answers"]))
    user_answer = input("Type your answer: ").lower()

    while user_answer == None or user_answer == "":
        print("Invalid input. Please try again.")
        user_answer = input("Type your answer: ").lower()

    if user_answer == question["correct_answer"].lower() or user_answer == question["correct_letter"].lower():
        print("Correct!")
        print("")
        score += 1
    else:
        print("Incorrect!")
        print("The correct answer is " + question["correct_letter"] + ". " + question["correct_answer"])
        print("Reason:", question["explanation"])
        print("")

print("You have completed the quiz! Your total score is " + str(score) + "/8!")