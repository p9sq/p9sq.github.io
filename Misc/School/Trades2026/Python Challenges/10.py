# Challenge 10: Fibonacci Series
num_terms = int(input("Please provide the number of terms: "))

first_term = 0
second_term = 1

print("Fibonacci Series:")
for i in range(num_terms):
    print(first_term, end=" ")
    next_term = first_term + second_term
    first_term = second_term
    second_term = next_term