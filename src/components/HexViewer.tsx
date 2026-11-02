"use client";

import React, { useMemo } from "react";

interface HexViewerProps {
  buffer: ArrayBuffer | null;
  maxBytes?: number;
}

export const HexViewer: React.FC<HexViewerProps> = ({ buffer, maxBytes = 512 }) => {
  const hexLines = useMemo(() => {
    if (!buffer || buffer.byteLength === 0) return [];

    const limit = Math.min(buffer.byteLength, maxBytes);
    const uint8 = new Uint8Array(buffer, 0, limit);
    const lines: { offset: string; hex: string[]; ascii: string }[] = [];

    for (let i = 0; i < limit; i += 16) {
      const offset = i.toString(16).padStart(8, "0");
      const hex: string[] = [];
      let ascii = "";

      for (let j = 0; j < 16; j++) {
        if (i + j < limit) {
          const byte = uint8[i + j];
          hex.push(byte.toString(16).padStart(2, "0").toUpperCase());
          ascii += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
        } else {
          hex.push("  ");
        }
      }

      lines.push({ offset, hex, ascii });
    }

    return lines;
  }, [buffer, maxBytes]);

  if (!buffer) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-xl border border-slate-800">
        Upload or load a Yamaha PPI package to inspect raw binary bytes.
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-xl border border-slate-800 overflow-x-auto select-text max-h-[380px]">
      <div className="text-slate-500 pb-2 border-b border-slate-800 mb-2 flex justify-between text-[10px]">
        <span>OFFSET    00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
        <span>ASCII DUMP</span>
      </div>
      <div className="space-y-1">
        {hexLines.map((line, idx) => (
          <div key={idx} className="flex gap-4 hover:bg-slate-900/80 px-1 rounded transition-colors">
            <span className="text-brand-400 select-none">{line.offset}</span>
            <div className="flex gap-1.5 text-slate-300">
              {line.hex.slice(0, 8).map((byte, bIdx) => (
                <span
                  key={bIdx}
                  className={`w-5 text-center ${
                    byte === "50" || byte === "41" || byte === "43"
                      ? "text-emerald-400 font-bold"
                      : byte === "00"
                      ? "text-slate-600"
                      : "text-slate-300"
                  }`}
                >
                  {byte}
                </span>
              ))}
              <span className="text-slate-600 select-none">|</span>
              {line.hex.slice(8, 16).map((byte, bIdx) => (
                <span key={bIdx} className="w-5 text-center text-slate-300">
                  {byte}
                </span>
              ))}
            </div>
            <span className="text-amber-300 select-none">|{line.ascii}|</span>
          </div>
        ))}
      </div>
    </div>
  );
};
