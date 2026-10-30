"use client";

interface CountdownDisplayProps {
  secondsRemaining: number;
}

export function CountdownDisplay({ secondsRemaining }: CountdownDisplayProps) {
  const safe = Math.max(0, Math.floor(secondsRemaining));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const warning = safe < 60;

  return (
    <div
      role="timer"
      aria-live="off"
      className={`text-center text-3xl font-mono font-semibold tabular-nums ${
        warning ? "text-destructive" : "text-foreground"
      }`}
    >
      {formatted}
    </div>
  );
}
