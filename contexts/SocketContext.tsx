"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
};
export const SocketContext = createContext<SocketContextType | null>(null);
export default function SocketContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  useEffect(() => {
    const socketInstance = io(baseUrl);
    setSocket(socketInstance);
    return () => {
      socket?.disconnect();
      setSocket(null);
    };
  }, []);
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("Socket is not set ");
  return ctx;
};
