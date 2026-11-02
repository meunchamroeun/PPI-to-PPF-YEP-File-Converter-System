import { NextRequest, NextResponse } from "next/server";
import { createAgentUIStreamResponse, UIMessage } from "ai";
import { createYamahaAgent } from "@/lib/ai/yamaha-agent";

// Set maximum duration for Vercel Serverless Function execution
export const maxDuration = 60;

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/agent
 * ==============================================================================
 * Vercel AI SDK Tool-Calling Agent for Yamaha Expansion Pack & Sound Engineering
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey: clientApiKey, packMetadata } = body;

    const apiKey =
      clientApiKey ||
      req.headers.get("x-gemini-key") ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API_KEY_REQUIRED",
          message:
            "Gemini API Key is required. Please provide your Gemini API key in the AI Assistant settings or configure GEMINI_API_KEY in your environment variables.",
        },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error: "MESSAGES_REQUIRED",
          message: "Request must include an array of chat messages.",
        },
        { status: 400 }
      );
    }

    // Initialize the Yamaha Sound Engineering ToolLoopAgent
    const agent = createYamahaAgent({
      apiKey,
      packContext: packMetadata,
    });

    // Stream agent execution including tool calls and text generation
    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages as UIMessage[],
    });
  } catch (error: any) {
    console.error("[Yamaha Agent Error]:", error);
    return NextResponse.json(
      {
        error: "AGENT_EXECUTION_FAILED",
        message: error?.message || "Failed to process agent request.",
      },
      { status: 500 }
    );
  }
}
