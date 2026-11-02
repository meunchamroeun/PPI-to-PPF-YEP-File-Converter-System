"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Sliders,
  Play,
  Square,
  Sparkles,
  Music,
  Radio,
  Layers,
  Activity,
  Disc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface VoicePreset {
  id: string;
  name: string;
  category: "PIANO" | "STRINGS" | "SYNTH" | "ETHNIC";
  type: string;
  waveform: OscillatorType;
  filterCutoff: number;
  resonance: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

const DEFAULT_PRESETS: VoicePreset[] = [
  {
    id: "grand_piano",
    name: "CFX Concert Grand (AWM2)",
    category: "PIANO",
    type: "Acoustic Sampled Multi-Layer",
    waveform: "triangle",
    filterCutoff: 3800,
    resonance: 1.5,
    attack: 0.005,
    decay: 1.8,
    sustain: 0.15,
    release: 0.6,
  },
  {
    id: "analog_strings",
    name: "Symphonic Warm Strings",
    category: "STRINGS",
    type: "Stereo Ensemble PWM",
    waveform: "sawtooth",
    filterCutoff: 2200,
    resonance: 3.2,
    attack: 0.25,
    decay: 2.0,
    sustain: 0.75,
    release: 1.2,
  },
  {
    id: "dx_lead",
    name: "DX7 Sparkle FM Lead",
    category: "SYNTH",
    type: "6-Operator FM Matrix",
    waveform: "sawtooth",
    filterCutoff: 4500,
    resonance: 4.8,
    attack: 0.01,
    decay: 0.8,
    sustain: 0.4,
    release: 0.45,
  },
  {
    id: "oud_oriental",
    name: "Oriental Oud & Nay Solo",
    category: "ETHNIC",
    type: "Microtonal Plucked Acoustic",
    waveform: "square",
    filterCutoff: 1900,
    resonance: 2.0,
    attack: 0.002,
    decay: 0.9,
    sustain: 0.1,
    release: 0.35,
  },
];

// 2-Octave Keyboard Notes (C3 to C5)
const KEYBOARD_NOTES = [
  { note: "C3", freq: 130.81, isBlack: false },
  { note: "C#3", freq: 138.59, isBlack: true },
  { note: "D3", freq: 146.83, isBlack: false },
  { note: "D#3", freq: 155.56, isBlack: true },
  { note: "E3", freq: 164.81, isBlack: false },
  { note: "F3", freq: 174.61, isBlack: false },
  { note: "F#3", freq: 184.99, isBlack: true },
  { note: "G3", freq: 195.99, isBlack: false },
  { note: "G#3", freq: 207.65, isBlack: true },
  { note: "A3", freq: 220.0, isBlack: false },
  { note: "A#3", freq: 233.08, isBlack: true },
  { note: "B3", freq: 246.94, isBlack: false },
  { note: "C4", freq: 261.63, isBlack: false },
  { note: "C#4", freq: 277.18, isBlack: true },
  { note: "D4", freq: 293.66, isBlack: false },
  { note: "D#4", freq: 311.13, isBlack: true },
  { note: "E4", freq: 329.63, isBlack: false },
  { note: "F4", freq: 349.23, isBlack: false },
  { note: "F#4", freq: 369.99, isBlack: true },
  { note: "G4", freq: 391.0, isBlack: false },
  { note: "G#4", freq: 415.3, isBlack: true },
  { note: "A4", freq: 440.0, isBlack: false },
  { note: "A#4", freq: 466.16, isBlack: true },
  { note: "B4", freq: 493.88, isBlack: false },
  { note: "C5", freq: 523.25, isBlack: false },
];

interface YamahaVoicePlayerProps {
  packVoices?: string[];
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const YamahaVoicePlayer: React.FC<YamahaVoicePlayerProps> = ({
  packVoices = [],
  onPlayStateChange,
}) => {
  const { t, language } = useTranslation();
  const [activePreset, setActivePreset] = useState<VoicePreset>(DEFAULT_PRESETS[0]);
  const [volume, setVolume] = useState<number>(0.75);
  const [filterCutoff, setFilterCutoff] = useState<number>(DEFAULT_PRESETS[0].filterCutoff);
  const [resonance, setResonance] = useState<number>(DEFAULT_PRESETS[0].resonance);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<Map<string, { oscs: OscillatorNode[]; gain: GainNode }>>(new Map());
  const auditionTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize Web Audio Context on first user interaction
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();

      const masterGain = audioCtxRef.current.createGain();
      masterGain.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
      masterGain.connect(audioCtxRef.current.destination);
      masterGainRef.current = masterGain;
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  };

  // Update volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        isMuted ? 0 : volume,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [volume, isMuted]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      auditionTimerRef.current.forEach(clearTimeout);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playNote = (noteName: string, frequency: number, durationSeconds?: number) => {
    try {
      const ctx = getAudioContext();
      if (!ctx || !masterGainRef.current) return;

      // Stop previous instance of this note if re-triggered
      stopNote(noteName);

      const now = ctx.currentTime;

      // Multi-Oscillator architecture for rich Yamaha AWM2 texture
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const subOsc = ctx.createOscillator();

      osc1.type = activePreset.waveform;
      osc1.frequency.setValueAtTime(frequency, now);

      // Osc 2 is slightly detuned (+5 cents) for stereo thickness
      osc2.type = activePreset.waveform;
      osc2.frequency.setValueAtTime(frequency * 1.003, now);

      // Sub-oscillator for bass richness
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(frequency * 0.5, now);

      // 24dB resonant low-pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterCutoff, now);
      filter.Q.setValueAtTime(resonance, now);

      // Voice Amp Envelope (ADSR)
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.7, now + activePreset.attack);
      noteGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, activePreset.sustain * 0.7),
        now + activePreset.attack + activePreset.decay
      );

      // Connect graph: Oscs -> Filter -> NoteGain -> MasterGain -> Destination
      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGainRef.current);

      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);

      activeNodesRef.current.set(noteName, {
        oscs: [osc1, osc2, subOsc],
        gain: noteGain,
      });

      setActiveNote(noteName);
      if (onPlayStateChange) onPlayStateChange(true);

      if (durationSeconds) {
        const timer = setTimeout(() => {
          stopNote(noteName);
        }, durationSeconds * 1000);
        auditionTimerRef.current.push(timer);
      }
    } catch (e) {
      console.warn("Audio playback not ready:", e);
    }
  };

  const stopNote = (noteName: string) => {
    const node = activeNodesRef.current.get(noteName);
    if (!node || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(node.gain.gain.value, now);
    node.gain.gain.exponentialRampToValueAtTime(0.0001, now + activePreset.release);

    setTimeout(() => {
      node.oscs.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_) {}
      });
      node.gain.disconnect();
    }, (activePreset.release + 0.05) * 1000);

    activeNodesRef.current.delete(noteName);

    if (activeNodesRef.current.size === 0) {
      setActiveNote(null);
      if (onPlayStateChange) onPlayStateChange(false);
    }
  };

  // Play an automated 4-bar audition arpeggio
  const playAuditionPhrase = (preset?: VoicePreset) => {
    auditionTimerRef.current.forEach(clearTimeout);
    auditionTimerRef.current = [];

    if (preset) {
      setActivePreset(preset);
      setFilterCutoff(preset.filterCutoff);
      setResonance(preset.resonance);
    }

    setIsAuditioning(true);
    if (onPlayStateChange) onPlayStateChange(true);

    const phrase = [
      { note: "C4", freq: 261.63, delay: 0, dur: 0.35 },
      { note: "E4", freq: 329.63, delay: 280, dur: 0.35 },
      { note: "G4", freq: 391.0, delay: 560, dur: 0.35 },
      { note: "C5", freq: 523.25, delay: 840, dur: 0.7 },
      { note: "G4", freq: 391.0, delay: 1400, dur: 0.3 },
      { note: "E4", freq: 329.63, delay: 1680, dur: 0.3 },
      { note: "C4", freq: 261.63, delay: 1960, dur: 0.9 },
    ];

    phrase.forEach(({ note, freq, delay, dur }) => {
      const timer = setTimeout(() => {
        playNote(note, freq, dur);
      }, delay);
      auditionTimerRef.current.push(timer);
    });

    const endTimer = setTimeout(() => {
      setIsAuditioning(false);
      if (onPlayStateChange) onPlayStateChange(false);
    }, 3100);
    auditionTimerRef.current.push(endTimer);
  };

  const stopAudition = () => {
    auditionTimerRef.current.forEach(clearTimeout);
    auditionTimerRef.current = [];
    activeNodesRef.current.forEach((_, note) => stopNote(note));
    setIsAuditioning(false);
    setActiveNote(null);
    if (onPlayStateChange) onPlayStateChange(false);
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t("player_title")}</span>
                <Badge variant="outline" className="text-[10px] font-mono text-brand-600 border-brand-300">
                  WEB AUDIO
                </Badge>
              </h4>
              <p className="text-xs text-slate-500">
                {t("player_subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex items-center gap-3">
          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">VOL</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Audition Demo Phrase Button */}
          {isAuditioning ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={stopAudition}
              className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{t("player_btn_stop")}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => playAuditionPhrase()}
              className="h-8 text-xs font-semibold gap-1.5 bg-brand-600 hover:bg-brand-500 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t("player_btn_audition")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Preset Selector Grid */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("player_voice_models")}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DEFAULT_PRESETS.map((preset) => {
            const isSelected = activePreset.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  setActivePreset(preset);
                  setFilterCutoff(preset.filterCutoff);
                  setResonance(preset.resonance);
                  playAuditionPhrase(preset);
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 shadow-sm ring-1 ring-brand-500"
                    : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {preset.category}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />}
                </div>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {preset.name}
                </h5>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{preset.type}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detected Pack Voice Chips (if user uploaded a PPI file) */}
      {packVoices.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-indigo-500" />
              <span>Voices Detected in Package ({packVoices.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Click to preview tone</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {packVoices.map((voiceName, idx) => (
              <button
                key={idx}
                onClick={() => playAuditionPhrase()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 transition"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{voiceName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Piano Keyboard (C3 to C5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t("player_virtual_keyboard")}</span>
          </span>
          {activeNote && (
            <Badge variant="secondary" className="font-mono text-[10px] text-emerald-600 bg-emerald-50">
              Note: {activeNote}
            </Badge>
          )}
        </div>

        {/* Keyboard Bed */}
        <div className="relative flex justify-center bg-slate-900 p-3 rounded-2xl border border-slate-800 select-none overflow-x-auto shadow-inner">
          <div className="relative flex h-36">
            {KEYBOARD_NOTES.map((k) => {
              if (k.isBlack) {
                return (
                  <button
                    key={k.note}
                    onMouseDown={() => playNote(k.note, k.freq)}
                    onMouseUp={() => stopNote(k.note)}
                    onMouseLeave={() => stopNote(k.note)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      playNote(k.note, k.freq);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopNote(k.note);
                    }}
                    className={`absolute z-10 w-6 h-22 rounded-b-md shadow-lg transition-transform active:scale-95 ${
                      activeNote === k.note
                        ? "bg-brand-500 border-2 border-brand-300"
                        : "bg-slate-950 hover:bg-slate-800 border border-slate-700"
                    }`}
                    style={{
                      left: getBlackKeyOffset(k.note),
                    }}
                    title={k.note}
                  >
                    <span className="absolute bottom-1.5 left-0 right-0 text-[8px] font-mono font-bold text-center text-slate-400">
                      {k.note}
                    </span>
                  </button>
                );
              }

              // White Key
              return (
                <button
                  key={k.note}
                  onMouseDown={() => playNote(k.note, k.freq)}
                  onMouseUp={() => stopNote(k.note)}
                  onMouseLeave={() => stopNote(k.note)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    playNote(k.note, k.freq);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    stopNote(k.note);
                  }}
                  className={`relative w-8 h-36 rounded-b-lg border-r border-slate-300 last:border-r-0 transition-colors shadow active:bg-slate-200 ${
                    activeNote === k.note
                      ? "bg-brand-200 border-brand-500"
                      : "bg-white hover:bg-slate-100"
                  }`}
                  title={k.note}
                >
                  <span className="absolute bottom-1.5 left-0 right-0 text-[9px] font-mono font-semibold text-center text-slate-500">
                    {k.note}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time Filter & Tone Sculpting Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t("player_cutoff")}</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">{filterCutoff} Hz</span>
          </div>
          <input
            type="range"
            min="400"
            max="12000"
            step="100"
            value={filterCutoff}
            onChange={(e) => setFilterCutoff(parseInt(e.target.value))}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t("player_resonance")}</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">{resonance.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10.0"
            step="0.5"
            value={resonance}
            onChange={(e) => setResonance(parseFloat(e.target.value))}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// Helper to calculate pixel position for black keys
function getBlackKeyOffset(note: string): string {
  const whiteKeyWidth = 32; // w-8 = 32px
  const map: Record<string, number> = {
    "C#3": 0 * whiteKeyWidth + 20,
    "D#3": 1 * whiteKeyWidth + 20,
    "F#3": 3 * whiteKeyWidth + 20,
    "G#3": 4 * whiteKeyWidth + 20,
    "A#3": 5 * whiteKeyWidth + 20,
    "C#4": 7 * whiteKeyWidth + 20,
    "D#4": 8 * whiteKeyWidth + 20,
    "F#4": 10 * whiteKeyWidth + 20,
    "G#4": 11 * whiteKeyWidth + 20,
    "A#4": 12 * whiteKeyWidth + 20,
  };
  return `${map[note] || 0}px`;
}
