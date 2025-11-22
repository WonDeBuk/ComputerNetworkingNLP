#include "Server.h"
#include <iostream>

int main() {
    Server myServer;

    std::cout << "Khoi tao Server..." << std::endl;
    if (myServer.Init()) {
        std::cout << "Khoi tao thanh cong. Bat dau lang nghe..." << std::endl;
        
        // Vong lap vo han de lien tuc chap nhan ket noi (trong thuc te se can co che thoat)
        while (true) {
            myServer.ListenForConnections();
        }
    } else {
        std::cout << "Khoi tao Server that bai." << std::endl;
    }

    return 0;
}
