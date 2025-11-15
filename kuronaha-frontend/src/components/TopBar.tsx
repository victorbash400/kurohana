"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { getJson } from "@/lib/api";
import { pushTerminalEntry } from "@/lib/terminal";

type HealthResponse = {
  status?: string;
  engine_model_loaded?: boolean;
  engine_explainer_loaded?: boolean;
  naval_model_loaded?: boolean;
  naval_explainer_loaded?: boolean;
};

type StatusState = "checking" | "online" | "offline";
type StatusSnapshot = {
  api: StatusState;
  engine: StatusState;
  naval: StatusState;
};

const POLL_INTERVAL = 15000;

export function TopBar() {
  const [status, setStatus] = useState({
    api: "checking" as StatusState,
    engine: "checking" as StatusState,
    naval: "checking" as StatusState,
  });
  const previousStatus = useRef(status);

  useEffect(() => {
    let mounted = true;

    async function fetchSnapshot() {
      try {
        const response = await getJson<HealthResponse>("/health");
        if (!mounted) return;

        const nextStatus = {
          api: mapToState(normalizeApiStatus(response?.status)),
          engine: mapToState(
            Boolean(response?.engine_model_loaded && response?.engine_explainer_loaded)
          ),
          naval: mapToState(
            Boolean(response?.naval_model_loaded && response?.naval_explainer_loaded)
          ),
        } as const;

        if (mounted) {
          setStatus((current) => {
            const prev = current;
            queueTransitionLog(prev, nextStatus);
            previousStatus.current = nextStatus;
            return nextStatus;
          });
        }
      } catch {
        if (!mounted) return;
        setStatus((prev) => {
          const next = { ...prev, api: "offline" } as const;
          queueTransitionLog(previousStatus.current, next);
          previousStatus.current = next;
          return next;
        });
      }
    }

    fetchSnapshot();
    const id = setInterval(fetchSnapshot, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60">
            Predictive maintenance
          </p>
          <p className="text-lg font-semibold tracking-tight">Kurohana</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label="API" state={status.api} />
          <StatusBadge label="ENG" state={status.engine} />
          <StatusBadge label="NAV" state={status.naval} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, state }: { label: string; state: StatusState }) {
  const iconProps = getIconProps(state);
  const Icon = iconProps.icon;

  return (
    <span className={`flex items-center gap-1 rounded-full border border-white/25 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.18em] ${iconProps.color}`}>
      <Icon className={iconProps.iconClass} strokeWidth={2} />
      {label}
    </span>
  );
}

function queueTransitionLog(prev: StatusSnapshot, next: StatusSnapshot) {
  (Object.keys(prev) as Array<keyof StatusSnapshot>).forEach((key) => {
    const before = prev[key];
    const after = next[key];
    if (before === after) return;

    const scope = String(key).toUpperCase();
    if (after === "online") {
      queueMicrotask(() => pushTerminalEntry("info", `[health] ${scope} ready`));
    } else if (after === "offline") {
      queueMicrotask(() => pushTerminalEntry("error", `[health] ${scope} offline`));
    }
  });
}

function mapToState(value: boolean | null | undefined): StatusState {
  if (value === true) return "online";
  if (value === false) return "offline";
  return "checking";
}

function normalizeApiStatus(status?: string): boolean | null {
  if (!status) return null;
  const normalized = status.toLowerCase();
  if (["ok", "ready", "healthy", "online", "running"].some((token) => normalized.includes(token))) {
    return true;
  }
  if (["down", "error", "fail", "offline"].some((token) => normalized.includes(token))) {
    return false;
  }
  return null;
}

function getIconProps(state: StatusState) {
  switch (state) {
    case "online":
      return { icon: Check, color: "text-emerald-300", iconClass: "h-3.5 w-3.5" };
    case "offline":
      return { icon: X, color: "text-red-300", iconClass: "h-3.5 w-3.5" };
    default:
      return {
        icon: Loader2,
        color: "text-white/70",
        iconClass: "h-3.5 w-3.5 animate-spin",
      };
  }
}
