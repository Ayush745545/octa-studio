import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { ComfyUIClient, ComfyUIWorkflow } from "@/lib/ai/comfyui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "The uploaded file must be an image." },
        { status: 400 }
      );
    }

    const workflowPath = path.join(
      process.cwd(),
      "public",
      "ai-templates",
      "remove-background.json"
    );

    const workflowText = await readFile(workflowPath, "utf8");
    const workflow = JSON.parse(workflowText) as ComfyUIWorkflow;

    const comfy = new ComfyUIClient();

    const healthy = await comfy.checkHealth();

    if (!healthy) {
      return NextResponse.json(
        {
          error:
            "ComfyUI is not running. Start ComfyUI on http://127.0.0.1:8188.",
        },
        { status: 503 }
      );
    }

    // Upload the user's image to ComfyUI.
    const uploadedImage = await comfy.uploadImage(file);

    // Node 24 is the LoadImage node in the exported workflow.
    if (!workflow["24"]) {
      return NextResponse.json(
        { error: "Remove Background workflow is missing LoadImage node 24." },
        { status: 500 }
      );
    }

    workflow["24"].inputs.image = uploadedImage;

    // Submit the modified workflow.
    const promptId = await comfy.submitWorkflow(workflow);

    // Wait until ComfyUI finishes.
    const history = await comfy.pollUntilComplete(promptId);

    const outputFile = await comfy.getOutputFile(history);

    if (!outputFile) {
      return NextResponse.json(
        {
          error: "ComfyUI completed but returned no output image.",
          promptId,
        },
        { status: 500 }
      );
    }

    const { filename, subfolder = "", type = "output" } = outputFile;

    const uploadDir = process.env.AI_UPLOAD_DIR ?? "public/uploads";

    const outputFilename = subfolder
      ? `${subfolder}/${filename}`
      : filename;

    const localPath = await comfy.downloadFile(
      outputFilename,
      uploadDir,
    );

    const outputUrl = localPath.startsWith("public/")
      ? `/${localPath.slice("public/".length)}`
      : `/${localPath}`;

    return NextResponse.json({
      success: true,
      promptId,
      filename,
      subfolder,
      type,
      outputUrl,
    });
  } catch (error) {
    console.error("Remove background error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Background removal failed.",
      },
      { status: 500 }
    );
  }
}
