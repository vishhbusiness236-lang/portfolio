"use client";

import { useEffect } from "react";
import { CONTENT, type Fav } from "@/lib/content";

function Favs({ items, empty }: { items: Fav[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-[16px] leading-7 text-[#6a6355]">{empty}</p>;
  }
  return (
    <div>
      {items.map((it) => (
        <div key={it.title} className="border-t border-[#d8cfbd] py-4">
          <div className="serif text-2xl text-[#1b1a17]">{it.title}</div>
          {it.by && <div className="text-sm text-[#6a6355]">{it.by}</div>}
          {it.why && (
            <p className="mt-1 text-[16px] leading-7 text-[#47423a]">{it.why}</p>
          )}
        </div>
      ))}
      <div className="border-t border-[#d8cfbd]" />
    </div>
  );
}

export default function RoomPanel({
  kind,
  onClose,
  music,
  onToggleMusic,
}: {
  kind: string;
  onClose: () => void;
  music: boolean;
  onToggleMusic: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  let note = "";
  let title = "";
  let body: React.ReactNode = null;

  if (kind === "books") {
    note = "what I read";
    title = "Bookshelf";
    body = (
      <>
        {CONTENT.nowReading && (
          <p className="mb-4 text-[16px] text-[#47423a]">
            <span className="hand text-xl text-[#b4442c]">reading now: </span>
            {CONTENT.nowReading}
          </p>
        )}
        <Favs
          items={CONTENT.books}
          empty="I am still choosing which books deserve a place on this shelf."
        />
      </>
    );
  } else if (kind === "songs") {
    note = "what I listen to";
    title = "Speakers";
    body = (
      <>
        <button
          onClick={onToggleMusic}
          className="mb-4 rounded-full bg-[#1b1a17] px-4 py-2 text-sm text-[#f4efe6] hover:bg-[#b4442c]"
        >
          {music ? "Stop the room music" : "Play the room music"}
        </button>
        {CONTENT.nowListening && (
          <p className="mb-4 text-[16px] text-[#47423a]">
            <span className="hand text-xl text-[#b4442c]">on repeat: </span>
            {CONTENT.nowListening}
          </p>
        )}
        <Favs
          items={CONTENT.songs}
          empty="My favourite songs will live here soon."
        />
      </>
    );
  } else if (kind === "boxing") {
    note = "away from the keyboard";
    title = "Boxing";
    body = (
      <p className="text-[17px] leading-8 text-[#3a362e]">
        {CONTENT.boxing ||
          "I box. The heavy bag in the corner swings if you punch it, try it."}
      </p>
    );
  } else {
    note = "what is pinned up";
    title = "Cork board";
    body = (
      <ul className="space-y-3 text-[17px] leading-7 text-[#3a362e]">
        {CONTENT.goals.map((g) => (
          <li key={g} className="border-l-2 border-[#b4442c] pl-4">
            {g}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="pop paper-scroll max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-[#f4efe6] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="hand inline-block -rotate-2 text-2xl text-[#b4442c]">
              {note}
            </span>
            <h2 className="serif text-5xl leading-none">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-[#6a6355] hover:text-[#b4442c]"
          >
            Close ✕
          </button>
        </div>
        <div className="mt-6">{body}</div>
      </div>
    </div>
  );
}