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
    frames = 49,
    fps = 16,
    steps = 20,
    cfg = 6,
    seed = Math.floor(Math.random() * 0xffffffff),
    checkpoint = "wan_2.1_t2v_1.3b.safetensors",
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
      class_type: "DualCLIPLoader",
      inputs: {
        text: prompt,
        clip_name1: "umt5_xxl_fp16.safetensors",
        clip_name2: "umt5_xxl_fp16.safetensors",
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
        text: negativePrompt || "worst quality, low quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
        clip: ["2", 0],
      },
    },
    "5": {
      class_type: "EmptyLatentVideo",
      inputs: {
        width,
        height,
        frames,
        batch_size: 1,
      },
    },
    "6": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 1,
        model: ["1", 0],
        positive: ["3", 0],
        negative: ["4", 0],
        latent_image: ["5", 0],
      },
    },
    "7": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["6", 0],
        vae: ["1", 1],
      },
    },
    "8": {
      class_type: "SaveVideo",
      inputs: {
        filename_prefix: "contentos-ai-video",
        format: "image/gif",
        fps,
        images: ["7", 0],
      },
    },
  };
}
