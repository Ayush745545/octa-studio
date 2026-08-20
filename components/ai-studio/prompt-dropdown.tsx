"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface PromptDropdownOption {
  label: string;
  value?: string;
  description?: string;
  icon?: ReactNode;
  divider?: boolean;
}

export interface PromptDropdownProps {
  label?: string;
  value?: string;
  options?: (PromptDropdownOption | string)[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: "left" | "right";
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  ariaLabel?: string;
}

function normalize(option: PromptDropdownOption | string): PromptDropdownOption {
  return typeof option === "string" ? { label: option, value: option } : option;
}

/**
 * Compact dropdown used next to the AI Studio prompt bar for picking a
 * preset (mode, style, suggested prompt, …).
 *
 * Implements proper menu semantics: opens below the trigger, closes on
 * outside click / Escape, supports full keyboard navigation (Arrow keys,
 * Home/End, Enter/Space), a highlighted selected item, and optional dividers.
 */
export function PromptDropdown({
  label,
  value,
  options = [],
  placeholder = "Select",
  className = "",
  disabled = false,
  align = "left",
  onChange,
  onSelect,
  ariaLabel,
}: PromptDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const items = options.map(normalize).filter((item) => !item.divider);
  const selected = items.find((item) => (item.value ?? item.label) === value);
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => (item.value ?? item.label) === value),
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Move focus into the open menu for keyboard users.
      requestAnimationFrame(() => menuRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function choose(option: PromptDropdownOption) {
    const next = option.value ?? option.label;
    setOpen(false);
    onChange?.(next);
    onSelect?.(next);
    triggerRef.current?.focus();
  }

  function moveActive(step: number) {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev + step + items.length) % items.length);
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (items[activeIndex]) choose(items[activeIndex]);
        break;
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) setActiveIndex(selectedIndex);
        }}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(selectedIndex);
          }
        }}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label && <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>}
        <span>{selected?.label ?? placeholder}</span>
        <svg
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={ariaLabel ?? label ?? "Options"}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={`absolute z-30 mt-2 max-h-80 w-60 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-1 shadow-2xl outline-none ${align === "right" ? "right-0" : "left-0"}`}
        >
          {options.map(normalize).map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} role="separator" className="my-1 border-t border-white/10" />;
            }
            const itemValue = item.value ?? item.label;
            const isSelected = itemValue === value;
            const isActive = activeIndex === items.findIndex((i) => (i.value ?? i.label) === itemValue);
            return (
              <button
                key={itemValue}
                ref={(el) => {
                  itemRefs.current[items.findIndex((i) => (i.value ?? i.label) === itemValue)] = el;
                }}
                type="button"
                role="menuitem"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => choose(item)}
                onMouseEnter={() => {
                  const idx = items.findIndex((i) => (i.value ?? i.label) === itemValue);
                  if (idx >= 0) setActiveIndex(idx);
                }}
                className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "bg-[#C7E34F]/10 text-white"
                    : isActive
                    ? "bg-white/10 text-zinc-100"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                {item.icon}
                <span className="min-w-0">
                  <span className="block font-medium leading-tight">{item.label}</span>
                  {item.description && (
                    <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{item.description}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PromptDropdown;
