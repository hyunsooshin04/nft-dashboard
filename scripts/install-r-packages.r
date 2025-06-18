#!/usr/bin/env Rscript

# R 패키지 설치 스크립트
# 필요한 모든 패키지를 자동으로 설치합니다.

cat("=== R 패키지 설치 시작 ===\n")

# CRAN 미러 설정
options(repos = c(CRAN = "https://cran.rstudio.com/"))

# 필요한 패키지 목록
required_packages <- c(
  "ggplot2",      # 그래프 생성
  "dplyr",        # 데이터 조작
  "scales",       # 스케일 및 포맷팅
  "lubridate",    # 날짜/시간 처리
  "jsonlite",     # JSON 처리
  "readr",        # CSV 읽기
  "tidyr",        # 데이터 정리
  "zoo"           # 이동평균
)

# 패키지 설치 함수
install_if_missing <- function(package_name) {
  if (!require(package_name, character.only = TRUE, quietly = TRUE)) {
    cat("Installing package:", package_name, "\n")
    install.packages(package_name, dependencies = TRUE, quiet = FALSE)
    
    # 설치 확인
    if (require(package_name, character.only = TRUE, quietly = TRUE)) {
      cat("✓ Successfully installed:", package_name, "\n")
    } else {
      cat("✗ Failed to install:", package_name, "\n")
      return(FALSE)
    }
  } else {
    cat("✓ Already installed:", package_name, "\n")
  }
  return(TRUE)
}

# 모든 패키지 설치
success_count <- 0
for (pkg in required_packages) {
  if (install_if_missing(pkg)) {
    success_count <- success_count + 1
  }
}

cat("\n=== 설치 완료 ===\n")
cat("성공:", success_count, "/", length(required_packages), "패키지\n")

if (success_count == length(required_packages)) {
  cat("모든 R 패키지가 성공적으로 설치되었습니다!\n")
} else {
  cat("일부 패키지 설치에 실패했습니다. 수동으로 설치해주세요.\n")
  quit(status = 1)
}
