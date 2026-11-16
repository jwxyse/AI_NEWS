"use client";

import { SignInButton, useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { primaryButton } from "@/components/ui/button-styles";

// 로그인하지 않은 사용자에게 보여주는 화면. 들어오자마자 로그인 모달을 연다.
export function SignInGate() {
  const { loaded, openSignIn } = useClerk();
  const opened = useRef(false);

  useEffect(() => {
    if (loaded && !opened.current) {
      opened.current = true;
      openSignIn();
    }
  }, [loaded, openSignIn]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-fg">AI 뉴스 수집기</h1>
        <p className="text-fg-muted break-keep">
          해외 AI 뉴스를 한국어로 요약해 카드로 보여드려요.
          <br />
          로그인하고 시작하세요.
        </p>
      </div>
      <SignInButton mode="modal">
        <button className={primaryButton}>
          로그인
        </button>
      </SignInButton>
    </main>
  );
}
