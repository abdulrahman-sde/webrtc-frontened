"use client";

import { useSocket } from "@/contexts/SocketContext";
import { useRouter } from "next/navigation";
import { ReactElement, useRef, useState } from "react";

export default function Home() {
  let inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState({
    email: "",
    roomId: "",
  });
  const { socket } = useSocket();
  const router = useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleJoinRoom = () => {
    // inputRef.current?.classList.toggle("animate");
    // setTimeout(() => {
    //   inputRef.current?.classList.remove("animate");
    //   console.log(inputRef.current?.className);
    // }, 200);

    if (!socket) return;
    const { email, roomId } = state;
    router.push(`room/${roomId}?email=${email}`);
  };
  return (
    <div className="flex justify-center items-center h-screen flex-col gap-3">
      <input
        ref={inputRef}
        name="email"
        value={state.email}
        onChange={handleChange}
        placeholder="Enter your email"
        className="border border-neutral-900 px-4 py-2 w-70.25 rounded-lg"
      />

      <input
        name="roomId"
        value={state.roomId}
        onChange={handleChange}
        placeholder="Enter room code"
        className="border border-neutral-900 px-4 py-2 w-70.25 rounded-lg"
      />

      <button
        className="bg-neutral-900 text-white px-6 mt-2 hover:bg-neutral-900/80 cursor-pointer py-1.5 rounded-lg"
        onClick={handleJoinRoom}
      >
        Enter room
      </button>
    </div>
  );
}
