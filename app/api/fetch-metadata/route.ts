import {type NextRequest, NextResponse} from "next/server";
import https from "https";

// HTTPS 인증서 검증을 완전히 비활성화
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

export async function GET(request: NextRequest) {
    try {
        const {searchParams} = new URL(request.url);
        const url = searchParams.get("url");

        if (!url) {
            return NextResponse.json({error: "URL이 제공되지 않았습니다."}, {status: 400});
        }

        console.log("Fetching metadata from:", url);

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
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                Referer: "https://google.com/",
            },
            // @ts-ignore - Next.js에서 agent 사용
            agent: url.startsWith("https:") ? httpsAgent : undefined,
        };

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
            const data = await response.json();
            return NextResponse.json(data);
        } else {
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                return NextResponse.json(data);
            } catch {
                return NextResponse.json(
                    {
                        error: "응답이 유효한 JSON이 아닙니다.",
                        raw_response: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
                        content_type: contentType,
                    },
                    {status: 400}
                );
            }
        }
    } catch (error) {
        console.error("Metadata fetch error:", error);
        return NextResponse.json(
            {
                error: "메타데이터를 가져오는데 실패했습니다: " + (error as Error).message,
                url: request.nextUrl.searchParams.get("url"),
                error_code: (error as any)?.code || "UNKNOWN",
            },
            {status: 500}
        );
    }
}
