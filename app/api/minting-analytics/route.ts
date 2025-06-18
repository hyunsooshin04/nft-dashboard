import { NextResponse } from "next/server"

// JavaScript로 차트 데이터 분석 (R 대신)
async function analyzeCSVData() {
  try {
    // CSV 데이터 로드
    const csvUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dune_minting-AHb2L2WJvcL8SLpX1yHyRIU3jBsxti.csv"
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    // CSV 파싱
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",")

    const data = lines.slice(1).map((line) => {
      const values = line.split(",")
      return {
        date: values[0],
        mint_count: Number.parseInt(values[1]) || 0,
      }
    })

    // 통계 계산
    const totalMints = data.reduce((sum, row) => sum + row.mint_count, 0)
    const avgDailyMints = totalMints / data.length
    const medianDailyMints = [...data].sort((a, b) => a.mint_count - b.mint_count)[Math.floor(data.length / 2)]
      .mint_count
    const maxMints = Math.max(...data.map((d) => d.mint_count))
    const minMints = Math.min(...data.map((d) => d.mint_count))

    // 피크 데이 찾기
    const peakDay = data.reduce((max, row) => (row.mint_count > max.mint_count ? row : max))

    // 트렌드 분석
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))

    const firstHalfAvg = firstHalf.reduce((sum, row) => sum + row.mint_count, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, row) => sum + row.mint_count, 0) / secondHalf.length

    const trendChangePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

    let trendAnalysis = ""
    if (trendChangePercent > 10) {
      trendAnalysis = "Strong Upward - Minting activity increased significantly"
    } else if (trendChangePercent > 0) {
      trendAnalysis = "Slight Upward - Minting activity increased moderately"
    } else if (trendChangePercent < -10) {
      trendAnalysis = "Strong Downward - Minting activity decreased significantly"
    } else if (trendChangePercent < 0) {
      trendAnalysis = "Slight Downward - Minting activity decreased moderately"
    } else {
      trendAnalysis = "Stable - Minting activity remained consistent"
    }

    return {
      summary: {
        total_mints: totalMints,
        avg_daily_mints: Math.round(avgDailyMints * 100) / 100,
        median_daily_mints: medianDailyMints,
        peak_day: peakDay.date,
        peak_count: peakDay.mint_count,
        data_period_start: data[0].date,
        data_period_end: data[data.length - 1].date,
        total_days: data.length,
        max_mints: maxMints,
        min_mints: minMints,
      },
      trend_analysis: trendAnalysis,
      trend_change_percent: Math.round(trendChangePercent * 100) / 100,
      chart_data: data,
      generated_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("CSV analysis error:", error)
    throw error
  }
}

export async function GET() {
  try {
    console.log("Starting JavaScript-based analysis (R alternative)...")

    const results = await analyzeCSVData()

    return NextResponse.json({
      ...results,
      analysis_method: "JavaScript (R alternative)",
      note: "Charts generated using JavaScript instead of R",
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      {
        error: "분석 실행 중 오류가 발생했습니다: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
