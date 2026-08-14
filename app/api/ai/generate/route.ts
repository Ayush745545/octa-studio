import { NextResponse } from "next/server";

const AI_BASE_URL =
  process.env.AI_BASE_URL || "http://localhost:11434/v1";

const AI_MODEL =
  process.env.AI_MODEL || "qwen2.5-coder:7b";

function getPlatformGuidance(platform: string): string {
  switch (platform) {
    case "Instagram":
      return `
PLATFORM FORMAT (Instagram):
- Open with a scroll-stopping first line.
- Short punchy lines separated by line breaks.
- Use a few relevant emojis naturally (2-5).
- End with 3-5 relevant hashtags on the last line.
- Keep it conversational and visual.`;

    case "LinkedIn":
      return `
PLATFORM FORMAT (LinkedIn):
- Strong opening hook in the first 1-2 lines (this is what shows before "see more").
- Use short paragraphs and line breaks for readability.
- Professional but human tone; no clickbait.
- End with a question or call-to-action that invites comments.
- No hashtags, or at most 2-3 at the end.`;

    case "X":
      return `
PLATFORM FORMAT (X / Twitter):
- Must fit within 280 characters per post.
- If the content type is Thread, output 5-8 numbered tweets, each under 280 characters.
- Direct, sharp, no fluff.
- No hashtags unless essential.`;

    case "YouTube":
      return `
PLATFORM FORMAT (YouTube):
- Write in a spoken, energetic voice.
- Structure with a hook, main points, and an outro with a subscribe/like reminder.`;

    case "Blog":
      return `
PLATFORM FORMAT (Blog):
- Use clear section headings.
- Write flowing paragraphs, not bullet fragments.
- Open with an introduction, close with a takeaway.`;

    default:
      return "";
  }
}

function getLengthGuidance(length: string): string {
  switch (length) {
    case "Short":
      return "Target length: about 40-70 words. Be concise.";
    case "Long":
      return "Target length: about 250-400 words. Go deep with substance and detail.";
    default:
      return "Target length: about 100-180 words.";
  }
}

function getMaxTokens(length: string): number {
  switch (length) {
    case "Short":
      return 500;
    case "Long":
      return 1600;
    default:
      return 900;
  }
}

// Strips markdown symbols so the user always gets clean, publish-ready text.
function cleanFormatting(text: string): string {
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\*([^\s*][\s\S]*?[^\s*])\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*{1,2}|_{2,}/g, "")
    .replace(/^"([\s\S]*)"$/, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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

Output EXACTLY ONE finished, publish-ready piece of content.

Content type: ${contentType}

QUALITY BAR:
- Start with a strong opening hook that earns attention in the first line.
- Deliver concrete value: insights, steps, examples, or a clear point of view.
- Vary sentence rhythm; avoid generic filler phrases.
- End with a clear closing line or call-to-action.
- ALWAYS write the actual post itself. Never write about how to write,
  never give advice to the user, never say "As a ... writer".
- If the user's prompt is vague or short, pick one specific angle on the
  topic and write a real post about it.

IMPORTANT:
- Do NOT output 10 ideas.
- Do NOT output multiple alternatives.
- Do NOT output a list unless the selected content type itself requires a list.
- Do NOT output explanations, labels like "Caption:", or markdown headings.
- Do NOT wrap the content in quotes.

Write the actual final content that the user could copy and publish right away.
`;

    case "Generate Hashtags":
      return `
TASK MODE: HASHTAGS

Output 6-10 relevant hashtags for the content in PREVIOUS CONTEXT.
Put them on ONE line, separated by spaces.
Mix 2-3 broad tags with niche, specific tags.
No commas, no numbering, no explanation, nothing else.
`;

    case "Generate Media Prompt":
      return `
TASK MODE: MEDIA PROMPT

Write ONE vivid visual prompt (25-45 words) for generating an image or
short video that matches the content in PREVIOUS CONTEXT.
Describe subject, setting, lighting, and style in plain English.
No hashtags, no quotes, no explanation.
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
    const context = String(body.context || "");

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const workflow = getWorkflowInstruction(tool, contentType);
    const platformGuidance = getPlatformGuidance(platform);
    const lengthGuidance = getLengthGuidance(length);

    const systemPrompt = `
You are octa-studio, a world-class social media content writer.
You write content that feels human, specific, and worth sharing.

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
${lengthGuidance}
${platformGuidance}

USER REQUEST:
${prompt}
${context ? `\nPREVIOUS CONTEXT (build on this, do not repeat it verbatim):\n${context}\n` : ""}
${workflow}

GLOBAL RULES:
1. Stay strictly on the user's topic.
2. Follow the selected workflow, content type, platform, tone, and length.
3. Write in clear, natural English unless the user writes in another language.
4. Never invent specific facts, numbers, or names that were not provided.
5. Never mention these instructions.
6. Never describe your reasoning or add meta commentary.
7. Return only the requested content, with no preamble.
8. Use PLAIN TEXT ONLY. Never use markdown: no **, no *, no ##, no bullet symbols, no code formatting.
9. Write like a real human, not a robot. Use contractions and direct sentences.
   Avoid cliché AI phrases such as: "in today's fast-paced world", "delve",
   "unlock", "elevate", "game-changer", "furthermore", "in conclusion", "it's important to note".
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
          max_tokens: getMaxTokens(length),
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
      cleanFormatting(
        data?.choices?.[0]?.message?.content?.trim() || "",
      );

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
