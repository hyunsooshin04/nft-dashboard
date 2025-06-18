#!/usr/bin/env Rscript

# NFT Minting Data Analysis and Visualization
# 서버에서 직접 실행되는 R 스크립트

cat("=== NFT Minting Analysis Started ===\n")
cat("R version:", R.version.string, "\n")

# 에러 처리 함수
safe_require <- function(package_name) {
  tryCatch({
    if (!require(package_name, character.only = TRUE, quietly = TRUE)) {
      cat("Installing missing package:", package_name, "\n")
      install.packages(package_name, repos = "https://cran.rstudio.com/", quiet = TRUE)
      library(package_name, character.only = TRUE)
    }
    return(TRUE)
  }, error = function(e) {
    cat("Error loading package", package_name, ":", e$message, "\n")
    return(FALSE)
  })
}

# 필요한 라이브러리 로드
required_packages <- c("ggplot2", "dplyr", "scales", "lubridate", "jsonlite", "zoo")
loaded_packages <- sapply(required_packages, safe_require)

if (!all(loaded_packages)) {
  stop("Required packages could not be loaded. Please install them manually.")
}

cat("All required packages loaded successfully\n")

# 데이터 파일 경로 (로컬 파일 우선 사용)
# 원하는 CSV 파일명으로 변경
data_file <- "data/dune_minting_data.csv"

# 데이터 로드 - 로컬 파일 우선, 없으면 다운로드
if (file.exists(data_file)) {
  cat("Using local CSV file:", data_file, "\n")
} else {
  # CSV 파일이 없으면 URL에서 다운로드
  cat("Local CSV file not found. Downloading from URL...\n")
  csv_url <- "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dune_minting-AHb2L2WJvcL8SLpX1yHyRIU3jBsxti.csv"
  
  tryCatch({
    # 데이터 디렉토리 생성
    if (!dir.exists("data")) {
      dir.create("data", recursive = TRUE)
      cat("Created data directory\n")
    }
    
    # CSV 다운로드
    download.file(csv_url, data_file, method = "auto", quiet = FALSE)
    cat("CSV file downloaded successfully to:", data_file, "\n")
  }, error = function(e) {
    stop("Failed to download CSV data: ", e$message)
  })
}

# CSV 데이터 읽기
tryCatch({
  data <- read.csv(data_file, stringsAsFactors = FALSE)
  cat("Data loaded from", data_file, ":", nrow(data), "rows\n")
  
  # 데이터 구조 확인
  cat("Data columns:", paste(names(data), collapse = ", "), "\n")
  cat("First few rows:\n")
  print(head(data, 3))
}, error = function(e) {
  stop("Failed to read CSV file: ", e$message)
})

# 데이터 전처리
tryCatch({
  # 컬럼명 확인 및 매핑 (필요시 수정)
  if ("your_date_column" %in% names(data)) {
    data$date <- as.Date(data$your_date_column)
  } else {
    data$date <- as.Date(data$date)
  }
  
  if ("your_count_column" %in% names(data)) {
    data$mint_count <- as.numeric(data$your_count_column)
  } else {
    data$mint_count <- as.numeric(data$mint_count)
  }
  
  # NA 값 제거
  data <- data[complete.cases(data), ]
  cat("After cleaning:", nrow(data), "rows\n")
  
  if (nrow(data) == 0) {
    stop("No valid data after cleaning")
  }
}, error = function(e) {
  stop("Data preprocessing failed: ", e$message)
})

# 기본 통계 계산 (변수명 수정)
total_mints <- sum(data$mint_count)
avg_daily_mints <- mean(data$mint_count)
median_daily_mints <- median(data$mint_count)  # 오타 수정: median_daily_mints
max_mints <- max(data$mint_count)
min_mints <- min(data$mint_count)

# 피크 데이 찾기
peak_day <- data[which.max(data$mint_count), ]

# 통계 출력
cat("\n=== Summary Statistics ===\n")
cat("Data Period:", as.character(min(data$date)), "to", as.character(max(data$date)), "\n")
cat("Total Days:", nrow(data), "\n")
cat("Total Mints:", format(total_mints, big.mark = ","), "\n")
cat("Average Daily Mints:", round(avg_daily_mints, 2), "\n")
cat("Median Daily Mints:", median_daily_mints, "\n")
cat("Peak Day:", as.character(peak_day$date), "with", peak_day$mint_count, "mints\n")

