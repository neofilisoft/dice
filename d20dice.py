import random

def roll_d20():
    result = random.randint(1, 20)
    print(f"d{result}")
    if result == 20:
        print("ritical Success!")
    elif result == 1:
        print("Critical Fail!")
    return result

if __name__ == "__main__":
    roll_d20()
