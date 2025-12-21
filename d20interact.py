import random

def simple_d20_roller():
    print("Roll the dice (d20)")
    input("Press Enter")
    result = random.randint(1, 20)
    print(f"Result: d{result}")
    
    if result == 20:
        print("ritical Success!")
    elif result == 1:
        print("Critical Fail!")
    
    return result

if __name__ == "__main__":
    simple_d20_roller()
