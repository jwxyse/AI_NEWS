import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { SignInGate } from "@/components/sign-in-gate";

export default function Home() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const { userId } = await auth();

  if (!userId) {
    return <SignInGate />;
  }

  // TODO: 뉴스 카드 화면 (FR-2 ~ FR-5)
  return (
    <main className="flex flex-1 items-center justify-center px-4 text-zinc-600 dark:text-zinc-400">
      아직 뉴스가 없어요. &apos;뉴스 가져오기&apos;를 눌러보세요.
    </main>
  );
}
