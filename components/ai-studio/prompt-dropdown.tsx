"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface PromptDropdownOption {
  label: string;
  value?: string;
  description?: string;
  icon?: ReactNode;
}

export interface PromptDropdownProps {
  label?: string;
  value?: string;
  options?: (PromptDropdownOption | string)[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
}

function normalize(option: PromptDropdownOption | string): PromptDropdownOption {
  return typeof option === "string" ? { label: option, value: option } : option;
}

/**
 * Compact dropdown used next to the AI Studio prompt bar for picking a
 * preset (mode, style, suggested prompt, …).
 */
export function PromptDropdown({
  label,
  value,
  options = [],
  placeholder = "Select",
  className = "",
  disabled = false,
  onChange,
  onSelect,
}: PromptDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const items = options.map(normalize);
  const selected = items.find((item) => (item.value ?? item.label) === value);

  function choose(option: PromptDropdownOption) {
    const next = option.value ?? option.label;
    setOpen(false);
    onChange?.(next);
    onSelect?.(next);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label && <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>}
        <span>{selected?.label ?? placeholder}</span>
        <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && items.length > 0 && (
        <div className="absolute z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-white/10 bg-[#111114] p-1 shadow-xl">
          {items.map((item) => {
            const itemValue = item.value ?? item.label;
            return (
              <button
                key={itemValue}
                type="button"
                onClick={() => choose(item)}
                className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                  itemValue === value ? "text-white" : "text-zinc-300"
                }`}
              >
                {item.icon}
                <span>
                  {item.label}
                  {item.description && (
                    <span className="block text-xs text-zinc-500">{item.description}</span>
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
