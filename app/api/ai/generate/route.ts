import { NextResponse } from "next/server";

const AI_BASE_URL =
  process.env.AI_BASE_URL || "http://localhost:11434/v1";

const AI_MODEL =
  process.env.AI_MODEL || "qwen2.5-coder:7b";

const workflowInstructions: Record<string, string> = {
  "AI Studio":
    "Create the requested content directly. Follow the user's instructions.",

  "Generate Ideas":
    "Generate 10 strong, original content ideas. Make each idea specific, useful, and interesting. Number them clearly.",

  "Write Content":
    "Write a complete, polished content draft based on the user's topic. Make it useful, clear, engaging, and ready to edit.",

  "Generate Hook":
    "Generate 10 attention-grabbing opening hooks for the user's topic. Keep them concise and varied.",

  "Generate Title":
    "Generate 10 clickable, specific titles for the user's topic. Avoid generic titles.",

  "Repurpose":
    "Repurpose the provided content for the requested platform. Preserve the core message while adapting the format, tone, length, and style.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = String(body.prompt || "").trim();
    const tool = String(body.tool || "AI Studio");
    const platform = String(body.platform || "General");

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const instruction =
      workflowInstructions[tool] ||
      workflowInstructions["AI Studio"];

    const systemPrompt = `
You are the AI writing engine inside ContentOS.

Workflow:
${tool}

Target platform:
${platform}

Instructions:
${instruction}

Important:
- Answer directly.
- Do not talk about your reasoning.
- Do not mention that you are an AI.
- Do not ask for clarification unless absolutely necessary.
- Return only the requested content.
`.trim();

    const response = await fetch(
      `${AI_BASE_URL}/chat/completions`,
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
              content: systemPrompt,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: `AI provider error: ${errorText}`,
        },
        { status: 502 },
      );
    }

    const data = await response.json();

    const result =
      data?.choices?.[0]?.message?.content?.trim() || "";

    if (!result) {
      return NextResponse.json(
        { error: "The AI returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      result,
      model: AI_MODEL,
      tool,
      platform,
    });
  } catch (error) {
    console.error("AI generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI generation failed.",
      },
      { status: 500 },
    );
  }
}
