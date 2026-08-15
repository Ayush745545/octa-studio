import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/animate-ui/components/radix/popover";

interface PromptDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const PromptDropdown = ({
  label,
  value,
  options,
  onChange,
}: PromptDropdownProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 outline-none transition hover:border-white/25 hover:text-zinc-100 focus-visible:ring-1 focus-visible:ring-[#7C3AED]"
        >
          <span>{value}</span>
          <span className="text-zinc-500">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={6}
        align="start"
        className="w-40 overflow-hidden rounded-xl border border-white/10 bg-[#131317] p-1 shadow-xl shadow-black/50"
      >
        <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
              value === opt
                ? "bg-[#7C3AED]/20 text-violet-300"
                : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span>{opt}</span>
            {value === opt && (
              <svg
                className="h-3 w-3 text-[#7C3AED]"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
