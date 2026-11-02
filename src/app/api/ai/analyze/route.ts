import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/ai/analyze
 * ==============================================================================
 * Analyzes Yamaha Expansion Pack metadata and binary structures using Gemini AI
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packMetadata, userPrompt, apiKey: clientApiKey } = body;

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API_KEY_REQUIRED",
          message:
            "Gemini API Key is required. Please provide your Gemini API key in the AI Assistant settings or configure GEMINI_API_KEY in your environment.",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const packContext = packMetadata
      ? `
Pack Name: ${packMetadata.packName || "Unknown"}
Target Hardware: ${packMetadata.targetHardware || "Yamaha PSR-SX / Genos"}
Format Version: ${packMetadata.formatVersion || "v2.0"}
Signature: ${packMetadata.signature || "PAC "}
Voices Count: ${packMetadata.voicesCount || 0}
Styles Count: ${packMetadata.stylesCount || 0}
Wave Samples Count: ${packMetadata.waveCount || 0}
DRM Protection: ${packMetadata.isProtected ? "Protected CPI" : "Open Unprotected"}
Detected Chunks: ${(packMetadata.chunks || []).map((c: any) => c.type).join(", ") || "EMHD, INFO, VOIC, STYL, WAVE"}
`
      : "No specific pack selected. General Yamaha Expansion Voice advice requested.";

    const defaultPrompt = `Please perform a comprehensive technical and sound design analysis of this Yamaha expansion package:
1. Executive Technical Summary: Analyze the balance between voice count, sample memory, and style chunks.
2. AWM2 Tone Generator & Voice Parameter Recommendations: Suggest optimal filter cutoff, resonance, AEG envelope (Attack, Decay, Sustain, Release), and LFO modulation parameters for these voices.
3. Legacy Down-Conversion Compatibility Assessment: Detail considerations when down-converting this pack from Genos/SX900 to legacy PSR-S950/S750 YEP formats (e.g. polyphony allocation, velocity layer limits, Super Articulation mapping).
4. Professional Release Notes & Catalog Description: Write engaging musician-focused documentation and MIDI Bank MSB/LSB recommendation.`;

    const finalPrompt = userPrompt && userPrompt.trim().length > 0 ? userPrompt : defaultPrompt;

    const fullPrompt = `Context regarding the Yamaha Expansion Pack under analysis:
${packContext}

User Query / Analysis Request:
${finalPrompt}

Remember: Format your output in clean Markdown with clear headings and bullet points. Do not use emojis in your response; use clean typography, clear technical terminology, and bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        systemInstruction:
          "You are the Lead Yamaha Expansion Voice Sound Designer and Tone Generator Architect at Yamaha Synthesizer & Arranger Systems. You specialize in Yamaha Expansion Manager (YEM), Pack Project Installer (PPI), Pack Project File (PPF), Yamaha Expansion Pack (YEP), AWM2 synthesis, Super Articulation voices, MegaVoice style integration, and SFF2 accompaniment styles. You deliver precise, actionable technical and creative advice for musicians and sound developers.",
      },
    });

    const analysisText = response.text || "No analysis generated.";

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      model: "gemini-3.5-flash",
    });
  } catch (error: any) {
    console.error("Gemini AI analysis error:", error);
    return NextResponse.json(
      {
        error: "AI_GENERATION_FAILED",
        message: error.message || "Failed to generate AI analysis using Gemini.",
      },
      { status: 500 }
    );
  }
}
