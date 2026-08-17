import { NextRequest, NextResponse } from "next/server";
import { ComfyUIClient } from "@/lib/ai/comfyui";
import { createVideoWorkflow } from "@/lib/ai/workflows/video";
import { generateFallbackVideo } from "@/lib/ai/fallback";

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
    const width = Number(body.width) || 832;
    const height = Number(body.height) || 480;
    const frames = Number(body.frames) || 41;
    const fps = Number(body.fps) || 16;
    const steps = Number(body.steps) || 12;
    const cfg = Number(body.cfg) || 6;

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

    if (frames <= 0 || frames > 100) {
      return NextResponse.json(
        { success: false, error: "Frames must be between 1 and 100." },
        { status: 400 },
      );
    }

    /*
     * Prefer the local ComfyUI video engine; when it is offline (or a
     * generation fails) fall back to keyframe + ffmpeg assembly so
     * video generation always works.
     */
    const isHealthy = await client.checkHealth();

    if (isHealthy) {
      try {
        const workflow = createVideoWorkflow({
          prompt,
          negativePrompt,
          width,
          height,
          frames,
          fps,
          steps,
          cfg,
        });

        const promptId = await client.submitWorkflow(workflow);
        const entry = await client.pollUntilComplete(promptId);
        const output = await client.getOutputFile(entry);

        if (output) {
          const filename = output.subfolder
            ? `${output.subfolder}/${output.filename}`
            : output.filename;

          const uploadDir = process.env.AI_UPLOAD_DIR ?? "public/uploads";
          const localPath = await client.downloadFile(filename, uploadDir);
          const urlPath = localPath.startsWith("public/")
            ? `/${localPath.slice("public/".length)}`
            : localPath;

          return NextResponse.json({
            success: true,
            type: "video",
            engine: "comfyui",
            url: urlPath,
            filename: output.filename,
            prompt,
          });
        }

        console.warn("[AI video] ComfyUI returned no output; using fallback.");
      } catch (comfyError) {
        console.warn("[AI video] ComfyUI failed; using fallback:", comfyError);
      }
    }

    const fallback = await generateFallbackVideo({ prompt, width, height, fps });

    return NextResponse.json({
      success: true,
      type: "video",
      engine: fallback.engine,
      url: fallback.url,
      filename: fallback.filename,
      prompt,
    });
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Video generation failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
