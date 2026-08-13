"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSmoothScroll } from "@/lib/animations/smooth-scroll";
import { prefersReducedMotion } from "@/lib/animations/scroll";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Plan every post visually",
    description:
      "Week and month calendar views with drag-and-drop scheduling. See your entire content pipeline at a glance across every channel.",
    image: "📅",
    tag: "Calendar",
    visual: "calendar",
  },
  {
    title: "Write with AI, not around it",
    description:
      "Contextual AI assistant inside the composer. Generate hooks, drafts, and repurposed content without leaving the editor.",
    image: "✨",
    tag: "AI Studio",
    visual: "ai",
  },
  {
    title: "Publish to every channel",
    description:
      "Connect LinkedIn, X, Instagram, YouTube, and more. Schedule once, publish everywhere from one queue.",
    image: "📤",
    tag: "Publishing",
    visual: "publishing",
  },
  {
    title: "Know what works",
    description:
      "Track publishing rate, platform mix, and activity trends. Make decisions from real workspace data.",
    image: "📊",
    tag: "Analytics",
    visual: "analytics",
  },
];

function CalendarVisual() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <div className="h-2 w-2 rounded-full bg-zinc-700" />
        <div className="h-2 w-2 rounded-full bg-zinc-700" />
        <div className="h-2 w-2 rounded-full bg-zinc-700" />
        <div className="ml-4 h-2 w-32 rounded bg-zinc-800" />
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <div key={i} className="py-1 text-center text-[10px] text-zinc-500">
            <div className="mx-auto mb-1 h-5 w-5 rounded-full bg-zinc-800/60 text-[10px] leading-5 text-zinc-400">
              {12 + i}
            </div>
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {[...Array(14).keys()].map((i) => (
          <button
            key={i}
            onClick={() => setOpen(true)}
            className={`h-10 rounded-lg border p-1 text-left transition hover:border-zinc-600 ${
              i === 3
                ? "border-fuchsia-500/40 bg-fuchsia-500/10"
                : "border-zinc-800 bg-zinc-900/60"
            }`}
          >
            <div className="h-1 w-full rounded bg-zinc-800" />
            <div className="mt-1 h-1 w-2/3 rounded bg-zinc-800" />
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0a0a0c] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Create Post</p>
              <button onClick={() => setOpen(false)} className="text-xs text-zinc-400">Close</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-600 text-xs font-bold text-white">1</div>
                <div>
                  <p className="text-xs font-medium text-white">Post</p>
                  <p className="text-[11px] text-zinc-400">Draft your content</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-600 text-xs font-bold text-white">2</div>
                <div>
                  <p className="text-xs font-medium text-white">Ready</p>
                  <p className="text-[11px] text-zinc-400">Review and polish</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-600 text-xs font-bold text-white">3</div>
                <div>
                  <p className="text-xs font-medium text-white">Help Automate</p>
                  <p className="text-[11px] text-zinc-400">Schedule and publish</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AIVisual() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-fuchsia-600 text-[10px] font-bold text-white">AI</div>
          <span className="text-xs font-medium text-zinc-300">Assistant</span>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="rounded-lg bg-zinc-900/60 p-2.5">
          <p className="text-xs text-zinc-400">Write a LinkedIn post about building ContentOS.</p>
        </div>
        <div className="ml-8 rounded-lg bg-fuchsia-600/10 p-2.5">
          <p className="text-xs leading-5 text-zinc-300">
            We built ContentOS because social content teams deserve one workspace instead of five disconnected tools...
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-[10px] font-medium text-white">Use this</button>
        <button className="rounded-lg border border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-300">Regenerate</button>
      </div>
    </div>
  );
}