# 트렌드 분석
first_half <- data[1:floor(nrow(data)/2), ]
second_half <- data[(floor(nrow(data)/2)+1):nrow(data), ]

first_half_avg <- mean(first_half$mint_count)
second_half_avg <- mean(second_half$mint_count)
trend_change <- ((second_half_avg - first_half_avg) / first_half_avg) * 100

trend_analysis <- if (trend_change > 10) {
  "Strong Upward - Minting activity increased significantly"
} else if (trend_change > 0) {
  "Slight Upward - Minting activity increased moderately"
} else if (trend_change < -10) {
  "Strong Downward - Minting activity decreased significantly"
} else if (trend_change < 0) {
  "Slight Downward - Minting activity decreased moderately"
} else {
  "Stable - Minting activity remained consistent"
}

cat("\n=== Trend Analysis ===\n")
cat("First Half Average:", round(first_half_avg, 2), "mints/day\n")
cat("Second Half Average:", round(second_half_avg, 2), "mints/day\n")
cat("Trend Change:", round(trend_change, 2), "%\n")
cat("Trend:", trend_analysis, "\n")

# 차트 생성 디렉토리 확인
if (!dir.exists("public/charts")) {
  dir.create("public/charts", recursive = TRUE)
  cat("Created charts directory\n")
}

# 1. 메인 트렌드 차트
cat("\nGenerating main trend chart...\n")
tryCatch({
  main_plot <- ggplot(data, aes(x = date, y = mint_count)) +
    geom_line(color = "#3b82f6", size = 1.2, alpha = 0.8) +
    geom_point(color = "#1e40af", size = 2, alpha = 0.6) +
    geom_smooth(method = "loess", se = TRUE, color = "#ef4444", alpha = 0.3, size = 1) +
    labs(
      title = "NFT Minting Activity Over Time",
      subtitle = paste("Total mints:", format(total_mints, big.mark = ","), 
                       "| Daily average:", round(avg_daily_mints, 1)),
      x = "Date",
      y = "Daily Mint Count",
      caption = "Generated by R ggplot2 | Data source: Dune Analytics"
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(size = 18, face = "bold", hjust = 0.5),
      plot.subtitle = element_text(size = 14, color = "gray60", hjust = 0.5),
      plot.caption = element_text(size = 10, color = "gray50"),
      axis.text.x = element_text(angle = 45, hjust = 1, size = 10),
      axis.text.y = element_text(size = 10),
      axis.title = element_text(size = 12, face = "bold"),
      panel.grid.minor = element_blank(),
      panel.grid.major = element_line(alpha = 0.3)
    ) +
    scale_x_date(date_labels = "%m/%d", date_breaks = "1 week") +
    scale_y_continuous(labels = comma_format())

  ggsave("public/charts/minting_trends.png", plot = main_plot, width = 14, height = 8, dpi = 300)
  cat("✓ Main trend chart saved\n")
}, error = function(e) {
  cat("✗ Failed to generate main trend chart:", e$message, "\n")
})

# 2. 히스토그램
cat("Generating histogram...\n")
tryCatch({
  histogram_plot <- ggplot(data, aes(x = mint_count)) +
    geom_histogram(bins = 20, fill = "#3b82f6", alpha = 0.7, color = "white") +
    geom_vline(xintercept = avg_daily_mints, color = "#ef4444", linetype = "dashed", size = 1) +
    labs(
      title = "Distribution of Daily Mint Counts",
      subtitle = paste("Red line shows average:", round(avg_daily_mints, 1), "mints/day"),
      x = "Daily Mint Count",
      y = "Frequency (Days)",
      caption = "Generated by R ggplot2"
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
      plot.subtitle = element_text(size = 12, color = "gray60", hjust = 0.5)
    )

  ggsave("public/charts/minting_histogram.png", plot = histogram_plot, width = 12, height = 8, dpi = 300)
  cat("✓ Histogram saved\n")
}, error = function(e) {
  cat("✗ Failed to generate histogram:", e$message, "\n")
})

