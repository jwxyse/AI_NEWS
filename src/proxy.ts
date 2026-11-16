import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 로그인하지 않아도 열리는 경로. "/"는 로그인 안 한 사용자에게 로그인 모달을 띄운다.
const isPublicRoute = createRouteMatcher(["/"]);
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId } = await auth();
  if (userId) return;

  if (isApiRoute(req)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  // 다른 페이지는 로그인 모달이 뜨는 첫 화면으로 보낸다.
  return NextResponse.redirect(new URL("/", req.url));
});

export const config = {
  matcher: [
    // Next.js 내부 파일과 정적 파일은 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API 라우트는 항상 실행
    "/(api|trpc)(.*)",
  ],
};
