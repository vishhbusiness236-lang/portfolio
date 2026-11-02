"use client";

import dynamic from "next/dynamic";

const Room = dynamic(() => import("./Room"), {
  ssr: false,
  loading: () => (
    <div className="hand flex h-screen items-center justify-center text-3xl text-[#e8dcc6]">
      opening the room...
    </div>
  ),
});

export default function RoomLoader() {
  return <Room />;
}