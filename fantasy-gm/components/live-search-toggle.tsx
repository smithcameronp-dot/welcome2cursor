"use client";

type LiveSearchToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
};

export function LiveSearchToggle({
  enabled,
  onChange,
  disabled = false,
}: LiveSearchToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 select-none">
      <span className="text-right">
        <span className="block text-xs font-semibold tracking-wide text-chalk uppercase">
          Live search
        </span>
        <span className="block text-[11px] text-chalk-dim">
          {enabled ? "Reading X and the web" : "Model knowledge only"}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Live search"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled
            ? "border-field bg-field-deep"
            : "border-turf-600 bg-turf-700"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-chalk transition-all ${
            enabled ? "left-6" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
