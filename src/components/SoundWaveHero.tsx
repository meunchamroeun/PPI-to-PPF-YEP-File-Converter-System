"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * ==============================================================================
 * SOUND WAVE HERO BACKGROUND (Inspired by Somleng Voice Studio)
 * ==============================================================================
 * Radial ambient glow orbs paired with animated SVG harmonic sound waves
 * creating an ultra-clean, audio-focused studio atmosphere.
 */
export function SoundWaveHero() {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex h-[620px] w-full items-center justify-center overflow-hidden">
      {/* Radial ambient glow orbs */}
      <div className="absolute top-1/4 h-80 w-80 rounded-full bg-brand-500/15 dark:bg-brand-500/20 blur-[130px] animate-pulse" />
      <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[110px]" />
      <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-[110px]" />

      {/* SVG Voice / AWM2 Soundwaves */}
      <svg
        className="h-full w-full opacity-35 dark:opacity-45"
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M-100,300 C200,220 400,380 720,300 C1040,220 1240,380 1540,300"
          stroke="url(#gradient-wave-1)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0.8, opacity: 0.4 }}
          animate={{
            d: [
              "M-100,300 C200,220 400,380 720,300 C1040,220 1240,380 1540,300",
              "M-100,300 C200,380 400,220 720,300 C1040,380 1240,220 1540,300",
              "M-100,300 C200,220 400,380 720,300 C1040,220 1240,380 1540,300",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M-100,320 C180,390 420,240 720,310 C1020,380 1260,230 1540,320"
          stroke="url(#gradient-wave-2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ opacity: 0.3 }}
          animate={{
            d: [
              "M-100,320 C180,390 420,240 720,310 C1020,380 1260,230 1540,320",
              "M-100,320 C180,250 420,370 720,310 C1020,250 1260,370 1540,320",
              "M-100,320 C180,390 420,240 720,310 C1020,380 1260,230 1540,320",
            ],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M-100,280 C240,200 480,360 720,280 C960,200 1200,360 1540,280"
          stroke="url(#gradient-wave-1)"
          strokeWidth="1"
          strokeDasharray="4 8"
          animate={{
            strokeDashoffset: [0, -100],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <defs>
          <linearGradient id="gradient-wave-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="30%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-wave-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
