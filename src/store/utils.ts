import type { LogEntry, Feedback } from "../types";

export const addLog = (currentLog: LogEntry[], message: string, type: LogEntry["type"] = "system"): LogEntry[] => {
  return [...currentLog, { id: Date.now() + Math.random(), text: message, type }];
};

export const getFeedback = (message: string, type: LogEntry["type"] = "system"): Feedback | null => {
  if (type === "room-title" || type === "room-description" || type === "narration") return null;
  return { message, type, id: Date.now() + Math.random() };
};
