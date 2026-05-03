#include <iostream>
#include <string>
#include <random>
#include <limits>

using namespace std;

int roll_dice(int sides) {
    // random_device และ mt19937 ในการสุ่ม
    static random_device rd;
    static mt19937 gen(rd());
    uniform_int_distribution<> dis(1, sides);
    return dis(gen);
}

int main() {
    int sides, count;
    char choice;

    cout << "--- โปรแกรมทอยลูกเต๋า ---" << endl;

    while (true) {
        cout << "\nระบุจำนวนหน้าของลูกเต๋า: ";
        while (!(cin >> sides) || sides <= 0) {
            cout << "กรอกตัวเลขที่มากกว่า 0: ";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
        }

        cout << "ต้องการทอยกี่ลูก: ";
        while (!(cin >> count) || count <= 0) {
            cout << "กรอกจำนวนลูกเต๋าที่มากกว่า 0: ";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
        }

        cout << "\nผลการทอย: ";
        int total = 0;
        for (int i = 0; i < count; ++i) {
            int result = roll_dice(sides);
            total += result;
            cout << "[" << result << "] ";
        }

        cout << "\nแต้มรวมทั้งหมด: " << total << endl;

        cout << "\nต้องการทอยใหม่หรือไม่? (y/n): ";
        cin >> choice;
        if (choice == 'n' || choice == 'N') {
            cout << "" << endl;
            break;
        }
    }

    return 0;
}
