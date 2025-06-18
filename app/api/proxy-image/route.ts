import {type NextRequest, NextResponse} from "next/server";
import https from "https";

// HTTPS 인증서 검증을 완전히 비활성화
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

export async function GET(request: NextRequest) {
    try {
        const {searchParams} = new URL(request.url);
        const imageUrl = searchParams.get("url");

        if (!imageUrl) {
            return NextResponse.json({error: "이미지 URL이 제공되지 않았습니다."}, {status: 400});
        }

        console.log("Proxying image from:", imageUrl);

        // 커스텀 HTTPS Agent로 모든 인증서 검증 비활성화
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined,
        });

        // fetch 옵션에 agent 설정
        const fetchOptions: RequestInit = {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                Referer: "https://google.com/",
            },
            // @ts-ignore - Next.js에서 agent 사용
            agent: imageUrl.startsWith("https:") ? httpsAgent : undefined,
        };

        const response = await fetch(imageUrl, fetchOptions);

        if (!response.ok) {
            console.error(`Image fetch failed: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "image/png";
        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600", // 1시간 캐시
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
            },
        });
    } catch (error) {
        console.error("Image proxy error:", error);

        // 에러 발생 시 기본 플레이스홀더 SVG 반환
        const placeholderSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f3f4f6"/>
        <text x="100" y="90" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">
          이미지를 불러올 수 없습니다
        </text>
        <text x="100" y="110" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">
          Image Load Failed
        </text>
        <text x="100" y="130" text-anchor="middle" fill="#d1d5db" font-family="Arial" font-size="10">
          Certificate Error
        </text>
      </svg>
    `;

        return new NextResponse(placeholderSvg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=300", // 5분 캐시
            },
        });
    }
}
