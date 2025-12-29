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
  useEffect(() => {
    const socketInstance = io("http://localhost:4000");
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
