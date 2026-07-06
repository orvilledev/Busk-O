"use client";

import { Check, CloudOff, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { useSync } from "./sync-provider";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const { online, state, pending, syncNow } = useSync();

  const { icon, label, tone } = describe();

  function describe() {
    if (!online)
      return {
        icon: <CloudOff className="h-3.5 w-3.5" />,
        label: pending > 0 ? `Offline · ${pending} to sync` : "Offline",
        tone: "text-muted",
      };
    if (state === "syncing")
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        label: "Syncing…",
        tone: "text-muted",
      };
    if (state === "error")
      return {
        icon: <TriangleAlert className="h-3.5 w-3.5" />,
        label: "Sync failed",
        tone: "text-danger",
      };
    if (pending > 0)
      return {
        icon: <RefreshCw className="h-3.5 w-3.5" />,
        label: `${pending} pending`,
        tone: "text-accent",
      };
    return {
      icon: <Check className="h-3.5 w-3.5" />,
      label: "Synced",
      tone: "text-muted",
    };
  }

  return (
    <button
      onClick={() => syncNow(true)}
      title="Tap to sync now"
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-surface-2",
        tone,
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
