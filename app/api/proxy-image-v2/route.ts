import { type NextRequest, NextResponse } from "next/server"
import { unsafeFetch } from "@/lib/unsafe-fetch"

// 동적 렌더링 강제 설정
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("url")

    if (!imageUrl) {
      return NextResponse.json({ error: "이미지 URL이 제공되지 않았습니다." }, { status: 400 })
    }

    console.log("Proxying image from:", imageUrl)

    const response = await unsafeFetch(imageUrl, {
      headers: {
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://google.com/",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type") || "image/png"
    const imageBuffer = await response.arrayBuffer()

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Image proxy v2 error:", error)

    // SVG 플레이스홀더 반환
    const errorSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#fee2e2" stroke="#fca5a5" stroke-width="2"/>
        <text x="100" y="80" text-anchor="middle" fill="#dc2626" font-family="Arial" font-size="16" font-weight="bold">
          ⚠️ 로드 실패
        </text>
        <text x="100" y="105" text-anchor="middle" fill="#7f1d1d" font-family="Arial" font-size="12">
          인증서 오류
        </text>
        <text x="100" y="125" text-anchor="middle" fill="#991b1b" font-family="Arial" font-size="10">
          ${(error as Error).message.slice(0, 30)}...
        </text>
      </svg>
    `

    return new NextResponse(errorSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    })
  }
}
