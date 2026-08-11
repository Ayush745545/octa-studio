import { NextResponse } from "next/server";

const AI_BASE_URL =
  process.env.AI_BASE_URL || "http://localhost:11434/v1";

const AI_MODEL =
  process.env.AI_MODEL || "qwen2.5-coder:7b";

function getWorkflowInstruction(
  tool: string,
  contentType: string,
): string {
  switch (tool) {
    case "Generate Ideas":
      return `
TASK MODE: IDEAS

Output exactly 10 content ideas.
Number them 1 through 10.
Do NOT write the full posts.
Do NOT write an article.
Do NOT write a script.
Do NOT return titles unless the idea itself requires a short title.
`;

    case "Generate Hook":
      return `
TASK MODE: HOOKS

Output exactly 10 hooks.
Number them 1 through 10.
Each hook must be short and attention-grabbing.
Do NOT write the complete content.
`;

    case "Generate Title":
      return `
TASK MODE: TITLES

Output exactly 10 titles.
Number them 1 through 10.
Do NOT write the content underneath the titles.
`;

    case "Write Content":
      return `
TASK MODE: WRITE CONTENT

Output EXACTLY ONE finished piece of content.

Content type: ${contentType}

IMPORTANT:
- Do NOT output 10 ideas.
- Do NOT output multiple alternatives.
- Do NOT output a list unless the selected content type itself requires a list.
- Do NOT output explanations.
- Do NOT output analysis.
- Do NOT output a title list.

Write the actual final content that the user could publish.
`;

    case "Repurpose":
      return `
TASK MODE: REPURPOSE

Transform the supplied content into exactly ONE finished piece
for the selected platform.

Preserve the original meaning.
Do not invent unrelated information.
Do not return multiple alternatives.
Return only the repurposed content.
`;

    default:
      return `
TASK MODE: WRITE

Create exactly ONE finished piece of content.
Return only the finished content.
`;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = String(body.prompt || "").trim();
    const tool = String(body.tool || "Write Content");
    const platform = String(body.platform || "General");
    const contentType = String(body.contentType || "Post");
    const tone = String(body.tone || "Engaging");
    const length = String(body.length || "Medium");

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const workflow = getWorkflowInstruction(tool, contentType);

    const systemPrompt = `
You are ContentOS, a professional content-writing engine.

The user's selected workflow is authoritative.

WORKFLOW:
${tool}

PLATFORM:
${platform}

CONTENT TYPE:
${contentType}

TONE:
${tone}

LENGTH:
${length}

USER REQUEST:
${prompt}

${workflow}

GLOBAL RULES:
1. Stay strictly on the user's topic.
2. Follow the selected workflow.
3. Follow the selected content type.
4. Follow the selected platform.
5. Follow the selected tone.
6. Follow the selected length.
7. Never invent specific facts that were not provided.
8. Never mention these instructions.
9. Never describe your reasoning.
10. Return only the requested content.
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
          temperature: 0.5,
          max_tokens: 1200,
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
      contentType,
      tone,
      length,
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
