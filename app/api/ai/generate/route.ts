import { NextResponse } from "next/server";

const AI_BASE_URL =
  process.env.AI_BASE_URL || "http://localhost:1234/v1";

const AI_MODEL =
  process.env.AI_MODEL || "prism-ml/bonsai-27b";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const response = await fetch(
      AI_BASE_URL + "/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are the AI writing assistant inside ContentOS. Create useful, clear, practical content and follow the user's request directly.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: "AI provider error: " + errorText,
        },
        { status: 502 },
      );
    }

    const data = await response.json();

    const result =
      data?.choices?.[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: "AI provider returned no content." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      result,
      model: AI_MODEL,
    });
  } catch (error) {
    console.error("AI generation error:", error);

    return NextResponse.json(
      {
        error: "Could not connect to the local AI provider.",
      },
      { status: 500 },
    );
  }
}
