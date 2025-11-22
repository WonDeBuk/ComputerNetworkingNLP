#include "Server.h"

// Constructor: Khoi tao gia tri ban dau
Server::Server() {
    ServerSocket = INVALID_SOCKET; // Dat socket ban dau la khong hop le
}

// Destructor: Don dep tai nguyen khi doi tuong bi huy
Server::~Server() {
    // Dong socket neu dang mo
    if (ServerSocket != INVALID_SOCKET) {
        closesocket(ServerSocket);
    }
    // Don dep Winsock
    WSACleanup();
}

// Khoi tao Winsock va Server Socket
bool Server::Init() {
    // WSADATA: Cau truc du lieu chua thong tin ve phien ban Windows Sockets (Winsock) dang duoc su dung.
    // Khi goi WSAStartup, he thong se dien thong tin vao cau truc nay.
    WSADATA wsaData;

    // WSAStartup: Khoi tao viec su dung thu vien Winsock DLL.
    // MAKEWORD(2, 2): Yeu cau phien ban Winsock 2.2.
    // &wsaData: Con tro den cau truc WSADATA de nhan thong tin chi tiet.
    int iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
        std::cout << "WSAStartup that bai voi loi: " << iResult << std::endl;
        return false;
    }

    // socket: Tao mot socket moi.
    // AF_INET: Su dung dia chi IPv4 (Address Family Internet).
    // SOCK_STREAM: Kieu socket la Stream Socket (TCP) - dam bao tin cay, dung thu tu.
    // IPPROTO_TCP: Giao thuc su dung la TCP.
    ServerSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (ServerSocket == INVALID_SOCKET) {
        std::cout << "Tao socket that bai voi loi: " << WSAGetLastError() << std::endl;
        WSACleanup(); // Don dep Winsock truoc khi thoat
        return false;
    }

    // Thiet lap cau truc dia chi cho Server
    ServerAddr.sin_family = AF_INET; // IPv4
    ServerAddr.sin_addr.s_addr = INADDR_ANY; // Lang nghe tren tat ca cac card mang (interface) cua may
    ServerAddr.sin_port = htons(8080); // Cong (Port) lang nghe la 8080. htons: Host TO Network Short (chuyen doi Byte order)

    // bind: Gan (bind) socket voi dia chi IP va cong da thiet lap.
    if (bind(ServerSocket, (sockaddr*)&ServerAddr, sizeof(ServerAddr)) == SOCKET_ERROR) {
        std::cout << "Bind that bai voi loi: " << WSAGetLastError() << std::endl;
        closesocket(ServerSocket);
        WSACleanup();
        return false;
    }

    // listen: Chuyen socket sang trang thai lang nghe cac ket noi den.
    // SOMAXCONN: So luong ket noi toi da trong hang doi (Backlog).
    if (listen(ServerSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cout << "Listen that bai voi loi: " << WSAGetLastError() << std::endl;
        closesocket(ServerSocket);
        WSACleanup();
        return false;
    }

    std::cout << "Server dang lang nghe tren cong 8080..." << std::endl;
    return true;
}

// Lang nghe va chap nhan ket noi
void Server::ListenForConnections() {
    SOCKET ClientSocket = INVALID_SOCKET;
    sockaddr_in ClientAddr;
    int ClientAddrLen = sizeof(ClientAddr);

    std::cout << "Dang cho ket noi tu Client..." << std::endl;

    // accept: Chap nhan mot ket noi dang nam trong hang doi.
    // Ham nay se CHAN (block) chuong trinh cho den khi co mot Client ket noi den.
    ClientSocket = accept(ServerSocket, (sockaddr*)&ClientAddr, &ClientAddrLen);
    if (ClientSocket == INVALID_SOCKET) {
        std::cout << "Accept that bai voi loi: " << WSAGetLastError() << std::endl;
        return;
    }

    // Chuyen doi dia chi IP cua Client sang chuoi ky tu de in ra
    char clientIP[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &ClientAddr.sin_addr, clientIP, INET_ADDRSTRLEN);

    std::cout << "Client da ket noi! IP: " << clientIP << ", Port: " << ntohs(ClientAddr.sin_port) << std::endl;

    // Tao thread de nhan tin nhan tu Client
    std::thread receiverThread(&Server::ReceiveMessage, this, ClientSocket);
    receiverThread.detach(); // Tach thread de no chay doc lap

    // Vong lap de gui tin nhan tu Console
    std::string message;
    while (true) {
        std::getline(std::cin, message);
        if (message == "exit") {
            break;
        }
        if (message.length() > 0) {
            send(ClientSocket, message.c_str(), message.length(), 0);
        }
    }

    // Dong socket cua Client sau khi thoat
    closesocket(ClientSocket);
}

// Nhan tin nhan tu Client
void Server::ReceiveMessage(SOCKET ClientSocket) {
    char buffer[4096];
    while (true) {
        ZeroMemory(buffer, 4096);
        int bytesReceived = recv(ClientSocket, buffer, 4096, 0);
        if (bytesReceived > 0) {
            std::cout << "Client: " << std::string(buffer, 0, bytesReceived) << std::endl;
        }
        else if (bytesReceived == 0) {
            std::cout << "Client da ngat ket noi." << std::endl;
            break;
        }
        else {
            std::cout << "Loi khi nhan du lieu: " << WSAGetLastError() << std::endl;
            break;
        }
    }
}