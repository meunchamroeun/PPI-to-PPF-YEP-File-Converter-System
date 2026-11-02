import { ToolLoopAgent, tool, isStepCount } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

/**
 * Yamaha Expansion Pack & AWM2 Sound Engine Agent Tools
 */

// Tool 1: Inspect Container & Chunks Structure
export const inspectPpiStructureTool = tool({
  description:
    "Analyze Yamaha PPI/PPF/YEP/CPI file container structure, chunk headers (EMHD, INFO, VOIC, STYL, WAVE), DRM encryption status, and hardware target.",
  inputSchema: z.object({
    signature: z
      .string()
      .optional()
      .describe("Container signature such as 'PAC ', 'PPI ', 'PPF ', or 'YEP '"),
    chunkTypes: z
      .array(z.string())
      .optional()
      .describe("Array of chunk four-character codes found in package, e.g. ['EMHD', 'INFO', 'VOIC', 'STYL', 'WAVE']"),
    isProtected: z
      .boolean()
      .optional()
      .describe("True if container is encrypted CPI / CPF DRM protected format"),
    voiceCount: z.number().optional().describe("Number of expansion voices detected"),
    styleCount: z.number().optional().describe("Number of accompaniment styles detected"),
    waveCount: z.number().optional().describe("Number of raw PCM samples / waves detected"),
    totalSizeBytes: z.number().optional().describe("Total file size in bytes"),
  }),
  execute: async ({
    signature = "PAC ",
    chunkTypes = ["EMHD", "INFO", "VOIC", "STYL", "WAVE"],
    isProtected = false,
    voiceCount = 0,
    styleCount = 0,
    waveCount = 0,
    totalSizeBytes = 0,
  }) => {
    const hasHeader = chunkTypes.includes("EMHD");
    const hasInfo = chunkTypes.includes("INFO");
    const hasVoices = chunkTypes.includes("VOIC");
    const hasStyles = chunkTypes.includes("STYL");
    const hasWaves = chunkTypes.includes("WAVE");

    const sizeMb = totalSizeBytes > 0 ? (totalSizeBytes / (1024 * 1024)).toFixed(2) : "Unknown";

    let integrity = "Valid and intact Yamaha expansion container.";
    if (!hasHeader) {
      integrity = "Warning: Missing mandatory EMHD container header. Pack may be truncated or corrupt.";
    }

    let drmAssessment = "Open unprotected container (PPI/PPF). Full bi-directional conversion and sample extraction supported.";
    if (isProtected || signature === "CPI " || signature === "CPF ") {
      drmAssessment = "Protected container (CPI/CPF) with proprietary AES/hardware encryption. Direct sample extraction restricted without valid instrument export authorization.";
    }

    return {
      status: "SUCCESS",
      signature,
      sizeMb: `${sizeMb} MB`,
      chunksDetected: chunkTypes,
      structuralIntegrity: integrity,
      drmStatus: drmAssessment,
      counts: {
        voices: voiceCount,
        styles: styleCount,
        waves: waveCount,
      },
      supportedExportFormats: isProtected ? ["Restricted"] : ["PPF Project Archive", "YEP Legacy Expansion", "WAV PCM 16-bit 44.1kHz"],
    };
  },
});

