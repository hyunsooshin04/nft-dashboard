#!/usr/bin/env Rscript

# NFT Minting Data Analysis and Visualization
# 서버에서 직접 실행되는 R 스크립트

# 필요한 라이브러리 로드
suppressMessages({
  if (!require(ggplot2)) install.packages("ggplot2", quiet = TRUE)
  if (!require(dplyr)) install.packages("dplyr", quiet = TRUE)
  if (!require(scales)) install.packages("scales", quiet = TRUE)
  if (!require(lubridate)) install.packages("lubridate", quiet = TRUE)
  if (!require(jsonlite)) install.packages("jsonlite", quiet = TRUE)
  
  library(ggplot2)
  library(dplyr)
  library(scales)
  library(lubridate)
  library(jsonlite)
})

cat("=== NFT Minting Analysis Started ===\n")

# 데이터 파일 경로
data_file <- "data/dune_minting.csv"

# 데이터 로드
if (!file.exists(data_file)) {
  stop("Data file not found: ", data_file)
}

data <- read.csv(data_file, stringsAsFactors = FALSE)
cat("Data loaded:", nrow(data), "rows\n")

# 데이터 전처리
data$date <- as.Date(data$date)
data$mint_count <- as.numeric(data$mint_count)

# NA 값 제거
data <- data[complete.cases(data), ]
cat("After cleaning:", nrow(data), "rows\n")

# 기본 통계 계산
total_mints <- sum(data$mint_count)
avg_daily_mints <- mean(data$mint_count)
median_daily_mints <- median(data$mint_count)
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
}

# 1. 메인 트렌드 차트
cat("\nGenerating main trend chart...\n")
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
    caption = "Data source: Dune Analytics"
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

# 2. 히스토그램
cat("Generating histogram...\n")
histogram_plot <- ggplot(data, aes(x = mint_count)) +
  geom_histogram(bins = 20, fill = "#3b82f6", alpha = 0.7, color = "white") +
  geom_vline(xintercept = avg_daily_mints, color = "#ef4444", linetype = "dashed", size = 1) +
  labs(
    title = "Distribution of Daily Mint Counts",
    subtitle = paste("Red line shows average:", round(avg_daily_mints, 1), "mints/day"),
    x = "Daily Mint Count",
    y = "Frequency (Days)"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
    plot.subtitle = element_text(size = 12, color = "gray60", hjust = 0.5)
  )

ggsave("public/charts/minting_histogram.png", plot = histogram_plot, width = 12, height = 8, dpi = 300)

# 3. 주간 집계 차트
cat("Generating weekly chart...\n")
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
    y = "Weekly Mint Count"
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

# 4. 박스플롯 (월별)
cat("Generating monthly boxplot...\n")
data$month <- floor_date(data$date, "month")
monthly_plot <- ggplot(data, aes(x = factor(format(month, "%Y-%m")), y = mint_count)) +
  geom_boxplot(fill = "#3b82f6", alpha = 0.7) +
  labs(
    title = "Monthly Distribution of Daily Mint Counts",
    subtitle = "Box plots showing monthly variations",
    x = "Month",
    y = "Daily Mint Count"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
    plot.subtitle = element_text(size = 12, color = "gray60", hjust = 0.5),
    axis.text.x = element_text(angle = 45, hjust = 1)
  )

ggsave("public/charts/monthly_boxplot.png", plot = monthly_plot, width = 12, height = 8, dpi = 300)

# JSON 결과 생성
results <- list(
  summary = list(
    total_mints = total_mints,
    avg_daily_mints = round(avg_daily_mints, 2),
    median_daily_mints = median_daily_mints,
    peak_day = as.character(peak_day$date),
    peak_count = peak_day$mint_count,
    data_period_start = as.character(min(data$date)),
    data_period_end = as.character(max(data$date)),
    total_days = nrow(data)
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
  )
)

# JSON 파일로 저장
write_json(results, "public/charts/analysis_results.json", pretty = TRUE)

cat("\n=== Analysis Complete ===\n")
cat("Charts saved to public/charts/ directory:\n")
cat("- minting_trends.png: Main trend analysis\n")
cat("- minting_histogram.png: Distribution analysis\n") 
cat("- weekly_minting.png: Weekly aggregation\n")
cat("- monthly_boxplot.png: Monthly distribution\n")
cat("- analysis_results.json: Analysis results\n")
