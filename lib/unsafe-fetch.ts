import https from "https"
import http from "http"

// 전역적으로 HTTPS 인증서 검증 비활성화
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

// 커스텀 fetch 함수 (인증서 무시)
export async function unsafeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
    secureProtocol: "TLSv1_2_method",
  })

  const httpAgent = new http.Agent()

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...options.headers,
    },
    // @ts-ignore
    agent: url.startsWith("https:") ? httpsAgent : httpAgent,
  }

  try {
    return await fetch(url, fetchOptions)
  } catch (error) {
    console.error("Unsafe fetch error:", error)
    throw error
  }
}

// Node.js 환경에서 전역 fetch 오버라이드 (선택사항)
export function setupUnsafeFetch() {
  if (typeof window === "undefined") {
    // 서버 사이드에서만 실행
    const originalFetch = global.fetch
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" && input.startsWith("https:")) {
        return unsafeFetch(input, init)
      }
      return originalFetch(input, init)
    }
  }
}
