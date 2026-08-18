import { ComfyUIWorkflow } from "../comfyui";

export function createVideoWorkflow(params: {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  frames?: number;
  fps?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  checkpoint?: string;
}): ComfyUIWorkflow {
  const {
    prompt,
    negativePrompt = "",
    width = 832,
    height = 480,
    frames = 41,
    fps = 16,
    steps = 12,
    cfg = 6,
    seed = Math.floor(Math.random() * 2147483647),
    checkpoint = "wan2.1_t2v_1.3B_fp16.safetensors",
  } = params;

  return {
    "1": {
      class_type: "UNETLoader",
      inputs: {
        unet_name: checkpoint,
        weight_dtype: "default",
      },
    },

    "2": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
        type: "wan",
      },
    },

    "3": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: prompt,
        clip: ["2", 0],
      },
    },

    "4": {
      class_type: "CLIPTextEncode",
      inputs: {
        text:
          negativePrompt ||
          "worst quality, low quality, blurry, distorted, bad anatomy, bad motion, deformed, flickering, jitter, artifacts, watermark, text",
        clip: ["2", 0],
      },
    },

    "5": {
      class_type: "VAELoader",
      inputs: {
        vae_name: "Wan2.1_VAE.pth",
      },
    },

    "6": {
      class_type: "WanImageToVideo",
      inputs: {
        positive: ["3", 0],
        negative: ["4", 0],
        vae: ["5", 0],
        width,
        height,
        length: frames,
        batch_size: 1,
      },
    },

    "7": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        seed,
        steps,
        cfg,
        sampler_name: "euler",
        scheduler: "normal",
        positive: ["6", 0],
        negative: ["6", 1],
        latent_image: ["6", 2],
        denoise: 1,
      },
    },

    "8": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["7", 0],
        vae: ["5", 0],
      },
    },

    "9": {
      class_type: "CreateVideo",
      inputs: {
        images: ["8", 0],
        fps,
      },
    },

    "10": {
      class_type: "SaveVideo",
      inputs: {
        video: ["9", 0],
        filename_prefix: "octa-studio-ai-video",
        format: "mp4",
        codec: "h264",
      },
    },
  };
}
