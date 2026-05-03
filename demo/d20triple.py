import random

def roll_multiple_d20(n_rolls=3):
    results = []
  
    for i in range(1, n_rolls + 1):
        roll = random.randint(1, 20)
        results.append(roll)
        
        print(f"Roll {i}: {roll}")
        
        if roll == 20:
            print(f"-> Roll {i} Critical Success!")
        elif roll == 1:
            print(f"-> Roll {i} Critical Fail!")
    return results

if __name__ == "__main__":
    rolls = roll_multiple_d20(3)
  
    r1, r2, r3 = rolls
    print(f"Summary: {r1}, {r2}, {r3}")
