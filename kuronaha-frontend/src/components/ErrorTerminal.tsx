"use client";

import { useEffect, useState } from "react";
import { subscribeTerminal, TerminalEntry } from "@/lib/terminal";

const MAX_LOGS = 40;

export function ErrorTerminal() {
  const [logs, setLogs] = useState<TerminalEntry[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeTerminal((entry) => {
      setLogs((current) => {
        const next = [entry, ...current];
        return next.slice(0, MAX_LOGS);
      });
    });

    return unsubscribe;
  }, []);

  return (
    <section
      aria-label="terminal"
      className="rounded-2xl border border-black/20 bg-[#1c1c1e] text-white shadow-[0_15px_40px_rgba(0,0,0,0.15)]"
    >
      <header className="flex items-center justify-between rounded-t-2xl border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <TerminalDot color="#ff5f56" />
          <TerminalDot color="#ffbd2e" />
          <TerminalDot color="#27c93f" />
        </div>
        <span className="text-xs font-medium tracking-[0.2em] text-white/50">LOGS</span>
      </header>
      <div className="max-h-80 overflow-auto rounded-b-2xl px-4 py-4 font-mono text-xs leading-relaxed">
        {logs.length === 0 ? (
          <p className="text-white/40">waiting for logs…</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="whitespace-pre-wrap">
                <span className="text-white/35">{formatTime(log.timestamp)}</span>
                <span className="mx-2 text-white/20">|</span>
                <span className={log.level === "error" ? "text-[#ff6b81]" : "text-white/80"}>
                  {log.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TerminalDot({ color }: { color: string }) {
  return <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />;
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}
