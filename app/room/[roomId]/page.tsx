"use client";
import Overlay from "@/components/Overlay";
import { useSocket } from "@/contexts/UserContext";
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
    <div className="relative group flex  justify-center items-center gap-4  h-screen">
      <div className="relative w-100 h-70 overflow-hidden rounded-lg bg-slate-950 ring-1 ring-white/10 shadow-2xl">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto  object-cover brightness-95 group-hover:brightness-100 transition-all duration-500"
        />

        <Overlay email={email} />
      </div>
      <div className="relative w-100 h-70 overflow-hidden rounded-lg bg-slate-950 ring-1 ring-white/10 shadow-2xl">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-auto  object-cover brightness-95 group-hover:brightness-100 transition-all duration-500"
        />
        {/* <Overlay email={remoteEmailRef} />" */}
      </div>
    </div>
  );
}
