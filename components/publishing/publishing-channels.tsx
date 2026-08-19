"use client";

import { useState } from "react";

type Channel = {
  name: string;
  description: string;
  color: string;
  icon: string;
  oauthPath?: string;
};

const CHANNELS: Channel[] = [
  {
    name: "Instagram",
    description: "Publish photos, reels and captions",
    color: "#E4405F",
    icon: "ig",
    oauthPath: "/api/publishing/instagram/connect",
  },
  {
    name: "LinkedIn",
    description: "Publish professional content",
    color: "#0A66C2",
    icon: "in",
    oauthPath: "/api/publishing/linkedin/connect",
  },
  {
    name: "YouTube",
    description: "Publish videos and Shorts",
    color: "#FF0000",
    icon: "▶",
  },
  {
    name: "TikTok",
    description: "Publish short-form videos",
    color: "#ffffff",
    icon: "♪",
  },
];

interface PublishingChannelsProps {
  connectedPlatforms: string[];
}

export default function PublishingChannels({
  connectedPlatforms,
}: PublishingChannelsProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  function connect(platform: Channel) {
    if (!platform.oauthPath || connecting) return;

    setConnecting(platform.name);

    window.location.assign(platform.oauthPath);
  }

  return (
    <section id="channels">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-white">
            Publishing channels
          </h2>

          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            {connectedPlatforms.length} connected
          </span>
        </div>

        <p className="text-sm text-zinc-500">
          Connect your social accounts to publish directly from ContentOS.
        </p>
      </div>

      {/* Channel list */}
      <div className="space-y-3">
        {CHANNELS.map((platform) => {
          const connected = connectedPlatforms.includes(platform.name);
          const isConnecting = connecting === platform.name;
          const available = Boolean(platform.oauthPath);

          return (
            <div
              key={platform.name}
              className={[
                "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                connected
                  ? "border-emerald-500/20 bg-emerald-500/[0.025]"
                  : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700",
              ].join(" ")}
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                {/* Left */}
                <div className="flex min-w-0 items-center gap-4">
                  {/* Icon */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold"
                    style={{
                      backgroundColor: `${platform.color}12`,
                      borderColor: `${platform.color}30`,
                      color: platform.color,
                    }}
                  >
                    {platform.icon}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {platform.name}
                      </h3>

                      {connected && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Connected
                        </span>
                      )}

                      {!connected && available && (
                        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-500">
                          Not connected
                        </span>
                      )}

                      {!available && (
                        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-500">
                          Coming soon
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      {platform.description}
                    </p>

                    {connected && (
                      <p className="mt-2 text-[11px] text-emerald-400/70">
                        Ready to publish automatically
                      </p>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="flex shrink-0 items-center gap-2">
                  {connected ? (
                    <>
                      {available && (
                        <button
                          type="button"
                          onClick={() => connect(platform)}
                          disabled={Boolean(connecting)}
                          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-wait disabled:opacity-50"
                        >
                          {isConnecting ? "Opening…" : "Reconnect"}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-xs font-medium text-emerald-400"
                      >
                        Connected
                      </button>
                    </>
                  ) : available ? (
                    <button
                      type="button"
                      onClick={() => connect(platform)}
                      disabled={Boolean(connecting)}
                      className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isConnecting ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-black" />
                          Connecting…
                        </>
                      ) : (
                        `Connect ${platform.name}`
                      )}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-xs font-medium text-zinc-600">
                      Coming soon
                    </div>
                  )}
                </div>
              </div>

              {/* Connected accent */}
              {connected && (
                <div className="absolute bottom-0 left-0 top-0 w-px bg-emerald-400/60" />
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/40 px-4 py-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-400">
          ?
        </div>

        <p className="text-[11px] leading-5 text-zinc-500">
          Connecting an account gives ContentOS permission to publish on your
          behalf. You can disconnect your account at any time.
        </p>
      </div>
    </section>
  );
}
