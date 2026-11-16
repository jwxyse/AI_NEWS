import { Show, UserButton } from "@clerk/nextjs";

export function AppHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
      <span className="font-semibold">AI 뉴스 요약</span>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  );
}