// Tool 2: Calculate AWM2 Tone Generator Filter & Envelope Curves
export const calculateAwm2FilterTool = tool({
  description:
    "Calculate Yamaha AWM2 tone generator 24dB/18dB/12dB resonant filter cutoff frequency in Hz, Q resonance boost, and AEG (Attack, Decay, Sustain, Release) envelope timing in milliseconds.",
  inputSchema: z.object({
    baseCutoff: z
      .number()
      .min(0)
      .max(127)
      .describe("MIDI Cutoff parameter (0 to 127)"),
    resonance: z
      .number()
      .min(0)
      .max(127)
      .describe("MIDI Resonance Q parameter (0 to 127)"),
    filterType: z
      .enum(["LPF24", "LPF18", "LPF12", "HPF", "BPF"])
      .default("LPF24")
      .describe("AWM2 Filter slope: LPF24 (4-pole), LPF18 (3-pole), LPF12 (2-pole), HPF (High Pass), BPF (Band Pass)"),
    envelope: z
      .object({
        attack: z.number().min(0).max(127).default(32),
        decay: z.number().min(0).max(127).default(64),
        sustain: z.number().min(0).max(127).default(96),
        release: z.number().min(0).max(127).default(48),
      })
      .optional()
      .describe("AEG Envelope generator parameters (0-127)"),
  }),
  execute: async ({ baseCutoff, resonance, filterType, envelope }) => {
    // Yamaha SWP tone generator logarithmic cutoff frequency calculation
    // MIDI 0 approx 20 Hz, MIDI 64 approx 1000 Hz, MIDI 127 approx 20000 Hz
    const cutoffHz = Math.round(20 * Math.pow(1000, baseCutoff / 127));

    // Q resonance factor (0 = 0.707 Butterworth, 127 = 12.0 sharp self-oscillation peak)
    const qFactor = (0.7 + (resonance / 127) * 11.3).toFixed(2);
    const peakBoostDb = (resonance > 64 ? ((resonance - 64) / 63) * 18 : 0).toFixed(1);

    // Approximate envelope times in milliseconds
    const env = envelope || { attack: 32, decay: 64, sustain: 96, release: 48 };
    const attackMs = Math.round(5 + Math.pow(env.attack / 127, 2) * 4500);
    const decayMs = Math.round(20 + Math.pow(env.decay / 127, 2) * 8000);
    const sustainLevelPercent = Math.round((env.sustain / 127) * 100);
    const releaseMs = Math.round(10 + Math.pow(env.release / 127, 2) * 12000);

    return {
      status: "CALCULATED",
      filterModel: {
        filterType,
        midiCutoff: baseCutoff,
        cutoffFrequencyHz: `${cutoffHz} Hz`,
        midiResonance: resonance,
        qFactor,
        resonancePeakBoost: `${peakBoostDb} dB`,
      },
      aegEnvelope: {
        attackTime: `${attackMs} ms`,
        decayTime: `${decayMs} ms`,
        sustainLevel: `${sustainLevelPercent} %`,
        releaseTime: `${releaseMs} ms`,
      },
      swpChipRecommendation:
        resonance > 100
          ? "Caution: High resonance (>100) on AWM2 SWP51L hardware may cause digital clipping on multiple velocity layers. Apply DSP limiter or lower element volume by -3dB."
          : "Nominal operational range for Genos, PSR-SX900, PSR-SX700, and Tyros 5.",
    };
  },
});

// Tool 3: Check Legacy YEP Compatibility (PSR-S950 / S750)
export const checkLegacyYepCompatibilityTool = tool({
  description:
    "Evaluate whether an expansion pack can be down-converted to legacy PSR-S950 / PSR-S750 YEP format without crashing or truncating samples.",
  inputSchema: z.object({
    targetKeyboard: z
      .enum(["PSR-S950", "PSR-S750", "PSR-S970", "PSR-S975", "Tyros4", "Genos"])
      .default("PSR-S950")
      .describe("Destination Yamaha keyboard model"),
    totalWaveMemoryMb: z.number().describe("Total wave sample memory of pack in Megabytes"),
    voiceCount: z.number().describe("Total voice count"),
    hasSuperArticulation: z
      .boolean()
      .default(false)
      .describe("Whether voices contain Super Articulation (S.Art!) or MegaVoice programming"),
  }),
  execute: async ({ targetKeyboard, totalWaveMemoryMb, voiceCount, hasSuperArticulation }) => {
    // Memory capacities:
    // PSR-S950: 64 MB max expansion flash
    // PSR-S750: 64 MB max expansion flash
    // PSR-S970: 512 MB
    // PSR-S975: 1024 MB
    // Genos: 3072 MB
    const limits: Record<string, { maxMb: number; maxVoices: number }> = {
      "PSR-S950": { maxMb: 64, maxVoices: 128 },
      "PSR-S750": { maxMb: 64, maxVoices: 128 },
      "PSR-S970": { maxMb: 512, maxVoices: 256 },
      "PSR-S975": { maxMb: 1024, maxVoices: 512 },
      Tyros4: { maxMb: 1024, maxVoices: 512 },
      Genos: { maxMb: 3072, maxVoices: 1024 },
    };

    const targetSpec = limits[targetKeyboard] || { maxMb: 64, maxVoices: 128 };
    const memoryExceeded = totalWaveMemoryMb > targetSpec.maxMb;
    const voicesExceeded = voiceCount > targetSpec.maxVoices;

    const warnings: string[] = [];
    if (memoryExceeded) {
      warnings.push(
        `Memory Overflow: Pack requires ${totalWaveMemoryMb} MB, but ${targetKeyboard} has a strict limit of ${targetSpec.maxMb} MB flash ROM. Downsampling to 32kHz or trimming release loops required.`
      );
    }
    if (voicesExceeded) {
      warnings.push(
        `Voice Slot Overflow: Pack contains ${voiceCount} voices, exceeding ${targetKeyboard}'s ${targetSpec.maxVoices} voice bank limit.`
      );
    }
    if (hasSuperArticulation && (targetKeyboard === "PSR-S950" || targetKeyboard === "PSR-S750")) {
      warnings.push(
        "Super Articulation Fallback: S.Art! scripts are incompatible with legacy YEP format. Elements will fallback to standard multi-velocity key-switch triggers."
      );
    }

    return {
      targetKeyboard,
      isCompatible: !memoryExceeded && !voicesExceeded,
      memoryUtilization: `${totalWaveMemoryMb} MB / ${targetSpec.maxMb} MB (${Math.round((totalWaveMemoryMb / targetSpec.maxMb) * 100)}%)`,
      voiceUtilization: `${voiceCount} / ${targetSpec.maxVoices}`,
      status: memoryExceeded ? "FAILED_OVERSIZED" : warnings.length > 0 ? "COMPATIBLE_WITH_WARNINGS" : "FULLY_COMPATIBLE",
      warnings,
      downConversionStrategy: memoryExceeded
        ? "1. Convert 44.1kHz 24-bit samples to 44.1kHz 16-bit mono where stereophonic width is secondary.\n2. Trim silent heads/tails on PCM loops.\n3. Remove redundant velocity splits."
        : "Direct format conversion to YEP container without sample truncation.",
    };
  },
});

