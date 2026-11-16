// ui.md 4.6 버튼 스타일. 같은 클래스 묶음을 한 곳에서 관리한다.
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const base = `inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const primaryButton = `${base} h-10 bg-primary px-4 text-primary-fg hover:bg-primary-hover disabled:hover:bg-primary`;

export const secondaryButton = `${base} h-10 border border-border bg-surface px-4 text-fg hover:bg-surface-muted disabled:hover:bg-surface`;

export const secondaryButtonSm = `${base} h-8 border border-border bg-surface px-3 text-fg hover:bg-surface-muted disabled:hover:bg-surface`;

export { focusRing };
