import random

def roll_double_d20():
    results = []
    
    for i in range(1, 3):
        roll = random.randint(1, 20)
        results.append(roll)
        
        print(f"Roll {i}: {roll}")
        
        if roll == 20:
            print(f"-> Roll {i} Critical Success!")
        elif roll == 1:
            print(f"-> Roll {i} Critical Fail!")
            
    return results[0], results[1]

if __name__ == "__main__":
    roll1, roll2 = roll_double_d20()
    # can access individual rolls here if needed
    # print(f"Summary: {roll1}, {roll2}")
