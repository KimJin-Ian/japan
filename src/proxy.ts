// 관리자 화면(/admin) 보호.
// ADMIN_USER · ADMIN_PASSWORD 환경변수로 HTTP Basic 인증을 건다.
// 값이 없으면: 개발 서버에서는 열어 두고, 배포 환경에서는 404로 숨긴다.
// Phase 2에서 Supabase Auth(관리자 역할)로 바꾼다.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("Not Found", { status: 404 });
  }

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const [u, ...rest] = atob(header.slice(6)).split(":");
    if (u === user && rest.join(":") === pass) return NextResponse.next();
  }
  return new NextResponse("인증이 필요합니다", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="JAPAN FINDS admin", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/admin/:path*"] };
