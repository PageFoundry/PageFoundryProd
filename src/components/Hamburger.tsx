"use client";
import { useState } from "react";

export default function Hamburger({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      aria-label="Menu"
      onClick={onClick}
      className="relative w-9 h-9 flex flex-col justify-center items-center"
    >
      <span
        className={`absolute h-[3px] w-7 bg-white rounded transition-all duration-300
        ${open ? "rotate-45 translate-y-[2px]" : "-translate-y-2"}`}
      ></span>

      <span
        className={`absolute h-[3px] w-7 bg-white rounded transition-all duration-300
        ${open ? "opacity-0" : "opacity-100"}`}
      ></span>

      <span
        className={`absolute h-[3px] w-7 bg-white rounded transition-all duration-300
        ${open ? "-rotate-45 -translate-y-[2px]" : "translate-y-2"}`}
      ></span>
    </button>
  );
}
