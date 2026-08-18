export interface ComfyUIClientOptions {
  url?: string;
  timeout?: number;
  pollInterval?: number;
}

export interface ComfyUIWorkflow {
  [nodeId: string]: {
    class_type: string;
    inputs: Record<string, unknown>;
  };
}

export interface ComfyUIResponse {
  prompt_id?: string;
  number?: number;
  node_errors?: Record<string, unknown>;
}

export interface ComfyUIHistory {
  [promptId: string]: {
    prompt?: unknown[];
    outputs?: Record<string, unknown>;
    status?: {
      status_str?: string;
      completed?: boolean;
      error?: boolean;
      messages?: unknown[];
    };
  };
}

export class ComfyUIClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly pollInterval: number;

  constructor(options: ComfyUIClientOptions = {}) {
    this.baseUrl = options.url ?? process.env.COMFYUI_URL ?? "http://127.0.0.1:8188";
    this.timeout = options.timeout ?? 600000;
    this.pollInterval = options.pollInterval ?? 2000;
  }

  async submitWorkflow(workflow: ComfyUIWorkflow): Promise<string> {
    const controller = new AbortController();

    // Never allow workflow submission to hang for the full generation timeout.
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const clientId =
        globalThis.crypto?.randomUUID?.() ??
        `octa-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          prompt: workflow,
          client_id: clientId,
        }),
        signal: controller.signal,
      });

      const text = await response.text();

      let data: ComfyUIResponse & {
        error?: string;
        node_errors?: Record<string, unknown>;
      };

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `ComfyUI returned invalid JSON (${response.status}): ${text.slice(0, 1000)}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          `ComfyUI rejected workflow (${response.status}): ${JSON.stringify(data)}`,
        );
      }

      if (data.error) {
        throw new Error(
          `ComfyUI workflow error: ${data.error} ${JSON.stringify(data.node_errors ?? {})}`,
        );
      }

      if (!data.prompt_id) {
        throw new Error(
          `ComfyUI did not return prompt_id: ${JSON.stringify(data)}`,
        );
      }

      console.log("[ComfyUI] Workflow queued:", data.prompt_id);

      return data.prompt_id;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `ComfyUI /prompt timed out after 15s. Check the ComfyUI terminal for validation errors.`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async pollUntilComplete(promptId: string): Promise<ComfyUIHistory[string]> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeout) {
      const response = await fetch(`${this.baseUrl}/history/${promptId}`);

      if (!response.ok) {
        throw new Error(`ComfyUI history request failed: ${response.status}`);
      }

      const history = (await response.json()) as ComfyUIHistory;
      const entry = history[promptId];

      if (!entry) {
        await this.sleep(this.pollInterval);
        continue;
      }

      const status = entry.status;
      if (status?.completed) {
        return entry;
      }

      if (status?.error) {
        throw new Error("ComfyUI generation failed.");
      }

      await this.sleep(this.pollInterval);
    }

    throw new Error("ComfyUI generation timed out.");
  }

  async getOutputFile(
    entry: ComfyUIHistory[string],
  ): Promise<{ filename: string; subfolder?: string; type?: string } | null> {
    const outputs = entry.outputs;
    if (!outputs) return null;

    // Video outputs from SaveVideo / CreateVideo.
    for (const nodeOutput of Object.values(outputs)) {
      const node = nodeOutput as {
        videos?: {
          filename: string;
          subfolder?: string;
          type?: string;
        }[];
      };

      if (!node.videos?.length) continue;

      const outputVideo = node.videos.find(
        (video) => video.type === "output",
      );

      if (outputVideo) {
        return outputVideo;
      }

      return node.videos[0];
    }

    // Image outputs for existing image-generation workflows.
    for (const nodeOutput of Object.values(outputs)) {
      const node = nodeOutput as {
        images?: {
          filename: string;
          subfolder?: string;
          type?: string;
        }[];
      };

      if (!node.images?.length) continue;

      const outputImage = node.images.find(
        (image) => image.type === "output",
      );

      if (outputImage) {
        return outputImage;
      }

      return node.images[0];
    }

    return null;
  }

  async getOutputFilename(
    entry: ComfyUIHistory[string],
  ): Promise<string | null> {
    const output = await this.getOutputFile(entry);

    if (!output) return null;

    return output.subfolder
      ? `${output.subfolder}/${output.filename}`
      : output.filename;
  }

  async getFileUrl(filename: string): Promise<string> {
    const parts = filename.split("/");
    const name = parts.pop() ?? filename;
    const subfolder = parts.join("/");

    const params = new URLSearchParams({
      filename: name,
      type: "output",
    });

    if (subfolder) {
      params.set("subfolder", subfolder);
    }

    return `${this.baseUrl}/view?${params.toString()}`;
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file, file.name);

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `ComfyUI image upload failed: ${response.status} ${text}`,
      );
    }

    const data = (await response.json()) as {
      name?: string;
      subfolder?: string;
      type?: string;
    };

    if (!data.name) {
      throw new Error("ComfyUI did not return an uploaded image name.");
    }

    return data.subfolder
      ? `${data.subfolder}/${data.name}`
      : data.name;
  }

  async downloadFile(
    filename: string,
    destinationDir: string,
  ): Promise<string> {
    const [subfolder, actualFilename] = filename.includes("/")
      ? [
          filename.slice(0, filename.lastIndexOf("/")),
          filename.slice(filename.lastIndexOf("/") + 1),
        ]
      : ["", filename];

    const params = new URLSearchParams({
      filename: actualFilename,
      type: "output",
    });

    if (subfolder) {
      params.set("subfolder", subfolder);
    }

    const fileUrl = `${this.baseUrl}/view?${params.toString()}`;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download generated file: ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${actualFilename}`;

    const destinationPath = `${destinationDir}/${uniqueName}`;

    const fs = await import("fs/promises");
    await fs.mkdir(destinationDir, { recursive: true });
    await fs.writeFile(destinationPath, buffer);

    return destinationPath;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