function PublishingVisual() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
      <div className="border-b border-zinc-800 pb-3">
        <p className="text-xs font-medium text-zinc-300">Publishing queue</p>
      </div>
      <div className="mt-3 space-y-2">
        {["LinkedIn", "Instagram", "X", "YouTube"].map((platform) => (
          <div
            key={platform}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5"
          >
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-zinc-800" />
              <span className="text-xs text-zinc-300">{platform}</span>
            </div>
            <span className="text-[10px] text-emerald-400">Connected</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
      <div className="border-b border-zinc-800 pb-3">
        <p className="text-xs font-medium text-zinc-300">Performance overview</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Reach", value: "12.4K" },
          { label: "Engagement", value: "8.2%" },
          { label: "Posts", value: "24" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
            <p className="text-[10px] text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-16 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
        <div className="flex h-full items-end gap-1">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-fuchsia-600/60"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ visual }: { visual: string }) {
  switch (visual) {
    case "calendar":
      return <CalendarVisual />;
    case "ai":
      return <AIVisual />;
    case "publishing":
      return <PublishingVisual />;
    case "analytics":
      return <AnalyticsVisual />;
    default:
      return null;
  }
}

export default function LandingPage() {
  useSmoothScroll();
  const productRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const publishingRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      gsap.set(".landing-nav, .landing-eyebrow, .landing-headline, .landing-subhead, .landing-ctas, .landing-product, .landing-section, .landing-feature-card, .landing-visual", {
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".landing-nav",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
      )
      .fromTo(
        ".landing-eyebrow",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        "-=0.4",
      )
      .fromTo(
        ".landing-headline",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9 },
        "-=0.5",
      )
      .fromTo(
        ".landing-subhead",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        "-=0.6",
      )
      .fromTo(
        ".landing-ctas",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.5",
      )
      .fromTo(
        ".landing-product",
        { y: 60, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 1.1 },
        "-=0.7",
      );

      gsap.utils.toArray<Element>(".landing-section").forEach((section) => {
        gsap.fromTo(
          section,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      if (productRef.current) {
        ScrollTrigger.create({
          trigger: productRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            const y = self.progress * 40;
            gsap.to(productRef.current as gsap.TweenTarget, { y, ease: "none", overwrite: "auto" });
          },
        });
      }

      gsap.utils.toArray<Element>(".landing-feature-card").forEach((card) => {
        gsap.fromTo(
          card,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      gsap.utils.toArray<Element>(".landing-visual").forEach((visual) => {
        gsap.fromTo(
          visual,
          { y: 40, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: visual,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      if (calendarRef.current) {
        ScrollTrigger.create({
          trigger: calendarRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.fromTo(".calendar-grid", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
            gsap.fromTo(".calendar-card", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: "back.out(1.7)", delay: 0.3 });
          },
          once: true,
        });
      }

      if (aiRef.current) {
        ScrollTrigger.create({
          trigger: aiRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.fromTo(".ai-prompt", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", delay: 0.2 });
            gsap.fromTo(".ai-result", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", delay: 0.5 });
            gsap.fromTo(".ai-actions", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.8 });
          },
          once: true,
        });
      }

      if (publishingRef.current) {
        ScrollTrigger.create({
          trigger: publishingRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.fromTo(".pub-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" });
          },
          once: true,
        });
      }

      if (analyticsRef.current) {
        ScrollTrigger.create({
          trigger: analyticsRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.fromTo(".analytics-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" });
            gsap.fromTo(".analytics-bar", { scaleY: 0 }, { scaleY: 1, duration: 1, stagger: 0.03, ease: "power3.out", delay: 0.3, transformOrigin: "bottom" });
          },
          once: true,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-200">
      {/* Navigation */}
      <nav className="landing-nav fixed top-0 z-50 w-full border-b border-zinc-800 bg-[#0a0a0c]/80 opacity-0 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-lg shadow-purple-500/20">
              <Image src="/images/logo.png" alt="ContentOS" width={32} height={32} className="object-cover" />
            </span>
            <span className="text-base font-semibold tracking-tight text-white">ContentOS</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-zinc-400 transition hover:text-white">Features</a>
            <a href="#calendar" className="text-sm text-zinc-400 transition hover:text-white">Calendar</a>
            <a href="#ai" className="text-sm text-zinc-400 transition hover:text-white">AI</a>
            <a href="#publishing" className="text-sm text-zinc-400 transition hover:text-white">Publishing</a>
            <a href="#analytics" className="text-sm text-zinc-400 transition hover:text-white">Analytics</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/calendar"
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Open App
            </Link>
            <Link
              href="/calendar"
              className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="landing-eyebrow mx-auto inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium text-zinc-400 opacity-0">
            Content Operating System
          </div>
          <h1 className="landing-headline mx-auto mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl opacity-0">
            Plan, create, and publish
            <span className="block text-fuchsia-400">from one workspace</span>
          </h1>
          <p className="landing-subhead mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg opacity-0">
            ContentOS brings your calendar, AI composer, publishing queue, and analytics into a single dark command center built for modern social teams.
          </p>
          <div className="landing-ctas mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row opacity-0">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-500"
            >
              Open calendar
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Side Image with Fade */}
        <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none hidden lg:block">
          <img
            src="/images/hompage.png"
            alt="ContentOS workspace"
            className="h-full w-full object-cover opacity-80 rounded-l-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-transparent z-10" />
        </div>

        <div ref={productRef} className="landing-product relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8 opacity-0">
            <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-4">
              <div className="grid grid-cols-[80px_1fr] gap-4 sm:grid-cols-[100px_1fr]">
                <div className="hidden flex-col gap-2 sm:flex">
                  <div className="h-8 w-full rounded-lg bg-zinc-800" />
                  <div className="h-8 w-full rounded-lg bg-zinc-800" />
                  <div className="h-8 w-full rounded-lg bg-zinc-800" />
                  <div className="h-8 w-full rounded-lg bg-fuchsia-600/20" />
                </div>
                <div className="space-y-3">
                  <div className="h-10 rounded-lg border border-zinc-800 bg-zinc-900/60" />
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="h-32 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
                        <div className="h-2 w-8 rounded bg-zinc-800" />
                        <div className="mt-2 space-y-1">
                          <div className="h-8 rounded-md border border-zinc-700 bg-zinc-800/60 p-1.5">
                            <div className="h-1.5 w-full rounded bg-zinc-700" />
                            <div className="mt-1 h-1.5 w-2/3 rounded bg-zinc-700" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pinned Feature Scroller */}
      <section id="features" className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-sm font-medium text-zinc-500">Features</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Everything you need to move from idea to published.
            </h2>
          </div>

          <div className="space-y-32">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="grid items-center gap-10 lg:grid-cols-2"
              >
                <div className={`landing-feature-card ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <span className="text-xs font-medium text-fuchsia-400">{feature.tag}</span>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{feature.description}</p>
                </div>
                <div className={`landing-visual ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <FeatureVisual visual={feature.visual} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar Showcase */}
      <section ref={calendarRef} id="calendar" className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-medium text-fuchsia-400">Calendar Showcase</span>
            <h3 className="mt-2 text-2xl font-semibold text-white">Plan your content</h3>
            <p className="mt-2 text-sm text-zinc-400">See everything you&apos;re publishing, before it goes live.</p>
          </div>
          <div className="calendar-grid opacity-0 overflow-x-auto rounded-2xl border border-zinc-800 bg-[#0a0a0c] p-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <div className="h-2 w-2 rounded-full bg-zinc-700" />
              <div className="h-2 w-2 rounded-full bg-zinc-700" />
              <div className="h-2 w-2 rounded-full bg-zinc-700" />
              <div className="ml-4 h-2 w-32 rounded bg-zinc-800" />
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <div key={i} className="py-1 text-center text-[10px] text-zinc-500">
                  <div className="mx-auto mb-1 h-5 w-5 rounded-full bg-zinc-800/60 text-[10px] leading-5 text-zinc-400">
                    {12 + i}
                  </div>
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
        {[...Array(14).keys()].map((i) => (
                <div
                  key={i}
                  className={`calendar-card h-10 rounded-lg border p-1 ${
                    i === 3 || i === 7
                      ? "border-fuchsia-500/40 bg-fuchsia-500/10"
                      : "border-zinc-800 bg-zinc-900/60"
                  }`}
                >
                  <div className="h-1 w-full rounded bg-zinc-800" />
                  <div className="mt-1 h-1 w-2/3 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Showcase */}
      <section ref={aiRef} id="ai" className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-medium text-fuchsia-400">AI Creative</span>
            <h3 className="mt-2 text-2xl font-semibold text-white">Create more than words</h3>
            <p className="mt-2 text-sm text-zinc-400">Turn an idea into complete social content with AI-generated copy, images and video.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="ai-prompt opacity-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Text</p>
              <p className="mt-2 text-sm text-zinc-300">Write a LinkedIn post about building ContentOS.</p>
              <button className="mt-4 rounded-lg bg-fuchsia-600 px-4 py-2 text-xs font-medium text-white">Generate</button>
            </div>
            <div className="ai-result opacity-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Image</p>
              <p className="mt-2 text-sm text-zinc-300">Cinematic workspace with futuristic content dashboard, premium SaaS aesthetic...</p>
              <button className="mt-4 rounded-lg bg-fuchsia-600 px-4 py-2 text-xs font-medium text-white">Generate</button>
            </div>
            <div className="ai-actions opacity-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Video</p>
              <p className="mt-2 text-sm text-zinc-300">Cinematic product launch for a new AI content platform...</p>
              <button className="mt-4 rounded-lg bg-fuchsia-600 px-4 py-2 text-xs font-medium text-white">Generate</button>
            </div>
          </div>
        </div>
      </section>

      {/* Publishing Showcase */}
      <section ref={publishingRef} id="publishing" className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-medium text-fuchsia-400">Publishing Showcase</span>
            <h3 className="mt-2 text-2xl font-semibold text-white">Publish everywhere</h3>
            <p className="mt-2 text-sm text-zinc-400">One publishing workflow for every platform.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {["LinkedIn", "Instagram", "X", "YouTube"].map((platform) => (
              <div
                key={platform}
                className="pub-card rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 opacity-0"
              >
                <p className="text-sm font-medium text-white">{platform}</p>
                <p className="mt-1 text-xs text-zinc-500">Connected</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Showcase */}
      <section ref={analyticsRef} id="analytics" className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-medium text-fuchsia-400">Analytics Showcase</span>
            <h3 className="mt-2 text-2xl font-semibold text-white">Know what works</h3>
            <p className="mt-2 text-sm text-zinc-400">Track publishing rate, platform mix, and recent activity.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Publishing rate", value: "84%", dataValue: 84 },
              { label: "Platforms", value: "5", dataValue: 5 },
              { label: "Upcoming", value: "12", dataValue: 12 },
            ].map((stat) => (
              <div key={stat.label} className="analytics-card rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 opacity-0">
                <p className="text-xs text-zinc-500">{stat.label}</p>
                <p className="analytics-number mt-2 text-2xl font-semibold text-white" data-value={stat.dataValue}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="analytics-bar mt-6 h-32 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 opacity-0">
            <p className="mb-3 text-xs font-medium text-zinc-400">Weekly publishing activity</p>
            <div className="flex h-20 items-end gap-1">
              {[35, 55, 40, 70, 50, 85, 65, 90, 45, 75, 60, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-fuchsia-600/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to run your content from one workspace?
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            Open ContentOS and start scheduling in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-500"
            >
              Open ContentOS
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md overflow-hidden">
              <Image src="/images/logo.png" alt="ContentOS" width={28} height={28} className="object-cover" />
            </span>
            <span className="text-sm font-semibold text-white">ContentOS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/calendar" className="text-xs text-zinc-500 hover:text-white transition">Open Calendar</Link>
            <p className="text-xs text-zinc-600">© {new Date().getFullYear()} ContentOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
