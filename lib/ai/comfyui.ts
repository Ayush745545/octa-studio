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
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: workflow }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`ComfyUI rejected workflow: ${response.status} ${text}`);
      }

      const data = (await response.json()) as ComfyUIResponse;
      if (!data.prompt_id) {
        throw new Error("ComfyUI did not return a prompt_id.");
      }

      return data.prompt_id;
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

  async getOutputFilename(entry: ComfyUIHistory[string]): Promise<string | null> {
    const outputs = entry.outputs;
    if (!outputs) return null;

    for (const nodeOutput of Object.values(outputs)) {
      const node = nodeOutput as { images?: { filename: string }[] };
      if (node.images && node.images.length > 0) {
        return node.images[0].filename;
      }
    }

    return null;
  }

  async getFileUrl(filename: string): Promise<string> {
    return `${this.baseUrl}/view?filename=${encodeURIComponent(filename)}`;
  }

  async downloadFile(filename: string, destinationDir: string): Promise<string> {
    const fileUrl = `${this.baseUrl}/view?filename=${encodeURIComponent(filename)}`;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to download generated file: ${response.status}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;
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
