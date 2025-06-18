import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

// 동적 렌더링 강제 설정
export const dynamic = "force-dynamic"

const execAsync = promisify(exec)

export async function GET() {
  try {
    console.log("Starting R-based minting analysis...")

    // R 스크립트 실행
    const rScriptPath = path.join(process.cwd(), "scripts", "generate-minting-charts.r")
    const command = `Rscript "${rScriptPath}"`

    console.log("Executing R script:", command)

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 60000, // 60초 타임아웃
    })

    if (stderr) {
      console.warn("R script warnings:", stderr)
    }

    console.log("R script output:", stdout)

    // R에서 생성된 JSON 결과 파일 읽기
    const resultsPath = path.join(process.cwd(), "public", "charts", "analysis_results.json")

    try {
      const resultsData = await fs.readFile(resultsPath, "utf-8")
      const results = JSON.parse(resultsData)

      return NextResponse.json({
        ...results,
        analysis_method: "R (ggplot2 + dplyr)",
        r_output: stdout,
        generated_at: new Date().toISOString(),
      })
    } catch (fileError) {
      console.error("Failed to read R results file:", fileError)
      throw new Error("R 분석 결과 파일을 읽을 수 없습니다.")
    }
  } catch (error) {
    console.error("R analysis error:", error)
    return NextResponse.json(
      {
        error: "R 분석 실행 중 오류가 발생했습니다: " + (error as Error).message,
        suggestion: "R이 설치되어 있고 필요한 패키지가 설치되어 있는지 확인해주세요.",
        install_command: "Rscript -e \"install.packages(c('ggplot2', 'dplyr', 'scales', 'lubridate', 'jsonlite'))\"",
      },
      { status: 500 },
    )
  }
}
