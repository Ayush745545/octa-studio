"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSmoothScroll } from "@/lib/animations/smooth-scroll";
import { prefersReducedMotion } from "@/lib/animations/scroll";

gsap.registerPlugin(ScrollTrigger);

function PhoneMockup({ imageSrc, alt }: { imageSrc: string; alt: string }) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto w-[300px]">
      <div className="rounded-[2rem] border-[3px] border-zinc-800 bg-black p-2.5 shadow-2xl shadow-black/80">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-zinc-900">
          <Image
            src={imageSrc}
            alt={alt}
            width={300}
            height={600}
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-6">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-300/80">Main Group</p>
              <p className="text-[10px] text-zinc-400/90 mt-0.5">Today, {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-zinc-300/90">{currentTime}</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm px-2.5 py-2">
              <p className="text-[10px] text-zinc-400 text-center">Your post preview will appear here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    title: "Capture ideas fast",
    description:
      "Jot down raw ideas, tag them by category and platform, and turn them into a full content pipeline in seconds.",
    image: "/ai/idea.png",
    tag: "Ideas",
    visual: "idea",
  },
  {
    title: "Plan every post visually",
    description:
      "Week and month calendar views with drag-and-drop scheduling. See your entire content pipeline at a glance across every channel.",
    image: "/ai/calendar.png",
    tag: "Calendar",
    visual: "calendar",
  },
  {
    title: "Write with AI, not around it",
    description:
      "Contextual AI assistant inside the composer. Generate hooks, drafts, and repurposed content without leaving the editor.",
    image: "/ai/scanner.png",
    tag: "AI Studio",
    visual: "ai",
  },
  {
    title: "Manage all content",
    description:
      "Edit, status-track, and organize every post in one place. Keep drafts, scheduled, and published content aligned.",
    image: "/ai/content.png",
    tag: "Content",
    visual: "content",
  },
  {
    title: "Publish to every channel",
    description:
      "Connect LinkedIn, X, Instagram, YouTube, and more. Schedule once, publish everywhere from one queue.",
    image: "/ai/new-release.png",
    tag: "Publishing",
    visual: "publishing",
  },
  {
    title: "Know what works",
    description:
      "Track publishing rate, platform mix, and activity trends. Make decisions from real workspace data.",
    image: "/ai/analytics.png",
    tag: "Analytics",
    visual: "analytics",
  },
];

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
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-200 relative">
      <div className="fixed inset-0 z-0">
        <Image src="/images/bg.png" alt="" fill className="object-cover opacity-20" priority />
      </div>
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="landing-nav fixed top-0 z-50 w-full border-b border-zinc-800 bg-[#0a0a0c]/80 opacity-0 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-lg shadow-[#7FFB50]/20">
              <Image src="/images/logo.png" alt="octa-studio" width={32} height={32} className="object-cover" />
            </span>
            <span className="text-base font-semibold tracking-tight text-white">octa-studio</span>
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
              className="rounded-xl bg-[#7FFB50] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7FFB50]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <Image src="/images/bg.png" alt="" fill className="object-cover opacity-30" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#7FFB50]/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="landing-eyebrow mx-auto inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium text-zinc-400">
            Content Operating System
          </div>
          <h1 className="landing-headline mx-auto mt-8 max-w-4xl text-4xl sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            <span className="block text-zinc-100 font-medium tracking-tight">Plan, create, and publish</span>
            <span className="block bg-gradient-to-r from-blue-400 via-[#7FFB50] to-green-400 bg-clip-text text-transparent font-medium tracking-tight">from one workspace</span>
          </h1>
          <p className="landing-subhead mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            octa-studio brings your calendar, AI composer, publishing queue, and analytics into a single dark command center built for modern social teams.
          </p>
          <div className="landing-ctas mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/calendar"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7FFB50] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#7FFB50]"
              >
                Open calendar
                <span>→</span>
              </Link>
          </div>
        </div>

        {/* Side Image with Fade */}
        <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none hidden lg:block">
          <img
            src="/images/how.png"
            alt="octa-studio workspace"
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
                  <div className="h-8 w-full rounded-lg bg-[#7FFB50]/20" />
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
      </section>

      {/* AI Studio / OLED Creative Workspace */}
      <section className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#7FFB50]">AI Studio</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-white">
                Your OLED Creative Workspace.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-zinc-400">
                Write text, build pipelines, generate images, and create videos in dark mode. Configure the platform, tone, and content type, and watch the AI build a ready-to-publish post.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Real-time post preview",
                  "Text, Image & Video generation",
                  "Context-aware models",
                  "Brand tone enforcement",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7FFB50]/10 text-[#7FFB50]">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mx-auto w-[300px]"><div className="rounded-[2rem] border-[3px] border-zinc-800 bg-black p-2.5 shadow-2xl shadow-black/80"><div className="relative overflow-hidden rounded-[1.75rem] bg-zinc-900"><Image src="/images/how.png" alt="octa-studio post" width={300} height={600} className="w-full h-auto object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" /><div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-6"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-lg shadow-[#7FFB50]/20"><Image src="/images/logo.png" alt="octa-studio" width={32} height={32} className="object-cover" /></span><span className="text-[15px] font-semibold tracking-tight text-white">Today,</span></div></div></div></div></div>
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
                  <span className="text-xs font-medium text-[#7FFB50]">{feature.tag}</span>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{feature.description}</p>
                </div>
                <div className={`landing-visual ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={800}
                      height={500}
                      className="w-full h-auto object-cover"
                    />
                  </div>
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
            <span className="text-xs font-medium text-[#7FFB50]">Calendar Showcase</span>
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
                      ? "border-[#7FFB50]/40 bg-[#7FFB50]/10"
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
            <span className="text-xs font-medium text-[#7FFB50]">AI Creative</span>
            <h3 className="mt-2 text-2xl font-semibold text-white">Create more than words</h3>
            <p className="mt-2 text-sm text-zinc-400">Turn an idea into complete social content with AI-generated copy, images and video.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="ai-prompt opacity-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Text</p>
              <p className="mt-2 text-sm text-zinc-300">Write a LinkedIn post about building octa-studio.</p>
              <button className="mt-4 rounded-lg bg-[#7FFB50] px-4 py-2 text-xs font-medium text-white">Generate</button>
            </div>
            <div className="ai-result opacity-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Image</p>
              <p className="mt-2 text-sm text-zinc-300">Cinematic workspace with futuristic content dashboard, premium SaaS aesthetic...</p>
              <button className="mt-4 rounded-lg bg-[#7FFB50] px-4 py-2 text-xs font-medium text-white">Generate</button>
            </div>
            <div className="ai-actions opacity-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Video</p>
              <p className="mt-2 text-sm text-zinc-300">Cinematic product launch for a new AI content platform...</p>
              <button className="mt-4 rounded-lg bg-[#7FFB50] px-4 py-2 text-xs font-medium text-white">Generate</button>
            </div>
          </div>
        </div>
      </section>

      {/* Publishing Showcase */}
      <section ref={publishingRef} id="publishing" className="landing-section border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-medium text-[#7FFB50]">Publishing Showcase</span>
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
            <span className="text-xs font-medium text-[#7FFB50]">Analytics Showcase</span>
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
                  className="flex-1 rounded-sm bg-[#7FFB50]/60"
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
            Open octa-studio and start scheduling in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7FFB50] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#7FFB50]"
            >
              Open octa-studio
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
              <Image src="/images/logo.png" alt="octa-studio" width={28} height={28} className="object-cover" />
            </span>
            <span className="text-sm font-semibold text-white">octa-studio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/calendar" className="text-xs text-zinc-500 hover:text-white transition">Open Calendar</Link>
            <p className="text-xs text-zinc-600">© {new Date().getFullYear()} octa-studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
