"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type AdminSelectOption<T extends string> = {
  value: T;
  label: string;
};

type AdminSelectProps<T extends string> = {
  ariaLabel?: string;
  options: AdminSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function AdminSelect<T extends string>({ ariaLabel, options, value, onChange }: AdminSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"above" | "below">("below");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  function openMenu() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const estimatedListHeight = Math.min(options.length * 34 + 8, 256);
      setOpenDirection(window.innerHeight - rect.bottom < estimatedListHeight && rect.top > estimatedListHeight ? "above" : "below");
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={rootRef}>
      <button
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="field flex min-h-8 w-full items-center justify-between gap-3 text-left"
        role="combobox"
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <span className="truncate">{selectedOption?.label ?? ""}</span>
        <ChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} size={18} />
      </button>

      {open ? (
        <div
          className={`absolute left-0 z-50 max-h-64 w-full overflow-y-auto rounded border border-[var(--colorNeutralStroke1)] bg-[var(--colorNeutralBackground2)] p-1 shadow-2xl ${
            openDirection === "above" ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"
          }`}
          id={listboxId}
          role="listbox"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                aria-selected={selected}
                className={`flex min-h-8 w-full items-center gap-2 rounded px-2 py-1.5 text-left transition ${
                  selected
                    ? "bg-[var(--colorBrandBackground)] text-[var(--colorNeutralForegroundOnBrand)]"
                    : "text-[var(--colorNeutralForeground1)] hover:bg-[var(--colorNeutralBackground3)]"
                }`}
                key={option.value}
                role="option"
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center">{selected ? <Check size={16} /> : null}</span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