// Tool 4: Generate MIDI Expansion Bank Mapping Table
export const generateMidiMappingTool = tool({
  description:
    "Generate standard Yamaha Expansion MIDI Bank Select (MSB / LSB) and Program Change (PC) allocation table conforming to Yamaha XG / GM2 specifications.",
  inputSchema: z.object({
    packName: z.string().describe("Name of the expansion pack"),
    category: z
      .string()
      .default("General")
      .describe("Voice category e.g. Khmer Traditional, Piano, Strings, Brass, Synth, Percussion"),
    voiceCount: z.number().min(1).max(128).default(8).describe("Number of voices to allocate"),
  }),
  execute: async ({ packName, category, voiceCount }) => {
    // Yamaha Expansion Pack conventions:
    // MSB 063 (Normal Expansion Voices) or MSB 062 (Drum Kits)
    // LSB represents Pack index (001 - 127)
    const isDrums = category.toLowerCase().includes("drum") || category.toLowerCase().includes("percussion");
    const msb = isDrums ? 62 : 63;
    const lsb = Math.min(127, Math.max(1, Math.floor(Math.random() * 30) + 1));

    const mappingTable = [];
    for (let i = 0; i < voiceCount; i++) {
      mappingTable.push({
        slot: i + 1,
        programChange: i,
        msb,
        lsb,
        midiString: `CC#0=${msb}, CC#32=${lsb}, PC=${i}`,
        suggestedName: `${category} ${i + 1}`,
      });
    }

    return {
      packName,
      category,
      allocatedBank: {
        msb,
        lsb,
        standard: isDrums ? "Yamaha Expansion Drum Kit (MSB 062)" : "Yamaha Expansion Normal Voice (MSB 063)",
      },
      voicesMappedCount: voiceCount,
      sampleMappings: mappingTable.slice(0, 10),
      integrationNote: "Ensure MIDI Song or Registration Memory sends CC#0, CC#32, and PC sequentially before Note-On.",
    };
  },
});

// Tool 5: Diagnose Conversion and DRM Pitfalls
export const diagnoseConversionIssueTool = tool({
  description:
    "Diagnose common Yamaha expansion file conversion errors, endianness byte swap faults, CRC32 header corruption, or encrypted CPI DRM locks.",
  inputSchema: z.object({
    sourceFormat: z.enum(["PPI", "PPF", "YEP", "CPI", "CPF"]),
    targetFormat: z.enum(["PPI", "PPF", "YEP", "WAV"]),
    symptom: z.string().describe("Observed error or symptom, e.g. 'Unknown Signature', 'Checksum Mismatch', 'Instrument rejects file'"),
  }),
  execute: async ({ sourceFormat, targetFormat, symptom }) => {
    const symptomLower = symptom.toLowerCase();

    let rootCause = "Generic file processing conflict.";
    let fix = "Re-check file integrity and try exporting as open PPF archive first.";

    if (sourceFormat === "CPI" || sourceFormat === "CPF" || symptomLower.includes("drm") || symptomLower.includes("encrypt")) {
      rootCause = "DRM Encryption Lock: CPI/CPF files use 128-bit AES encryption tied to the serial number / instrument ID of the original Yamaha keyboard.";
      fix = "Convert using an unencrypted PPI or project-source PPF file. Encrypted CPI containers cannot be down-converted to legacy YEP directly.";
    } else if (symptomLower.includes("signature") || symptomLower.includes("emhd")) {
      rootCause = "Container Header Corruption: The first 4 bytes must match 'PAC ' (for PPI/PPF) or 'YEP ' for legacy format.";
      fix = "Use the File & Hex Inspector to examine bytes 0x00-0x04. If padded with extra metadata, strip preceding bytes to align EMHD chunk at offset 0x00.";
    } else if (symptomLower.includes("endian") || symptomLower.includes("buzz") || symptomLower.includes("static")) {
      rootCause = "Endianness Byte-Swap Mismatch: Yamaha SWP tone generators utilize Big-Endian PCM audio while x86/ARM devices parse Little-Endian integers.";
      fix = "Enable 16-bit word byte-swapping (swap odd and even bytes in the WAVE PCM payload) before generating the YEP sample block.";
    } else if (symptomLower.includes("checksum") || symptomLower.includes("crc")) {
      rootCause = "EMHD / INFO Chunk CRC32 mismatch after manual editing.";
      fix = "The Yamaha expansion generator recalculates CRC32 automatically upon rebuilding the PPF XML manifest and packing.";
    }

    return {
      sourceFormat,
      targetFormat,
      symptom,
      rootCause,
      remediationPlan: fix,
      preventionRule: "Always maintain an uncompiled PPF (Yamaha Project Package) archive as the source of truth.",
    };
  },
});

