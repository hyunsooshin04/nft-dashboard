import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

// 동적 렌더링 강제 설정
export const dynamic = "force-dynamic"

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log("Installing R packages...")

    // R 패키지 설치 스크립트 실행
    const installCommand = `Rscript scripts/install-r-packages.r`

    const { stdout: installOutput, stderr: installError } = await execAsync(installCommand, {
      cwd: process.cwd(),
      timeout: 300000, // 5분 타임아웃
    })

    console.log("R package installation output:", installOutput)
    if (installError) {
      console.warn("R package installation warnings:", installError)
    }

    return NextResponse.json({
      success: true,
      message: "R 패키지가 성공적으로 설치되었습니다.",
      output: installOutput,
      warnings: installError || null,
    })
  } catch (error) {
    console.error("R package installation error:", error)
    return NextResponse.json(
      {
        error: "R 패키지 설치 중 오류가 발생했습니다: " + (error as Error).message,
        suggestion: "R이 시스템에 설치되어 있는지 확인해주세요.",
        install_r_ubuntu: "sudo apt-get install r-base r-base-dev",
        install_r_macos: "brew install r",
        install_r_windows: "https://cran.r-project.org/bin/windows/base/",
      },
      { status: 500 },
    )
  }
}
