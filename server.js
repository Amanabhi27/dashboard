def firstNVowels(str1, N): 
    # List to store vowels from the string
    vowels = [char for char in str1 if char.lower() in 'aeiou']
    
    # Check if there are enough vowels in the string
    if len(vowels) == 0:
        print("Not enough vowels")
    else:
        # Output the first N vowels or all vowels present
        print("".join(vowels[:N]) if len(vowels) >= N else "".join(vowels))
        
def main():
    # Read the input string
    str1 = input().strip()
    # Read the integer N
    n = int(input())
    # Call the function with inputs
    firstNVowels(str1, n)

main()