import { NextRequest, NextResponse } from "next/server";
import { ComfyUIClient } from "@/lib/ai/comfyui";
import { createImageWorkflow } from "@/lib/ai/workflows/image";

const client = new ComfyUIClient({
  url: process.env.COMFYUI_URL,
  timeout: 600000,
  pollInterval: 2000,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const negativePrompt =
      typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";
    const width = Number(body.width) || 1024;
    const height = Number(body.height) || 1024;
    const steps = Number(body.steps) || 30;
    const cfg = Number(body.cfg) || 7;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required." },
        { status: 400 },
      );
    }

    if (width <= 0 || height <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid dimensions." },
        { status: 400 },
      );
    }

    const isHealthy = await client.checkHealth();
    if (!isHealthy) {
      return NextResponse.json(
        { success: false, error: "AI engine is offline. Start ComfyUI and try again." },
        { status: 503 },
      );
    }

    const workflow = createImageWorkflow({
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfg,
    });

    const promptId = await client.submitWorkflow(workflow);
    const entry = await client.pollUntilComplete(promptId);
    const filename = await client.getOutputFilename(entry);

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Generation failed. Please try again." },
        { status: 500 },
      );
    }

    const uploadDir = process.env.AI_UPLOAD_DIR ?? "public/uploads";
    const localPath = await client.downloadFile(filename, uploadDir);
    const urlPath = localPath.startsWith("public/")
      ? `/${localPath.slice("public/".length)}`
      : localPath;

    return NextResponse.json({
      success: true,
      type: "image",
      url: urlPath,
      filename,
      prompt,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Image generation failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
