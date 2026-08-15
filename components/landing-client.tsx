"use client";

import React, { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { useSmoothScroll } from "@/lib/animations/smooth-scroll";
import { prefersReducedMotion } from "@/lib/animations/scroll";
import DockText from "@/components/registry/eldoraui/dock-text";
import MotionFillableButton from "@/components/registry/paceui/motion-fillable-button";

/* ─── Animated Components ─── */

/* Post Status Cards — shows how posts look in different pipeline states */
function PostStatusCards() {
  const statuses = [
    { label: 'DRAFT', color: 'bg-zinc-800', icon: '/ai/content.png', title: '5 Tools Every Dev Needs', platform: 'LinkedIn', time: 'Edited 2m ago' },
    { label: 'READY', color: 'bg-[#1D54F9]', icon: '/ai/scanner.png', title: 'Why Dark Mode Wins', platform: 'X (Twitter)', time: 'Approved today' },
    { label: 'SCHEDULED', color: 'bg-[#D304EB]', icon: '/ai/calendar.png', title: 'AI in Content Creation', platform: 'Instagram', time: 'Aug 15, 10:00 AM' },
    { label: 'PUBLISHED', color: 'bg-[#009E60]', icon: '/ai/new-release.png', title: 'The Future of SaaS', platform: 'YouTube', time: 'Published Aug 12' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statuses.map(s => (
        <div key={s.label} className="group relative overflow-hidden rounded-xl border border-zinc-700 bg-[#0a0a0c] p-5 transition hover:border-zinc-500">
          <div className="flex items-center justify-between mb-4">
            <span className={`${s.color} rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white`}>{s.label}</span>
            <Image src={s.icon} alt={s.label} width={20} height={20} />
          </div>
          <h4 className="text-[14px] font-semibold text-white leading-tight">{s.title}</h4>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
            <span>{s.platform}</span>
            <span>&bull;</span>
            <span>{s.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Bulk Schedule Visual — shows batch scheduling capability */
function BulkScheduleVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked readOnly className="h-4 w-4 accent-fuchsia-500 rounded" />
          <span className="text-[12px] font-semibold text-white">4 posts selected</span>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300">Reschedule All</button>
          <button className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-[11px] font-medium text-white">Bulk Publish</button>
        </div>
      </div>
      {/* Post Rows */}
      {[
        { title: '5 AI Tools for Devs', platform: 'LinkedIn', date: 'Aug 14, 9:00 AM', status: 'Scheduled' },
        { title: 'Dark Mode Best Practices', platform: 'X', date: 'Aug 14, 12:00 PM', status: 'Ready' },
        { title: 'Content Pipeline Guide', platform: 'Instagram', date: 'Aug 15, 10:00 AM', status: 'Scheduled' },
        { title: 'SaaS Growth Playbook', platform: 'YouTube', date: 'Aug 16, 2:00 PM', status: 'Draft' },
      ].map((post, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-zinc-900 px-5 py-3.5 transition hover:bg-zinc-900/30">
          <input type="checkbox" checked readOnly className="h-4 w-4 accent-fuchsia-500 rounded" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{post.title}</p>
            <p className="text-[11px] text-zinc-600">{post.platform} · {post.date}</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            post.status === 'Scheduled' ? 'bg-fuchsia-600/20 text-fuchsia-400' :
            post.status === 'Ready' ? 'bg-blue-600/20 text-blue-400' :
            'bg-zinc-800 text-zinc-500'
          }`}>{post.status}</span>
        </div>
      ))}
    </div>
  );
}

/* Post Preview Card — realistic social media post preview */
function PostPreviewCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] shadow-2xl max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
          <Image src="/images/logo.png" alt="octa-studio" width={40} height={40} className="object-cover" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white">octa-studio</p>
          <p className="text-[11px] text-zinc-500">@octa-studio · 2h ago</p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-blue-600/20 px-2.5 py-0.5">
          <span className="text-[10px] font-bold text-blue-400">LinkedIn</span>
        </div>
      </div>
      {/* Post Body */}
      <div className="px-5 pb-4">
        <p className="text-[13px] leading-relaxed text-zinc-300">🚀 AI is reshaping content creation. Here are 5 tools every developer should try in 2026…</p>
        <p className="mt-2 text-[12px] text-fuchsia-400">#AI #DevTools #SaaS #FutureOfWork</p>
      </div>
      {/* Image */}
      <div className="aspect-[16/9] bg-zinc-900">
        <img
          src="/images/group-friends-chilling-with-smartphones-outside_1257223-92182.avif"
          alt="Friends chilling with smartphones outside"
          className="h-full w-full object-cover"
        />
      </div>
      {/* Engagement Row */}
      <div className="flex items-center gap-6 border-t border-zinc-800 px-5 py-3">
        <span className="flex items-center gap-1.5 text-[12px] text-zinc-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          248
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-zinc-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          42
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-zinc-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          18
        </span>
      </div>
    </div>
  );
}

function ScrollTextReveal({ text, className }: { text: string; className?: string }) {
  const textRef = useRef<HTMLHeadingElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const words = text.split(" ");

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const ctx = gsap.context(() => {
      gsap.to(wordsRef.current, {
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 80%",
          end: "bottom 40%",
          scrub: true,
        },
        color: "#ffffff",
        stagger: 0.1,
      });
    }, textRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <h2 ref={textRef} className={`font-bold leading-[1.1] tracking-[-0.02em] text-center ${className || ''}`}>
      {words.map((word, i) => (
        <span 
          key={i} 
          ref={el => { if (el) wordsRef.current[i] = el; }}
          className="text-zinc-500 transition-colors duration-150 inline-block mr-[0.3em]"
        >
          {word}
        </span>
      ))}
    </h2>
  );
}

function ScrollTextRevealSection() {
  return (
    <section className="py-32 lg:py-48 px-6 max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
      <ScrollTextReveal 
        text="Your entire content pipeline. Unified in one beautiful workspace. Stop switching tabs and start shipping." 
        className="text-[clamp(2.5rem,5vw,4.5rem)]"
      />
    </section>
  );
}


function GsapCalendarShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);
  const text4Ref = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const macbookRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const days = ['Mon 11', 'Tue 12', 'Wed 13', 'Thu 14', 'Fri 15', 'Sat 16', 'Sun 17'];
  const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM'];

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Initial hidden states
      gsap.set([text2Ref.current, text3Ref.current, text4Ref.current], { opacity: 0, y: 30 });
      gsap.set(calendarRef.current, { opacity: 0, y: 40 });
      gsap.set(postRef.current, { opacity: 0, scale: 0.8, y: -40 });
      gsap.set(phoneRef.current, { opacity: 0, x: 80, scale: 0.9 });
      gsap.set(macbookRef.current, { opacity: 0, y: 60, scale: 0.95 });
      gsap.set([step1Ref.current, step2Ref.current, step3Ref.current], { opacity: 0.3 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 10%',
          end: '+=2800',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        }
      });

      // ── Phase 1: Calendar appears, post schedules ──
      tl.to(calendarRef.current, { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out' })
        .to(step1Ref.current, { opacity: 1, duration: 0.5 }, '<0.2')
        .to(progressRef.current, { width: '33%', duration: 2 }, '<')
        .to(text1Ref.current, { opacity: 0, y: -20, duration: 1 }, '+=0.5')
        .to(text2Ref.current, { opacity: 1, y: 0, duration: 1 }, '<0.3')
        .to(postRef.current, { opacity: 1, scale: 1, y: 0, duration: 1.5, ease: 'back.out(1.4)' }, '<')

      // ── Phase 2: Post reschedules to new date ──
        .to(step1Ref.current, { opacity: 0.3, duration: 0.3 }, '+=1')
        .to(step2Ref.current, { opacity: 1, duration: 0.5 }, '<')
        .to(progressRef.current, { width: '66%', duration: 2 }, '<')
        .to(text2Ref.current, { opacity: 0, y: -20, duration: 1 }, '+=0.5')
        .to(text3Ref.current, { opacity: 1, y: 0, duration: 1 }, '<0.3')
        .to(postRef.current, { x: '200%', y: 76, duration: 2, ease: 'power2.inOut' }, '<')
        .to(postRef.current, { scale: 1.08, duration: 0.4, yoyo: true, repeat: 1 }, '-=0.8')

      // ── Phase 3: Phone + MacBook mockups slide in ──
        .to(step2Ref.current, { opacity: 0.3, duration: 0.3 }, '+=1')
        .to(step3Ref.current, { opacity: 1, duration: 0.5 }, '<')
        .to(progressRef.current, { width: '100%', duration: 2 }, '<')
        .to(text3Ref.current, { opacity: 0, y: -20, duration: 1 }, '+=0.5')
        .to(text4Ref.current, { opacity: 1, y: 0, duration: 1 }, '<0.3')
        .to(calendarRef.current, { scale: 0.85, opacity: 0.4, duration: 1.5 }, '<')
        .to(phoneRef.current, { opacity: 1, x: 0, scale: 1, duration: 1.5, ease: 'power3.out' }, '<0.2')
        .to(macbookRef.current, { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'power3.out' }, '<0.3');

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="py-16 min-h-[85vh] flex flex-col justify-center">
      {/* Section Header */}
      <div className="text-center mb-10 max-w-5xl mx-auto">
        <h2 data-reveal className="headline uppercase text-white text-center text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.95]">
          Your scheduling<br />command center
        </h2>
        <p data-reveal className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.7] text-zinc-400">
          Most tools show you a list of posts. octa-studio gives you a living week view — drag, drop, and ship your entire content pipeline from one screen.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-8 mb-4">
        <div ref={step1Ref} className="flex items-center gap-2 text-[12px] font-medium text-fuchsia-400 opacity-30 transition-opacity">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20 text-[10px]">1</span>
          Schedule
        </div>
        <div ref={step2Ref} className="flex items-center gap-2 text-[12px] font-medium text-emerald-400 opacity-30 transition-opacity">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px]">2</span>
          Reschedule
        </div>
        <div ref={step3Ref} className="flex items-center gap-2 text-[12px] font-medium text-blue-400 opacity-30 transition-opacity">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px]">3</span>
          Multi-device
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto w-64 h-1 rounded-full bg-zinc-800 mb-10 overflow-hidden">
        <div ref={progressRef} className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500" style={{ width: '0%' }} />
      </div>

      {/* Text Stack — smooth crossfade */}
      <div className="relative w-full h-[72px] mb-8 max-w-2xl mx-auto text-center">
        <div ref={text1Ref} className="absolute inset-0 w-full flex items-center justify-center">
          <p className="text-[15px] leading-[1.6] text-zinc-400">Write your content in the editor, then drop it into the visual calendar. See your entire pipeline at a glance across the week.</p>
        </div>
        <div ref={text2Ref} className="absolute inset-0 w-full flex items-center justify-center">
          <p className="text-[15px] leading-[1.6] text-zinc-300"><strong className="text-fuchsia-400">Scheduled.</strong> Your LinkedIn post is locked into Thursday at 10 AM. It's queued and ready to publish automatically.</p>
        </div>
        <div ref={text3Ref} className="absolute inset-0 w-full flex items-center justify-center">
          <p className="text-[15px] leading-[1.6] text-zinc-300"><strong className="text-emerald-400">Rescheduled.</strong> Dragged to Saturday. octa-studio updates the queue instantly — no extra clicks needed.</p>
        </div>
        <div ref={text4Ref} className="absolute inset-0 w-full flex items-center justify-center">
          <p className="text-[15px] leading-[1.6] text-zinc-300"><strong className="text-blue-400">Everywhere.</strong> Generate content in AI Studio on mobile, schedule on desktop. Your workspace syncs across all devices.</p>
        </div>
      </div>

      {/* Visual Area */}
      <div className="relative mx-auto w-full max-w-6xl" style={{ height: '480px' }}>
        
        {/* ── Realistic Calendar Dashboard ── */}
        <div ref={calendarRef} className="absolute inset-0 overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] shadow-2xl shadow-black/60" style={{ opacity: 0 }}>
          {/* Calendar Top Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button className="rounded-lg bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold text-fuchsia-400">Today</button>
              <div className="flex gap-1">
                <button className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <button className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
              </div>
              <span className="text-[13px] font-semibold text-white">Aug 11 – 17, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600">Asia/Kolkata</span>
              <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
                <span className="bg-zinc-800 px-3 py-1 text-[10px] font-semibold text-white">Week</span>
                <span className="px-3 py-1 text-[10px] text-zinc-500">Month</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex h-[calc(100%-42px)]">
            {/* Time Column */}
            <div className="w-14 flex-shrink-0 border-r border-zinc-900 pt-8">
              {hours.map(h => (
                <div key={h} className="h-[68px] pr-2 text-right text-[9px] text-zinc-600">{h}</div>
              ))}
            </div>
            {/* Day Columns */}
            <div className="flex-1 grid grid-cols-7">
              {days.map((day, i) => (
                <div key={day} className="border-r border-zinc-900/50 relative">
                  {/* Day Header */}
                  <div className={`text-center border-b border-zinc-900 py-1.5 ${i === 3 ? 'bg-fuchsia-500/5' : ''}`}>
                    <p className={`text-[10px] font-medium ${i === 3 ? 'text-fuchsia-400' : 'text-zinc-500'}`}>{day}</p>
                  </div>
                  {/* Time slots */}
                  <div className="relative">
                    {hours.map(h => (
                      <div key={h} className="h-[68px] border-b border-zinc-900/30" />
                    ))}
                  </div>
                  {/* Static events */}
                  {i === 1 && (
                    <div className="absolute top-[68px] left-1 right-1 rounded-md bg-blue-600/20 border border-blue-600/30 p-1.5">
                      <p className="text-[8px] font-bold text-blue-400">X Post</p>
                      <p className="text-[7px] text-blue-400/60">Dark Mode Tips</p>
                    </div>
                  )}
                  {i === 4 && (
                    <div className="absolute top-[204px] left-1 right-1 rounded-md bg-pink-600/20 border border-pink-600/30 p-1.5">
                      <p className="text-[8px] font-bold text-pink-400">IG Reel</p>
                      <p className="text-[7px] text-pink-400/60">SaaS Showcase</p>
                    </div>
                  )}
                  {i === 6 && (
                    <div className="absolute top-[136px] left-1 right-1 rounded-md bg-red-600/20 border border-red-600/30 p-1.5">
                      <p className="text-[8px] font-bold text-red-400">YT Video</p>
                      <p className="text-[7px] text-red-400/60">AI Deep Dive</p>
                    </div>
                  )}
                  {/* Animated Post — lands on Thursday 10AM */}
                  {i === 3 && (
                    <div ref={postRef} className="absolute top-[68px] left-1 right-1 z-10 rounded-md bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 border border-fuchsia-400/60 p-1.5 shadow-lg shadow-fuchsia-900/40 cursor-grab">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 flex items-center justify-center text-[6px] font-bold text-white">in</span>
                        <span className="text-[8px] font-bold text-white">LinkedIn</span>
                      </div>
                      <p className="text-[7px] text-fuchsia-100">5 AI Tools for Devs</p>
                      <p className="text-[6px] text-fuchsia-200/50 mt-0.5">10:00 AM</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Phone Mockup — AI Studio ── */}
        <div ref={phoneRef} className="absolute -right-4 top-4 w-[200px] z-20" style={{ opacity: 0 }}>
          <div className="rounded-[24px] border-2 border-zinc-700 bg-[#0a0a0c] p-1.5 shadow-2xl shadow-black/80">
            {/* Phone notch */}
            <div className="mx-auto h-4 w-20 rounded-b-xl bg-zinc-800 mb-2" />
            <div className="rounded-[18px] bg-[#111113] overflow-hidden">
              {/* AI Studio Header */}
              <div className="bg-zinc-900 px-3 py-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded overflow-hidden bg-gradient-to-br from-fuchsia-500 to-purple-600">
                  <Image src="/images/logo.png" alt="octa-studio" width={20} height={20} className="object-cover" />
                </span>
                <span className="text-[10px] font-semibold text-white">AI Studio</span>
              </div>
              {/* Platform Select */}
              <div className="px-3 py-2 flex gap-1.5">
                {[
                  { label: 'LinkedIn', color: 'bg-blue-600', active: true },
                  { label: 'X', color: 'bg-zinc-600', active: false },
                  { label: 'IG', color: 'bg-pink-600', active: false },
                ].map(p => (
                  <span key={p.label} className={`rounded-full px-2 py-0.5 text-[7px] font-bold text-white ${p.active ? p.color : 'bg-zinc-800 text-zinc-500'}`}>{p.label}</span>
                ))}
              </div>
              {/* Generated Content */}
              <div className="px-3 py-2">
                <div className="rounded-lg bg-zinc-900 p-2">
                  <p className="text-[8px] text-zinc-300 leading-relaxed">🚀 AI is reshaping how devs build products. Here are 5 tools every developer should try...</p>
                  <p className="text-[7px] text-fuchsia-400 mt-1">#AI #DevTools #SaaS</p>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="px-3 pb-3 flex gap-1.5">
                <button className="flex-1 rounded-lg bg-zinc-800 py-1.5 text-[7px] font-semibold text-zinc-300">Draft</button>
                <button className="flex-1 rounded-lg bg-fuchsia-600 py-1.5 text-[7px] font-semibold text-white">Schedule</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── MacBook Mockup — Calendar View ── */}
        <div ref={macbookRef} className="absolute -left-6 -bottom-8 w-[320px] z-20" style={{ opacity: 0 }}>
          <div className="rounded-t-lg border border-zinc-700 bg-[#0a0a0c] p-1 shadow-2xl shadow-black/80">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-2 py-1 border-b border-zinc-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <div className="flex-1 mx-2 rounded bg-zinc-800 px-2 py-0.5">
                <span className="text-[7px] text-zinc-500">octa-studio.app/calendar</span>
              </div>
            </div>
            {/* Screen Content — mini calendar */}
            <div className="bg-[#111113] p-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[8px] font-semibold text-white">Aug 2026</span>
                <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[6px] font-bold text-fuchsia-400">Week View</span>
              </div>
              {/* Mini week grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((d, i) => (
                  <div key={d} className="text-center">
                    <p className={`text-[6px] mb-0.5 ${i === 3 ? 'text-fuchsia-400 font-bold' : 'text-zinc-600'}`}>{d.split(' ')[0]}</p>
                    <div className={`h-12 rounded border ${i === 3 ? 'border-fuchsia-500/30 bg-fuchsia-500/5' : 'border-zinc-900 bg-zinc-950'}`}>
                      {i === 3 && <div className="m-0.5 rounded bg-fuchsia-600 h-3 flex items-center px-0.5"><span className="text-[4px] text-white font-bold">AI Tools</span></div>}
                      {i === 1 && <div className="m-0.5 rounded bg-blue-600 h-3" />}
                      {i === 5 && <div className="m-0.5 rounded bg-pink-600 h-3" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* MacBook base/hinge */}
          <div className="h-2 rounded-b-lg bg-zinc-700 mx-2" />
          <div className="h-1 rounded-b bg-zinc-600 mx-8" />
        </div>
      </div>
    </div>
  );
}

function PricingSection() {
  return (
    <section className="border-t border-zinc-900 bg-zinc-950/20 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div data-reveal className="text-center">
          <h2 className="text-[clamp(3rem,6vw,5.5rem)] font-medium tracking-tight" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            <span className="text-zinc-100">Simple,</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-green-400 bg-clip-text text-transparent">transparent</span>{" "}
            <span className="text-zinc-100">pricing</span>
          </h2>
          <p className="mt-4 text-[15px] text-zinc-400">Start for free, upgrade when you need more power.</p>
          
          <div className="mt-8 flex justify-center">
            <div className="flex items-center rounded-full border border-zinc-800 bg-zinc-950 p-1">
              <button className="rounded-full bg-zinc-800 px-6 py-1.5 text-sm font-medium text-white">Monthly</button>
              <button className="rounded-full px-6 py-1.5 text-sm font-medium text-zinc-400">Annually (Save 20%)</button>
            </div>
          </div>
        </div>

        <div data-reveal className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { name: "Starter", price: "$0", desc: "Perfect for individuals just getting started.", btn: "Get Started", features: ["1 Social Profile per platform", "10 AI Generations / mo", "Basic Analytics"] },
            { name: "Pro", price: "$29", desc: "For professional creators and solopreneurs.", btn: "Start 14-Day Trial", features: ["Unlimited Social Profiles", "Unlimited AI Generations", "Advanced AI Video Mesh", "Custom Analytics"], popular: true },
            { name: "Agency", price: "$99", desc: "For teams managing multiple brands.", btn: "Contact Sales", features: ["Everything in Pro", "Unlimited Workspaces", "Team Collaboration", "API Access"] }
          ].map((tier) => (
            <div key={tier.name} className={`relative flex flex-col rounded-2xl border ${tier.popular ? "border-fuchsia-500 bg-zinc-900/50 shadow-[0_0_40px_-15px_rgba(168,85,247,0.3)]" : "border-zinc-800 bg-zinc-950"} p-8`}>
              {tier.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fuchsia-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Most Popular</span>}
              <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
              <p className="mt-2 text-[13px] text-zinc-400">{tier.desc}</p>
              <p className="mt-6 text-4xl font-semibold text-white">{tier.price}<span className="text-sm font-normal text-zinc-500">/mo</span></p>
              
              <button className={`mt-8 w-full rounded-xl py-2.5 text-[13px] font-semibold transition ${tier.popular ? "bg-fuchsia-600 text-white hover:bg-fuchsia-500" : "bg-white text-black hover:bg-zinc-200"}`}>
                {tier.btn}
              </button>

              <ul className="mt-8 flex-1 space-y-4">
                {tier.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-[13px] text-zinc-300">
                    <svg className={`h-4 w-4 shrink-0 ${tier.popular ? "text-fuchsia-500" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="border-t border-zinc-900 py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h2 data-reveal className="text-center text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-white">Frequently Asked Questions</h2>
        
        <div data-reveal className="mt-16 space-y-6">
          {[
            { q: "Which social platforms are supported?", a: "We currently support LinkedIn, X (Twitter), Instagram, Facebook, TikTok, and YouTube. We're constantly adding more." },
            { q: "How does the AI Video Mesh work?", a: "Our AI processes your video in the browser to map facial expressions to 3D meshes, allowing you to swap styles and avatars seamlessly without rendering delays." },
            { q: "Can I manage multiple clients?", a: "Yes, the Agency plan allows you to create separate isolated Workspaces for each of your clients." }
          ].map((faq, i) => (
            <details key={i} className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-white">
                {faq.q}
                <span className="ml-6 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 transition group-open:rotate-45">
                  <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-relaxed text-zinc-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreativeAdBanner() {
  return (
    <section className="border-t border-zinc-900 bg-black py-12 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-8 lg:p-16">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
          
          <div data-reveal className="relative z-10 max-w-2xl">
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-tight font-semibold tracking-[-0.02em] text-white">
              Stop switching tabs. <br/> Start shipping content.
            </h2>
            <p className="mt-4 text-[16px] text-zinc-400 max-w-xl">
              Join thousands of modern creators using octa-studio to ideate, write, edit, and publish from a single beautiful workspace.
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="/calendar" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-[14px] font-semibold text-black transition hover:bg-zinc-200">
                Start your 14-day free trial
              </Link>
            </div>
          </div>
          
          {/* Abstract geometric decoration */}
          <div className="absolute -bottom-24 right-10 hidden lg:block opacity-60">
            <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="150" r="149.5" stroke="url(#paint0_linear)" strokeOpacity="0.3"/>
              <circle cx="200" cy="150" r="100.5" stroke="url(#paint1_linear)" strokeOpacity="0.3"/>
              <circle cx="200" cy="150" r="50.5" stroke="url(#paint2_linear)" strokeOpacity="0.3"/>
              <defs>
                <linearGradient id="paint0_linear" x1="50" y1="0" x2="350" y2="300" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A855F7"/>
                  <stop offset="1" stopColor="#A855F7" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="100" y1="50" x2="300" y2="250" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A855F7"/>
                  <stop offset="1" stopColor="#A855F7" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="paint2_linear" x1="150" y1="100" x2="250" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A855F7"/>
                  <stop offset="1" stopColor="#A855F7" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}


/* AI Pipeline Animation — shows how the AI builds a post, stage by stage */




/* ─── Client Component ─── */
export function LandingClient({
  ideaCount,
  contentCount,
  publishedCount,
  channelCount
}: {
  ideaCount: number;
  contentCount: number;
  publishedCount: number;
  channelCount: number;
}) {
  // Lenis smooth scrolling synced with GSAP ScrollTrigger
  useSmoothScroll();

  // Scroll-reveal every [data-reveal] block across all sections
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      // No animations — show chart bars in their final state
      document.querySelectorAll("[data-chart]").forEach((el) => el.classList.add("chart-play"));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 44 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      // Fade the fixed nav in on load
      const nav = document.querySelector("nav");
      if (nav) gsap.from(nav, { y: -16, autoAlpha: 0, duration: 0.8, ease: "power3.out", delay: 0.15 });

      // Play analytics chart bars when scrolled into view
      gsap.utils.toArray<HTMLElement>("[data-chart]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 82%",
          once: true,
          onEnter: () => el.classList.add("chart-play"),
        });
      });
    });

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      step: "STEP 1",
      title: "Capture Ideas",
      description:
        "Brainstorm content topics and save them to your idea inbox. Tag by category and platform to build your content pipeline.",
      image: "/images/step1-ideas.jpg",
      href: "/ideas",
    },
    {
      step: "STEP 2",
      title: "Write with AI",
      description:
        "Generate hooks, drafts, and full posts with the AI Studio. Choose platform, tone, and content type — then refine.",
      image: "/images/step2-write.jpg",
      href: "/ai-studio",
    },
    {
      step: "STEP 3",
      title: "Schedule & Publish",
      description:
        "Drag content onto the visual calendar. Connect your social profiles and publish to every channel from one queue.",
      image: "/images/step3-schedule.jpg",
      href: "/calendar",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-fuchsia-500/30">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes slide {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
        @keyframes slideRight {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
        @keyframes toast-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scaleUp {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .chart-bar { transform: scaleY(0); }
        .chart-play .chart-bar { animation: scaleUp 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}} />

      {/* ━━━ Navigation ━━━ */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-lg shadow-fuchsia-500/10">
              <Image src="/images/logo.png" alt="octa-studio" width={32} height={32} className="object-cover" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">octa-studio</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#calendar" className="text-[13px] text-zinc-500 transition hover:text-white">Calendar</a>
            <a href="#ai-steps" className="text-[13px] text-zinc-500 transition hover:text-white">AI Automation</a>
            <a href="#pricing" className="text-[13px] text-zinc-500 transition hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/calendar" className="rounded-full border border-zinc-800 px-5 py-2 text-[13px] font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white">Open App</Link>
            <MotionFillableButton href="/login" className="h-9 px-6 text-[13px]">Get Started</MotionFillableButton>
          </div>
        </div>
      </nav>

        {/* 1. HERO ("plan create publish page 1") */}
      <section className="relative overflow-hidden pt-16">
        {/* Background video loop */}
        <div className="absolute inset-0">
          <video
            src="/ai/banner-374a8e61.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-6 pt-32 pb-16 text-center lg:px-8 lg:pt-40 lg:pb-24">

          <h1 data-reveal className="headline-apple mx-auto mt-8 max-w-3xl text-[clamp(2.25rem,4.5vw,4rem)]">
            Plan, create, and publish from one workspace
          </h1>
          <p data-reveal className="mx-auto mt-6 max-w-2xl text-[16px] leading-[1.7] text-zinc-400">
            octa-studio brings your idea inbox, AI composer, visual calendar, publishing queue, and analytics into a single workspace built for modern content creators.
          </p>
          <div data-reveal className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MotionFillableButton href="/calendar">
                Open Calendar <span>→</span>
              </MotionFillableButton>
          </div>
        </div>
      </section>

      {/* 2. CALENDAR SHOW GSAP */}
      <section id="calendar" className="border-t border-zinc-900 bg-zinc-950/20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <GsapCalendarShowcase />
        </div>
      </section>

      {/* 3. ALL STEP AI — redesigned with Create Post + AI Assistant */}
      <section id="ai-steps" className="border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8">
          
          <h2 data-reveal className="headline-apple text-center text-[clamp(3rem,6vw,5.5rem)]">
            AI-Powered Workflows
          </h2>
          <p data-reveal className="mx-auto mt-6 max-w-3xl text-center text-[17px] leading-[1.6] text-zinc-500">From idea to published post — see every stage of your content pipeline.</p>
          
          {/* The 3 Step Cards */}
          <div data-reveal className="mt-20 grid gap-10 md:grid-cols-3">
            {steps.map((item) => (
              <Link key={item.step} href={item.href} className="group flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 transition-transform duration-300 group-hover:scale-[1.02] group-hover:border-zinc-700">
                  <Image src={item.image} alt={item.title} fill className="object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="mt-6 flex justify-center">
                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3.5 py-1.5 text-[12px] font-semibold tracking-widest text-zinc-400">{item.step}</span>
                </div>
                <h3 className="mt-4 text-center text-2xl font-semibold tracking-[-0.01em]">{item.title}</h3>
                <p className="mt-3 text-center text-[15px] leading-[1.7] text-zinc-500">{item.description}</p>
              </Link>
            ))}
          </div>

          {/* ── Post Status Cards ── */}
          <div data-reveal className="mt-32">
            <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-fuchsia-400 text-center mb-6">Content Pipeline</p>
            <h3 className="headline-apple mt-3 text-center text-[clamp(2.25rem,4.5vw,4rem)]">
              <DockText text="See how your posts look at every stage" />
            </h3>
            <p className="mx-auto mt-4 max-w-xl text-center text-[14px] text-zinc-500">Every post moves through Draft → Ready → Scheduled → Published. Track status at a glance.</p>
            <div className="mt-12">
              <PostStatusCards />
            </div>
          </div>

{/* ── Create Post + AI Assistant Showcase ── */}
           <div data-reveal className="mt-32">
             <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
               <div className="lg:sticky lg:top-32">
                 <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-fuchsia-400">Create with AI</p>
                 <h3 className="headline-apple mt-3 text-[clamp(2rem,3.5vw,3rem)]">Your OLED Creative Workspace.</h3>
                 <p className="mt-4 text-[14px] leading-[1.7] text-zinc-500">Write text, build pipelines, generate images, and create videos in dark mode. Configure the platform, tone, and content type, and watch the AI build a ready-to-publish post.</p>
                 <ul className="mt-6 space-y-3">
                   {["Real-time post preview", "Text, Image & Video generation", "Context-aware models", "Brand tone enforcement"].map((item) => (
                     <li key={item} className="flex items-center gap-3 text-[13px] text-zinc-400">
                       <svg className="h-4 w-4 shrink-0 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       {item}
                     </li>
                   ))}
                 </ul>
               </div>
               <div>
                 <img src="/images/hompage.png" alt="AI Creative Workspace" className="rounded-2xl border border-zinc-800 shadow-2xl shadow-black/60 w-full object-cover" />
               </div>
             </div>
           </div>

          {/* ── Bulk Scheduling + Post Preview ── */}
          <div data-reveal className="mt-32 grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-fuchsia-400">Bulk Operations</p>
              <h3 className="mt-3 text-[clamp(1.3rem,2vw,1.75rem)] font-semibold tracking-[-0.02em]">Reschedule & publish in bulk</h3>
              <p className="mt-4 text-[14px] leading-[1.7] text-zinc-500 mb-8">Select multiple posts and reschedule or publish them all at once. No more clicking through posts one by one.</p>
              <BulkScheduleVisual />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-fuchsia-400">Post Preview</p>
              <h3 className="mt-3 text-[clamp(1.3rem,2vw,1.75rem)] font-medium tracking-[-0.02em]" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>See how your posts look at every stage</h3>
              <p className="mt-4 text-[14px] leading-[1.7] text-zinc-500 mb-8">Preview your content as it will appear on each platform before you publish. No surprises.</p>
              <PostPreviewCard />
            </div>
          </div>


        </div>
      </section>

      {/* ━━━ NEW: Simple Analytics ━━━ */}
      <section className="border-t border-zinc-900 bg-black py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div data-reveal>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-blue-400">Simple Analytics</p>
              <h3 className="headline-apple mt-3 text-[clamp(2.25rem,4.5vw,4rem)]">
                Understand your audience
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
                Stop guessing what works. octa-studio automatically aggregates your performance data across all platforms into one unified dashboard. Track engagement, audience growth, and top-performing content.
              </p>
            </div>
            
            <div data-reveal data-chart className="relative aspect-square max-w-md mx-auto w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[11px] text-zinc-500 font-medium">Total Impressions</p>
                  <p className="text-3xl font-bold text-white mt-1">2.4M</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  12%
                </div>
              </div>
              
              {/* Animated Chart Bars */}
              <div className="mt-4 flex h-48 items-end gap-2 px-2">
                {[40, 25, 60, 30, 85, 45, 95].map((h, i) => (
                  <div key={i} className="group relative flex-1 h-full flex items-end">
                    <div 
                      className="chart-bar w-full rounded-t-sm bg-gradient-to-t from-blue-600/30 to-blue-500 transition-all hover:opacity-80 origin-bottom"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-white px-2 py-1 text-[10px] font-bold text-black transition-opacity pointer-events-none">
                      {h}k
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between border-t border-zinc-900 pt-4 text-[10px] font-medium text-zinc-600">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ NEW: Pricing ━━━ */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* ━━━ NEW: FAQ ━━━ */}
      <FAQSection />

      {/* TEXT FILL REVEAL */}
      <ScrollTextRevealSection />

      {/* ━━━ NEW: Creative Ad CTA ━━━ */}
      <CreativeAdBanner />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950">
        <div data-reveal className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md overflow-hidden">
              <Image src="/images/logo.png" alt="octa-studio" width={28} height={28} className="object-cover" />
            </span>
            <span className="text-sm font-semibold">octa-studio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/calendar" className="text-xs text-zinc-500 hover:text-white transition">Open Calendar</Link>
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} octa-studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
