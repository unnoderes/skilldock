import React from "react";
import { Search } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
  inputClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div
      className={`group relative rounded-xl border border-border bg-surface-800 transition-[border-color,box-shadow] focus-within:border-accent/70 focus-within:ring-1 focus-within:ring-accent/30 ${className}`}
    >
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border-0 bg-transparent py-2 pl-10 pr-3 text-xs outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${inputClassName}`}
      />
    </div>
  );
}
