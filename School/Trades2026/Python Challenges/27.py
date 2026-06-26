# Challenge 27: Print Fibonacci Series
def fibonacci_series(num_terms):
    first_term, second_term = 0, 1
    for _ in range(num_terms):
        print(first_term, end=" ")
        next_term = first_term + second_term
        first_term = second_term
        second_term = next_term

num_terms = int(input("Please input the number of terms:"))
fibonacci_series(num_terms)