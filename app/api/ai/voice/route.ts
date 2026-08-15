import { NextRequest, NextResponse } from "next/server";
import { generateVoiceover, isVoice } from "@/lib/ai/voice";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const requestedVoice = typeof body.voice === "string" ? body.voice.trim() : "";

    if (!text) {
      return NextResponse.json(
        { success: false, error: "A script is required." },
        { status: 400 },
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Keep the script under 2000 characters." },
        { status: 400 },
      );
    }

    const result = await generateVoiceover({
      text,
      voice: isVoice(requestedVoice) ? requestedVoice : undefined,
    });

    return NextResponse.json({
      success: true,
      type: "voice",
      engine: result.engine,
      url: result.url,
      filename: result.filename,
      prompt: text,
    });
  } catch (error) {
    console.error("Voice generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Voice generation failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
