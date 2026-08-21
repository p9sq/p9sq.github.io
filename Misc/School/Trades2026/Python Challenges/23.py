# Challenge 23: Convert Celsius to Fahrenheit
def celcius_to_fahrenheit(celcius):
    return (celcius * 9/5) + 32

celcius = float(input("Please input the temperature in Celcius: "))
print("Temperature in Fahrenheit:", celcius_to_fahrenheit(celcius))