"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-[#1b1a17] px-4 py-2 text-sm text-[#f4efe6] hover:bg-[#b4442c]"
    >
      Print / Save as PDF
    </button>
  );
}