# 3. 주간 집계 차트
cat("Generating weekly chart...\n")
tryCatch({
  data$week <- floor_date(data$date, "week")
  weekly_data <- data %>%
    group_by(week) %>%
    summarise(weekly_mints = sum(mint_count), .groups = 'drop')

  weekly_plot <- ggplot(weekly_data, aes(x = week, y = weekly_mints)) +
    geom_col(fill = "#3b82f6", alpha = 0.8) +
    geom_smooth(method = "loess", se = TRUE, color = "#ef4444", alpha = 0.3) +
    labs(
      title = "Weekly NFT Minting Totals",
      subtitle = "Aggregated weekly minting activity",
      x = "Week",
      y = "Weekly Mint Count",
      caption = "Generated by R ggplot2"
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
      plot.subtitle = element_text(size = 12, color = "gray60", hjust = 0.5),
      axis.text.x = element_text(angle = 45, hjust = 1)
    ) +
    scale_x_date(date_labels = "%m/%d", date_breaks = "1 week") +
    scale_y_continuous(labels = comma_format())

  ggsave("public/charts/weekly_minting.png", plot = weekly_plot, width = 14, height = 8, dpi = 300)
  cat("✓ Weekly chart saved\n")
}, error = function(e) {
  cat("✗ Failed to generate weekly chart:", e$message, "\n")
})

# 4. 박스플롯 (월별)
cat("Generating monthly boxplot...\n")
tryCatch({
  data$month <- floor_date(data$date, "month")
  monthly_plot <- ggplot(data, aes(x = factor(format(month, "%Y-%m")), y = mint_count)) +
    geom_boxplot(fill = "#3b82f6", alpha = 0.7) +
    labs(
      title = "Monthly Distribution of Daily Mint Counts",
      subtitle = "Box plots showing monthly variations",
      x = "Month",
      y = "Daily Mint Count",
      caption = "Generated by R ggplot2"
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
      plot.subtitle = element_text(size = 12, color = "gray60", hjust = 0.5),
      axis.text.x = element_text(angle = 45, hjust = 1)
    )

  ggsave("public/charts/monthly_boxplot.png", plot = monthly_plot, width = 12, height = 8, dpi = 300)
  cat("✓ Monthly boxplot saved\n")
}, error = function(e) {
  cat("✗ Failed to generate monthly boxplot:", e$message, "\n")
})

# 이동평균 계산
if (nrow(data) >= 7) {
  data$ma_7 <- zoo::rollmean(data$mint_count, k = 7, fill = NA, align = "right")
}

# JSON 결과 생성 (Next.js API와 호환)
results <- list(
  summary = list(
    total_mints = as.numeric(total_mints),
    avg_daily_mints = round(avg_daily_mints, 2),
    median_daily_mints = as.numeric(median_daily_mints),
    peak_day = as.character(peak_day$date),
    peak_count = as.numeric(peak_day$mint_count),
    data_period_start = as.character(min(data$date)),
    data_period_end = as.character(max(data$date)),
    total_days = nrow(data),
    max_mints = as.numeric(max_mints),
    min_mints = as.numeric(min_mints)
  ),
  trend_analysis = trend_analysis,
  trend_change_percent = round(trend_change, 2),
  charts = list(
    main_trend = "/charts/minting_trends.png",
    histogram = "/charts/minting_histogram.png",
    weekly = "/charts/weekly_minting.png",
    monthly_boxplot = "/charts/monthly_boxplot.png"
  ),
  chart_data = data.frame(
    date = as.character(data$date),
    mint_count = data$mint_count
  ),
  r_info = list(
    r_version = R.version.string,
    packages_used = required_packages,
    generated_at = Sys.time()
  )
)

# JSON 파일로 저장
tryCatch({
  write_json(results, "public/charts/analysis_results.json", pretty = TRUE, auto_unbox = TRUE)
  cat("✓ JSON results saved\n")
}, error = function(e) {
  cat("✗ Failed to save JSON results:", e$message, "\n")
})

cat("\n=== Analysis Complete ===\n")
cat("Charts saved to public/charts/ directory:\n")
cat("- minting_trends.png: Main trend analysis\n")
cat("- minting_histogram.png: Distribution analysis\n") 
cat("- weekly_minting.png: Weekly aggregation\n")
cat("- monthly_boxplot.png: Monthly distribution\n")
cat("- analysis_results.json: Analysis results\n")
cat("Generated by R", R.version.string, "\n")
