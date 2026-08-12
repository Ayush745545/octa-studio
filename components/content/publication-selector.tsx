"use client";

import { useState, useTransition } from "react";
import { createPublication } from "@/app/content/actions/create-publication";

interface Channel {
  id: string;
  platform: string;
}

interface Publication {
  channelId: string;
  status: string;
}

interface PublicationSelectorProps {
  contentId: string;
  channels: Channel[];
  publications: Publication[];
  disabled?: boolean;
}

function statusLabel(status: string) {
  switch (status) {
    case "QUEUED":
      return "Queued";
    case "PUBLISHING":
      return "Publishing";
    case "PUBLISHED":
      return "Published";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

export default function PublicationSelector({
  contentId,
  channels,
  publications,
  disabled = false,
}: PublicationSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function queuePublication(channelId: string) {
    setError("");

    startTransition(async () => {
      try {
        await createPublication(contentId, channelId);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to queue publication.",
        );
      }
    });
  }

  return (
    <section className="mt-6 border-t border-zinc-100 pt-6">
      <div>
        <p className="text-sm font-medium text-zinc-700">
          Publishing channels
        </p>

        <p className="mt-1 text-xs text-zinc-400">
          Choose where this content should be published.
        </p>
      </div>

      {channels.length === 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
          <p className="text-sm font-medium text-zinc-700">
            No connected channels
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Connect a publishing channel before adding this content to a
            publishing queue.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {channels.map((channel) => {
            const publication = publications.find(
              (item) => item.channelId === channel.id,
            );

            const queued = Boolean(publication);

            return (
              <div
                key={channel.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {channel.platform}
                  </p>

                  {publication && (
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {statusLabel(publication.status)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={disabled || queued || isPending}
                  onClick={() => queuePublication(channel.id)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {queued
                    ? statusLabel(publication!.status)
                    : isPending
                      ? "Saving..."
                      : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
