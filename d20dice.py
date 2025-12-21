import random

def roll_d20():
    result = random.randint(1, 20)
    print(f"d{result}")
    return result

if __name__ == "__main__":
    roll_d20()
