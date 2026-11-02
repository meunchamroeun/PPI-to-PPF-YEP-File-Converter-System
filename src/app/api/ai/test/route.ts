import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/ai/test
 * ==============================================================================
 * Validates a Gemini API Key in real-time
 */
export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    const keyToTest = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToTest || !keyToTest.trim()) {
      return NextResponse.json(
        { valid: false, error: "No API key provided to test" },
        { status: 400 }
      );
    }

    // Initialize client and run a minimal ping
    const ai = new GoogleGenAI({ apiKey: keyToTest.trim() });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Ping. Reply with exactly the single word: OK",
    });

    const reply = response.text ? response.text.trim() : "";

    return NextResponse.json({
      valid: true,
      message: "Gemini API key is active and verified!",
      model: "gemini-2.5-flash",
      reply,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error.message || "Failed to validate API key with Google AI Studio",
      },
      { status: 400 }
    );
  }
}
