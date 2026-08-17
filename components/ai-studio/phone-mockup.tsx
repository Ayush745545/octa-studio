"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface PhoneMockupProps {
  onClick?: () => void;
  content?: string;
  theme?: "dark" | "light";
  animation?: "snake" | "fade" | "scale" | "slide";
  className?: string;
  imageUrl?: string;
  videoUrl?: string;
  isGenerating?: boolean;
  onMove?: (position: { x: number; y: number }) => void;
}

export function PhoneMockup({
  onClick,
  content,
  theme = "dark",
  animation = "snake",
  className = "",
  imageUrl,
  videoUrl,
  isGenerating = false,
  onMove,
}: PhoneMockupProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Snake animation effect - typing text in and out
  useEffect(() => {
    if (!content) {
      setDisplayedText("");
      return;
    }

    let typingTimer: NodeJS.Timeout;
    let eraseTimer: NodeJS.Timeout;
    let displayTimer: NodeJS.Timeout;

    const startTyping = () => {
      let currentText = "";
      let index = 0;
      
      setIsTyping(true);
      
      const typeNextChar = () => {
        if (index < content.length) {
          currentText += content[index];
          setDisplayedText(currentText);
          index++;
          setTextIndex(index);
          typingTimer = setTimeout(typeNextChar, 30);
        } else {
          // Finished typing, wait before erasing
          displayTimer = setTimeout(() => {
            startErasing();
          }, 2000);
        }
      };

      const startErasing = () => {
        let currentText = content;
        let index = content.length;
        
        const eraseNextChar = () => {
          if (index > 0) {
            currentText = content.slice(0, index);
            setDisplayedText(currentText);
            index--;
            setTextIndex(index);
            eraseTimer = setTimeout(eraseNextChar, 20);
          } else {
            // Finished erasing, wait before typing again
            displayTimer = setTimeout(() => {
              startTyping();
            }, 1000);
          }
        };

        eraseNextChar();
      };

      typeNextChar();
    };

    // Start the animation cycle
    startTyping();

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(eraseTimer);
      clearTimeout(displayTimer);
    };
  }, [content]);

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newPosition = {
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      };
      setPosition(newPosition);
      onMove?.(newPosition);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const newPosition = {
        x: e.touches[0].clientX - dragOffset.current.x,
        y: e.touches[0].clientY - dragOffset.current.y,
      };
      setPosition(newPosition);
      onMove?.(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, onMove]);

  // Auto-regenerate content on click
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  const animationClass = {
    snake: "animate-pulse",
    fade: "animate-fade-in",
    scale: "animate-scale-in",
    slide: "animate-slide-up",
  }[animation];

  const themeClass = {
    dark: "bg-black border-zinc-800",
    light: "bg-white border-zinc-200",
  }[theme];

  const textTheme = {
    dark: "text-white",
    light: "text-black",
  }[theme];

  return (
    <div
      className={`
        fixed bottom-8 right-8 z-40
        transition-all duration-500 ease-out
        ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        ${className}
      `}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className={`
          relative w-[300px] h-[600px] rounded-[40px] border-4 ${themeClass}
          shadow-[0_20px_60px_rgba(0,0,0,0.5)]
          overflow-hidden
          cursor-pointer
          hover:shadow-[0_25px_80px_rgba(124,58,237,0.4)]
          transition-shadow duration-300
          ${animationClass}
        `}
      >
        {/* Phone notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[28px] bg-black rounded-b-2xl z-10" />
        
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-black/80 flex items-center justify-center z-10">
          <span className="text-[10px] text-zinc-400">9:41 AM</span>
        </div>

        {/* Screen content */}
        <div className="absolute top-10 left-0 right-0 bottom-0 bg-gradient-to-b from-[#0a0a0c] to-[#1a1a1f] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-violet-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">AI</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">AI Studio</p>
                <p className="text-[10px] text-zinc-500">
                  {isGenerating ? "Generating..." : imageUrl || videoUrl ? "Preview" : "Generating content..."}
                </p>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="p-4 h-[calc(100%-120px)] flex flex-col">
            {(imageUrl || videoUrl) && !isGenerating ? (
              <div className="flex-1 rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden relative">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={imageUrl ?? ""}
                    alt="Generated image"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                )}
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 flex-1 flex items-center justify-center">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
                      <p className="text-xs text-zinc-500">Generating...</p>
                    </div>
                  ) : (
                    <p className={`text-sm leading-6 ${textTheme} whitespace-pre-wrap text-center`}>
                      {displayedText}
                      {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-[#7C3AED] animate-pulse" />}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                {!isGenerating && !imageUrl && !videoUrl && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-lg bg-[#7C3AED] px-3 py-2 text-xs font-medium text-white">
                      Create Content
                    </button>
                    <button className="flex-1 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300">
                      Schedule
                    </button>
                  </div>
                )}

                {/* Progress indicator */}
                {!isGenerating && !imageUrl && !videoUrl && (
                  <div className="mt-4">
                    <div className="h-1 w-full rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-violet-600 transition-all duration-300"
                        style={{ width: content ? `${(textIndex / content.length) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-1 bg-white/30 rounded-full z-10" />
      </div>

      {/* Move handle / tooltip */}
      <div
        className="absolute -top-10 right-0 bg-black/90 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <span>Drag to move</span>
      </div>
    </div>
  );
}