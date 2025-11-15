export type TerminalLevel = "info" | "error";

export type TerminalEntry = {
  id: string;
  level: TerminalLevel;
  text: string;
  timestamp: number;
};

type Listener = (entry: TerminalEntry) => void;

const listeners = new Set<Listener>();
let counter = 0;

export function pushTerminalEntry(level: TerminalLevel, text: string) {
  const entry: TerminalEntry = {
    id: `${Date.now()}-${counter++}`,
    level,
    text,
    timestamp: Date.now(),
  };
  listeners.forEach((listener) => listener(entry));
  return entry;
}

export function subscribeTerminal(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
