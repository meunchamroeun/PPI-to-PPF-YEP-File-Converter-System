"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface GSAPAudioVisualizerProps {
  isActive?: boolean;
  barCount?: number;
  className?: string;
}

export const GSAPAudioVisualizer: React.FC<GSAPAudioVisualizerProps> = ({
  isActive = false,
  barCount = 24,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const bars = containerRef.current.querySelectorAll(".eq-bar");

    if (isActive) {
      timelineRef.current = gsap.timeline({ repeat: -1 });

      bars.forEach((bar, index) => {
        gsap.to(bar, {
          scaleY: () => 0.2 + Math.random() * 0.8,
          duration: () => 0.15 + Math.random() * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: index * 0.02,
        });
      });
    } else {
      // Idle state: subtle breathe animation
      bars.forEach((bar, index) => {
        gsap.killTweensOf(bar);
        gsap.to(bar, {
          scaleY: 0.15 + Math.sin(index * 0.5) * 0.1,
          duration: 0.5,
          ease: "power2.out",
        });
      });
    }

    return () => {
      bars.forEach((bar) => gsap.killTweensOf(bar));
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [isActive, barCount]);

  return (
    <div
      ref={containerRef}
      className={`flex items-end justify-center gap-1 h-12 px-3 py-1 bg-slate-900/60 dark:bg-slate-950/80 rounded-xl border border-slate-700/50 ${className}`}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="eq-bar w-1.5 bg-gradient-to-t from-brand-600 via-indigo-400 to-emerald-400 rounded-full origin-bottom"
          style={{ height: "100%", transform: "scaleY(0.2)" }}
        />
      ))}
    </div>
  );
};
