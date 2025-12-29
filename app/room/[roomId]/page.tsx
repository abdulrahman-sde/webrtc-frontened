"use client";
import Overlay from "@/components/Overlay";
import { useSocket } from "@/contexts/SocketContext";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function Room() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const email = searchParams.get("email");
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteEmailRef = useRef<string | null>(null);

  const createPeerConnection = () => {
    // STUN server helps finding public IP

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const pc = new RTCPeerConnection(configuration);

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.ontrack = (event) => {
      console.log("Remote track received", event.track.kind);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteEmailRef) {
        socket?.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteEmailRef.current,
          from: email,
        });
      }
    };

    return pc;
  };
  const getMediaAndJoinRom = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    if (socket) {
      ("emitting join-room");
      peerConnectionRef.current = createPeerConnection();
      socket.emit("join-room", { roomId, email });
    }
  };

  const userJoined = async ({ email: remoteEmail }: { email: string }) => {
    console.log("user-joined");
    toast.success(`${remoteEmail} joined the room`);
    // setRemoteEmail(remoteEmail);
    remoteEmailRef.current = remoteEmail; // Add this line

    if (peerConnectionRef.current) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket?.emit("create-offer", { offer, to: remoteEmail, from: email });
    }
  };

  const handleExistingUser = async (existingUsers: string[]) => {
    const otherUserEmail = existingUsers.find((u) => u !== email);
    if (!otherUserEmail) return;

    remoteEmailRef.current = otherUserEmail;
  };

  const handleOfferReceived = async ({
    offer,
    from,
  }: {
    offer: RTCSessionDescriptionInit;
    from: string;
  }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket?.emit("create-answer", { answer, to: from, from: email });
    }
  };

  const handleAnswerReceived = async ({
    answer,
    from,
  }: {
    answer: RTCSessionDescriptionInit;
    from: string;
  }) => {
    if (peerConnectionRef.current)
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
  };

  const handleIceCandidateReceived = async ({
    candidate,
  }: {
    candidate: RTCIceCandidateInit;
  }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  };
  useEffect(() => {
    if (!socket || !email) return;

    getMediaAndJoinRom();

    socket?.on("user-joined", userJoined);
    socket?.on("existing-user", handleExistingUser);
    socket?.on("offer-received", handleOfferReceived);
    socket?.on("answer-received", handleAnswerReceived);
    socket?.on("ice-candidate-received", handleIceCandidateReceived);
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();

      socket?.off("user-joined", userJoined);
      socket?.off("existing-user", handleExistingUser);
      socket?.off("offer-received", handleOfferReceived);
      socket?.off("answer-received", handleAnswerReceived);
      socket?.off("ice-candidate-received", handleIceCandidateReceived);
    };
  }, [socket]);
  return (
    <div className="relative h-screen w-full bg-slate-950 flex flex-col md:flex-row items-center justify-center p-4 gap-4 overflow-hidden">
      {/* Remote Video (The "Main" View) */}
      <div className="relative w-full h-full md:flex-1 max-w-5xl aspect-video md:aspect-auto rounded-2xl overflow-hidden bg-slate-900 ring-1 ring-white/10 shadow-2xl">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Remote Label */}
        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm">
          {remoteEmailRef.current || "Waiting for user..."}
        </div>
      </div>

      {/* Local Video (Floating on Mobile, Side-bar on Desktop) */}
      <div className="absolute top-6 right-6 w-32 h-48 md:relative md:top-0 md:right-0 md:w-72 md:h-fit rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20 z-10 transition-all duration-300">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]" // Mirrored for natural feel
        />
        {/* <div className="absolute bottom-2 left-2">
          <Overlay email={email} />
        </div> */}
      </div>

      {/* Mobile Call Controls (Optional Add-on) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
        {/* <button className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition-all">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
            <line x1="23" y1="1" x2="1" y2="23"></line>
          </svg>
        </button> */}
      </div>
    </div>
  );
}
