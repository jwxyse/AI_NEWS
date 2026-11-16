import { Suspense } from "react";
import { redirect } from "next/navigation";
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

  // 로그인한 사용자는 메인 화면인 대시보드로 보낸다.
  if (userId) redirect("/dashboard");

  return <SignInGate />;
}
