import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useSocket } from "@/Components/SocketContext";

export const Navbar = () => {
  const [ip, setIp] = useState("127.0.0.1");
  const [port, setPort] = useState("5000"); // Default Gateway Port
  const [isLoading, setIsLoading] = useState(false);

  const {
    IsGatewayConnected,
    IsServerConnected,
    ServerConnectError,
    GatewayConnectError,
    ConnectToGateway,
    ConnectToServer,
  } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (IsServerConnected) {
      setIsLoading(false);
      navigate("/dashboard");
    }
  }, [IsServerConnected, navigate]);

  useEffect(() => {
    if (GatewayConnectError) {
      setIsLoading(false);
    }
  }, [GatewayConnectError]);

  useEffect(() => {
    if (ServerConnectError) {
      setIsLoading(false);
    }
  }, [ServerConnectError]);

  useEffect(() => {
    if (IsGatewayConnected && !IsServerConnected) {
      setTimeout(() => {
        setIsLoading((prev) => (prev ? false : prev));

        setPort((prev) => (prev !== "5000" ? "5000" : prev));
      }, 0);
    }
  }, [IsGatewayConnected, IsServerConnected]);

  const handleConnect = () => {
    setIsLoading(true);
    if (!IsGatewayConnected) {
      ConnectToGateway(ip, port);
    } else {
      ConnectToServer(ip, port);
    }
  };

  return (
    <HeroUINavbar
      className="bg-transparent"
      isBlurred={false}
      position="sticky"
    >
      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="center"
      >
        {!IsServerConnected && (
          <>
            <NavbarItem>
              <Input
                className="w-32"
                isDisabled={isLoading}
                placeholder={!IsGatewayConnected ? "Gateway IP" : "Server IP"}
                size="sm"
                value={ip}
                onValueChange={setIp}
              />
            </NavbarItem>
            <NavbarItem>
              <Input
                className="w-20"
                isDisabled={isLoading}
                placeholder={
                  !IsGatewayConnected ? "Gateway Port" : "Server Port"
                }
                size="sm"
                value={port}
                onValueChange={setPort}
              />
            </NavbarItem>
            <NavbarItem>
              <Button
                className="text-sm font-normal text-default-600 bg-default-100"
                isDisabled={isLoading}
                isLoading={isLoading}
                variant="flat"
                onPress={handleConnect}
              >
                {isLoading
                  ? "Connecting..."
                  : !IsGatewayConnected
                    ? "Connect Gateway"
                    : "Connect Server"}
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </HeroUINavbar>
  );
};
