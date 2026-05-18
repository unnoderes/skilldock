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
      className={`group relative min-w-0 overflow-hidden rounded-xl border border-border bg-surface-800 transition-[border-color,box-shadow] focus-within:border-accent/70 focus-within:ring-1 focus-within:ring-accent/30 ${className}`}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center">
        <Search
          size={14}
          className="text-text-muted transition-colors group-focus-within:text-accent"
        />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block h-10 w-full min-w-0 rounded-xl border-0 bg-transparent pl-10 pr-3 text-xs leading-5 outline-none placeholder:text-text-muted focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${inputClassName}`}
        style={{
          paddingLeft: "2.5rem",
          paddingRight: "0.75rem",
        }}
      />
    </div>
  );
}