/**
 * Yamaha AI Agent Factory
 */
export function createYamahaAgent({
  apiKey,
  packContext,
}: {
  apiKey?: string;
  packContext?: any;
}) {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error(
      "GEMINI_API_KEY_REQUIRED: Please configure GEMINI_API_KEY in your environment or enter it in the AI Assistant settings."
    );
  }

  const google = createGoogleGenerativeAI({ apiKey: key });

  const contextStr = packContext
    ? `Active Expansion Pack Under Analysis:
- Name: ${packContext.packName || "Unknown"}
- Format: ${packContext.formatVersion || "v2.0"} (${packContext.signature || "PAC "})
- Target Hardware: ${packContext.targetHardware || "Yamaha Genos / PSR-SX900"}
- Voices: ${packContext.voicesCount || 0}
- Accompaniment Styles: ${packContext.stylesCount || 0}
- Wave Samples: ${packContext.waveCount || 0}
- DRM Protected: ${packContext.isProtected ? "YES (Encrypted CPI/CPF)" : "NO (Open Unprotected PPI/PPF)"}
- Chunks: ${(packContext.chunks || []).map((c: any) => c.type).join(", ") || "EMHD, INFO, VOIC, STYL, WAVE"}`
    : "No pack currently loaded in memory. Ready for general Yamaha Expansion sound engineering advice.";

  return new ToolLoopAgent({
    model: google("gemini-2.5-flash"),
    instructions: `You are the Yamaha Expansion Voice & AWM2 Sound Engineering AI Agent.
You specialize in Yamaha Expansion Pack architecture: PPI, PPF, CPI, and legacy YEP formats (Genos, Tyros 5, PSR-SX900/SX700, PSR-S975/S970, PSR-S950/S750).

YOUR CAPABILITIES & TOOLS:
1. inspectPpiStructure: Analyze chunk tables, DRM status, and container validity.
2. calculateAwm2Filter: Compute filter cutoff in Hz, Q resonance boost, and AEG envelope generator curves (Attack, Decay, Sustain, Release) for Yamaha SWP tone generators.
3. checkLegacyYepCompatibility: Check down-conversion constraints for 64MB flash ROM limits on PSR-S950/S750 keyboards.
4. generateMidiMapping: Create expansion bank MSB (063/062), LSB, and Program Change mapping tables.
5. diagnoseConversionIssue: Identify root causes of conversion failures, endianness byte-swapping faults, and DRM locks.

CRITICAL RULES:
- STRICTLY NO UNICODE EMOJIS! Never use emojis (such as smiley faces, robots, musical notes, sparkles, checkmarks, etc.) anywhere in your output. Use clean technical Markdown typography, bold headings, code blocks, and bullet points.
- Provide answers in both Khmer and English where requested, defaulting to Khmer if the user interacts in Khmer.
- When technical sound parameters or equations are discussed, be mathematically accurate with Hz frequencies, dB boosts, and millisecond envelope times.
- Proactively call your tools to calculate, verify, and diagnose Yamaha package data whenever appropriate.

CURRENT CONTEXT:
${contextStr}`,
    tools: {
      inspectPpiStructure: inspectPpiStructureTool,
      calculateAwm2Filter: calculateAwm2FilterTool,
      checkLegacyYepCompatibility: checkLegacyYepCompatibilityTool,
      generateMidiMapping: generateMidiMappingTool,
      diagnoseConversionIssue: diagnoseConversionIssueTool,
    },
    stopWhen: isStepCount(12),
  });
}
