"use client";

import { useTransition } from "react";
import { togglePublishingChannel } from "@/app/publishing/actions/toggle-channel";

const channels = [
  {
    name: "Instagram",
    short: "IG",
    description: "Publish posts and reels.",
  },
  {
    name: "YouTube",
    short: "YT",
    description: "Publish videos and shorts.",
  },
  {
    name: "LinkedIn",
    short: "in",
    description: "Publish professional content.",
  },
  {
    name: "X",
    short: "X",
    description: "Publish posts and threads.",
  },
];

interface PublishingChannelsProps {
  connectedPlatforms: string[];
}

export default function PublishingChannels({
  connectedPlatforms,
}: PublishingChannelsProps) {
  const [isPending, startTransition] = useTransition();

  function toggleChannel(platform: string) {
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
            Your connected social accounts will appear here.
          </p>
        </div>

        <span className="text-xs text-zinc-400">
          {connectedPlatforms.length} connected
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {channels.map((channel) => {
          const isConnected = connectedPlatforms.includes(channel.name);

          return (
            <div
              key={channel.name}
              className={`rounded-2xl border bg-white p-4 transition ${
                isConnected
                  ? "border-zinc-950"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold ${
                      isConnected
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 text-zinc-700"
                    }`}
                  >
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

                <span
                  className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                    isConnected
                      ? "bg-emerald-500"
                      : "bg-zinc-300"
                  }`}
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span
                  className={`text-xs ${
                    isConnected
                      ? "font-medium text-emerald-600"
                      : "text-zinc-400"
                  }`}
                >
                  {isConnected ? "Connected" : "Not connected"}
                </span>

                {channel.name === "LinkedIn" || channel.name === "Instagram" ? (
                  !isConnected ? (
                    <a
                      href={`/api/publishing/${channel.name.toLowerCase()}/connect`}
                      className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800"
                    >
                      Connect
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => toggleChannel(channel.name)}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-red-200 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleChannel(channel.name)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-wait disabled:opacity-50 ${
                      isConnected
                        ? "border border-zinc-200 bg-white text-zinc-600 hover:border-red-200 hover:text-red-600"
                        : "bg-zinc-950 text-white hover:bg-zinc-800"
                    }`}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
