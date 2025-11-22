#pragma once

#include <winsock2.h>
#include <ws2tcpip.h>
#include <iostream>
#include <thread>
#include <string>

// Link voi thu vien Ws2_32.lib
#pragma comment(lib, "Ws2_32.lib")

class Server {
private:
    SOCKET ServerSocket;
    sockaddr_in ServerAddr;

public:
    Server();
    ~Server();

    // Khoi tao Winsock va Socket
    bool Init();

    // Lang nghe ket noi va xu ly Discovery Request
    void ListenForConnections();

    // Nhan tin nhan tu Client (chay tren thread rieng)
    void ReceiveMessage(SOCKET ClientSocket);
};
