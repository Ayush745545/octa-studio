"use client";

import { useTransition } from "react";
import { togglePublishingChannel } from "@/app/publishing/actions/toggle-channel";

const channels = [
  {
    name: "Instagram",
    short: "IG",
    description: "Publish posts and reels.",
    connectable: true,
  },
  {
    name: "LinkedIn",
    short: "in",
    description: "Publish professional content.",
    connectable: true,
  },
  {
    name: "YouTube",
    short: "YT",
    description: "Publish videos and shorts.",
    connectable: false,
  },
  {
    name: "TikTok",
    short: "TT",
    description: "Publish videos and short-form content.",
    connectable: false,
  },
  {
    name: "X",
    short: "X",
    description: "Publish posts and threads.",
    connectable: false,
  },
];

interface PublishingChannelsProps {
  connectedPlatforms: string[];
}

export default function PublishingChannels({
  connectedPlatforms,
}: PublishingChannelsProps) {
  const [isPending, startTransition] = useTransition();

  const connectedChannels = channels.filter((channel) =>
    connectedPlatforms.includes(channel.name),
  );

  function connectChannel(platform: string) {
    if (platform === "Instagram") {
      window.location.href = "/api/publishing/instagram/connect";
      return;
    }

    startTransition(async () => {
      await togglePublishingChannel(platform);
    });
  }

  function disconnectChannel(platform: string) {
    startTransition(async () => {
      await togglePublishingChannel(platform);
    });
  }

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">
            Publishing channels
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            Connect your social accounts to publish directly.
          </p>
        </div>

        <span className="text-xs text-zinc-400">
          {connectedChannels.length} connected
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {channels.map((channel) => {
          const connected = connectedPlatforms.includes(channel.name);

          return (
            <div
              key={channel.name}
              className={`rounded-2xl border bg-white p-4 transition ${
                connected
                  ? "border-zinc-950"
                  : "border-zinc-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-950 bg-zinc-950 text-xs font-semibold text-white">
                    {channel.short}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-950">
                      {channel.name}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-400">
                      {channel.description}
                    </p>
                  </div>
                </div>

                {connected && (
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                {connected ? (
                  <>
                    <span className="text-xs font-medium text-emerald-600">
                      Connected
                    </span>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => disconnectChannel(channel.name)}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-red-200 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-zinc-400">
                      Not connected
                    </span>

                    <button
                      type="button"
                      disabled={isPending || !channel.connectable}
                      onClick={() => connectChannel(channel.name)}
                      className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Connect
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
