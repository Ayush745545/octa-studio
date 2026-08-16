import { NextRequest, NextResponse } from "next/server";
import { ComfyUIClient } from "@/lib/ai/comfyui";
import { createImageWorkflow } from "@/lib/ai/workflows/image";
import { generateFallbackImage } from "@/lib/ai/fallback";
import fs from "fs";
import path from "path";

const client = new ComfyUIClient({
  url: process.env.COMFYUI_URL,
  timeout: 600000,
  pollInterval: 2000,
});

// Load template from file
function loadTemplate(templateName: string): any {
  try {
    const templatePath = path.join(process.cwd(), "public", "ai-templates", `${templateName}.json`);
    if (fs.existsSync(templatePath)) {
      const fileContent = fs.readFileSync(templatePath, "utf8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error loading template:", error);
  }
  return null;
}

// Enhance prompt with template guidance
function enhancePromptWithTemplate(prompt: string, template: any): string {
  if (!template) return prompt;
  
  let enhancedPrompt = prompt;
  
  // Apply reference image instruction
  if (template.reference_image) {
    enhancedPrompt = `${template.reference_image} ${enhancedPrompt}`;
  }
  
  // Add subject details
  if (template.subject) {
    const subject = template.subject;
    enhancedPrompt += `, ${subject.gender}, ${subject.age_appearance}, ${subject.build}`;
    enhancedPrompt += `, ${subject.pose}, ${subject.expression}, ${subject.gaze}`;
  }
  
  // Add face and hair details
  if (template.face_and_hair) {
    const faceAndHair = template.face_and_hair;
    if (faceAndHair.face) enhancedPrompt += `, ${faceAndHair.face}`;
    if (faceAndHair.skin) enhancedPrompt += `, ${faceAndHair.skin}`;
    if (faceAndHair.hair) enhancedPrompt += `, ${faceAndHair.hair}`;
    if (faceAndHair.makeup) enhancedPrompt += `, ${faceAndHair.makeup}`;
  }
  
  // Add accessories
  if (template.accessories) {
    const accessories = template.accessories;
    if (accessories.earrings) enhancedPrompt += `, ${accessories.earrings}`;
    if (accessories.other_accessories && accessories.other_accessories !== "none") {
      enhancedPrompt += `, ${accessories.other_accessories}`;
    }
  }
  
  // Add clothing details
  if (template.clothing) {
    const clothing = template.clothing;
    if (clothing.top) {
      const top = clothing.top;
      enhancedPrompt += `, ${top.type}, ${top.color}, ${top.collar}, ${top.sleeves}, ${top.fit}`;
      if (top.graphics && top.graphics !== "completely blank front, no text, no logo, no artwork, no design") {
        enhancedPrompt += `, ${top.graphics}`;
      }
    }
    if (clothing.bottom) {
      const bottom = clothing.bottom;
      enhancedPrompt += `, ${bottom.type}, ${bottom.color}, ${bottom.fit}, ${bottom.details}`;
    }
  }
  
  // Add environment
  if (template.environment) {
    const env = template.environment;
    enhancedPrompt += `, ${env.location}, ${env.background}, ${env.floor}`;
    if (env.background_details) enhancedPrompt += `, ${env.background_details}`;
  }
  
  // Add camera details
  if (template.camera) {
    const camera = template.camera;
    enhancedPrompt += `, ${camera.shot_type}, ${camera.orientation}, ${camera.aspect_ratio}`;
    enhancedPrompt += `, ${camera.framing}, ${camera.camera_height}, ${camera.angle}`;
    enhancedPrompt += `, ${camera.lens}, ${camera.focus}, ${camera.depth_of_field}, ${camera.composition}`;
  }
  
  // Add lighting
  if (template.lighting) {
    const lighting = template.lighting;
    enhancedPrompt += `, ${lighting.style}, ${lighting.key_light}, ${lighting.fill_light}`;
    enhancedPrompt += `, ${lighting.rim_light}, ${lighting.shadows}, ${lighting.contrast}, ${lighting.mood}`;
  }
  
  // Add color grading
  if (template.color_grading) {
    const colorGrading = template.color_grading;
    enhancedPrompt += `, ${colorGrading.style}, ${colorGrading.tones}`;
    enhancedPrompt += `, ${colorGrading.contrast}, ${colorGrading.saturation}`;
    enhancedPrompt += `, ${colorGrading.highlights}, ${colorGrading.shadows}`;
  }
  
  // Add image quality
  if (template.image_quality) {
    const imageQuality = template.image_quality;
    enhancedPrompt += `, ${imageQuality.style}, ${imageQuality.resolution}`;
    if (imageQuality.details && Array.isArray(imageQuality.details)) {
      enhancedPrompt += `, ${imageQuality.details.join(", ")}`;
    }
    if (imageQuality.retouching) enhancedPrompt += `, ${imageQuality.retouching}`;
  }
  
  // Add negative prompts if provided separately (handled in workflow creation)
  return enhancedPrompt;
}

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

    /*
     * Prefer the local ComfyUI engine; when it is offline (or a
     * generation fails) fall back to the cloud image service so
     * generation always works.
     */
    const isHealthy = await client.checkHealth();

    if (isHealthy) {
      try {
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

        if (filename) {
          const uploadDir = process.env.AI_UPLOAD_DIR ?? "public/uploads";
          const localPath = await client.downloadFile(filename, uploadDir);
          const urlPath = localPath.startsWith("public/")
            ? `/${localPath.slice("public/".length)}`
            : localPath;

          return NextResponse.json({
            success: true,
            type: "image",
            engine: "comfyui",
            url: urlPath,
            filename,
            prompt,
          });
        }

        console.warn("[AI image] ComfyUI returned no output; using fallback.");
      } catch (comfyError) {
        console.warn("[AI image] ComfyUI failed; using fallback:", comfyError);
      }
    }

    const fallback = await generateFallbackImage({ prompt, width, height });

    return NextResponse.json({
      success: true,
      type: "image",
      engine: fallback.engine,
      url: fallback.url,
      filename: fallback.filename,
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
