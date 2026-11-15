// Vercel 크론이 부르는 수집 시작 요청. GitHub Actions 의 '후보 수집' 워크플로를 실행시킨다.
// GitHub 자체 예약은 몇 시간씩 밀리는 일이 있어서, 시각은 Vercel 이 맞추고 실제 수집은 GitHub Actions 가 한다.
// 필요한 환경변수(Vercel):
//   CRON_SECRET            Vercel 이 크론 요청에 Authorization: Bearer 로 붙여 준다. 다른 사람이 이 주소를 불러도 실행되지 않게 한다.
//   GITHUB_DISPATCH_TOKEN  저장소 KimJin-Ian/japan 의 Actions 쓰기 권한만 가진 GitHub 토큰
import "server-only";

const REPO = "KimJin-Ian/japan";
const WORKFLOW = "collect.yml";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!secret || !token) return Response.json({ ok: false, error: "CRON_SECRET 또는 GITHUB_DISPATCH_TOKEN 이 설정되지 않았습니다" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ ok: false }, { status: 401 });

  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "japan-finds-cron" },
    body: JSON.stringify({ ref: "main" }),
    cache: "no-store",
  });
  if (!res.ok) return Response.json({ ok: false, status: res.status, error: (await res.text()).slice(0, 200) }, { status: 502 });
  return Response.json({ ok: true, started: WORKFLOW });
}
