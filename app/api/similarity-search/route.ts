import { type NextRequest, NextResponse } from "next/server"

// 동적 렌더링 강제 설정
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting similarity search...")

    const formData = await request.formData()
    const image = formData.get("image") as File
    const threshold = Number.parseFloat((formData.get("threshold") as string) || "0.8")

    if (!image) {
      return NextResponse.json({ error: "이미지가 제공되지 않았습니다." }, { status: 400 })
    }

    console.log(`Image received: ${image.name}, size: ${image.size} bytes`)
    console.log(`Similarity threshold: ${threshold}`)

    // 이미지를 Python CLIP 서비스로 전송
    const pythonServiceUrl = process.env.CLIP_SERVICE_URL || "http://localhost:8000"

    const searchFormData = new FormData()
    searchFormData.append("image", image)
    searchFormData.append("threshold", threshold.toString())

    console.log("Sending request to Python CLIP service...")
    const response = await fetch(`${pythonServiceUrl}/search-similar-nfts`, {
      method: "POST",
      body: searchFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("CLIP service error:", errorText)
      throw new Error(`CLIP 서비스 오류: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log(`Search completed: ${result.results?.length || 0} similar NFTs found`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Similarity search error:", error)
    return NextResponse.json(
      {
        error: "검색 중 오류가 발생했습니다: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
