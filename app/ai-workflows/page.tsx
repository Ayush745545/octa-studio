'use client';

import React from 'react';
import Image from 'next/image';

const steps = [
  {
    step: 'STEP 1',
    title: 'Capture Ideas',
    description:
      'Brainstorm content topics and save them to your idea inbox. Tag by category and platform to build your content pipeline.',
    image: '/images/step1-ideas.jpg',
    tag: 'Ideas',
    color: 'fuchsia',
  },
  {
    step: 'STEP 2',
    title: 'Write with AI',
    description:
      'Generate hooks, drafts, and full posts with the AI Studio. Choose platform, tone, and content type — then refine.',
    image: '/images/step2-write.jpg',
    tag: 'AI Studio',
    color: 'emerald',
  },
  {
    step: 'STEP 3',
    title: 'Schedule & Publish',
    description:
      'Drag content onto the visual calendar. Connect your social profiles and publish to every channel from one queue.',
    image: '/images/step3-schedule.jpg',
    tag: 'Publishing',
    color: 'blue',
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  fuchsia: {
    bg: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
};

export default function AIWorkflowsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] bg-gradient-to-r from-blue-400 via-violet-400 to-green-400 bg-clip-text text-transparent mb-4">
            AI-Powered Workflows
          </p>
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-medium tracking-tight mb-6" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            From idea to published post
          </h1>
          <p className="text-[18px] leading-relaxed text-zinc-400 max-w-2xl mx-auto">
            See every stage of your content pipeline. Capture ideas, write with AI, and schedule & publish — all in one workspace.
          </p>
        </div>

        <div className="grid gap-16 lg:gap-24">
          {steps.map((item, index) => {
            const colors = colorClasses[item.color];
            return (
              <div
                key={item.title}
                className={`grid items-center gap-12 lg:grid-cols-2 ${
                  index % 2 === 1 ? 'lg:direction-rtl' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-6 ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {item.step}
                    </span>
                  </div>
                  <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold tracking-tight mb-4">
                    {item.title}
                  </h2>
                  <p className="text-[16px] leading-[1.8] text-zinc-400">
                    {item.description}
                  </p>
                </div>
                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl shadow-black/60">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={800}
                      height={500}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
            Ready to build your pipeline?
          </div>
        </div>
      </div>
    </div>
  );
}
