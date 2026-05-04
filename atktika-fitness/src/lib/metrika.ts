// Yandex.Metrika reachGoal helper.
// Counter ID is read at build time from NEXT_PUBLIC_YM_ID; caller doesn't need to know it.
// Used for client-side conversion tracking: form_send, phone_click, tg_click и т.п.

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void;
  }
}

export const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!YM_ID) return;
  try {
    window.ym?.(Number(YM_ID), "reachGoal", goal, params);
  } catch {
    /* no-op: we never want analytics to break UX */
  }
}
