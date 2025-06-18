# NFT Minting Data Analysis Script
# This script analyzes the minting trends from the CSV data

# Load required libraries
if (!require(ggplot2)) install.packages("ggplot2")
if (!require(dplyr)) install.packages("dplyr")
if (!require(scales)) install.packages("scales")
if (!require(lubridate)) install.packages("lubridate")

library(ggplot2)
library(dplyr)
library(scales)
library(lubridate)

# Read the CSV data from URL
csv_url <- "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dune_minting-AHb2L2WJvcL8SLpX1yHyRIU3jBsxti.csv"
data <- read.csv(csv_url)

# Data preprocessing
data$date <- as.Date(data$date)
data$mint_count <- as.numeric(data$mint_count)

# Remove any NA values
data <- data[complete.cases(data), ]

# Basic statistics
total_mints <- sum(data$mint_count)
avg_daily_mints <- mean(data$mint_count)
median_daily_mints <- median(data$mint_count)
max_mints <- max(data$mint_count)
min_mints <- min(data$mint_count)

# Find peak day
peak_day <- data[which.max(data$mint_count), ]

# Print summary statistics
cat("=== NFT Minting Analysis Summary ===\n")
cat("Data Period:", min(data$date), "to", max(data$date), "\n")
cat("Total Days:", nrow(data), "\n")
cat("Total Mints:", total_mints, "\n")
cat("Average Daily Mints:", round(avg_daily_mints, 2), "\n")
cat("Median Daily Mints:", median_daily_mints, "\n")
cat("Maximum Daily Mints:", max_mints, "on", as.character(peak_day$date), "\n")
cat("Minimum Daily Mints:", min_mints, "\n")

# Create main trend plot
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

# Create histogram of daily mint counts
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

# Create weekly aggregation
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

# Save plots
ggsave("public/minting_trends.png", plot = main_plot, width = 14, height = 8, dpi = 300)
ggsave("public/minting_histogram.png", plot = histogram_plot, width = 12, height = 8, dpi = 300)
ggsave("public/weekly_minting.png", plot = weekly_plot, width = 14, height = 8, dpi = 300)

# Trend analysis
first_half <- data[1:floor(nrow(data)/2), ]
second_half <- data[(floor(nrow(data)/2)+1):nrow(data), ]

first_half_avg <- mean(first_half$mint_count)
second_half_avg <- mean(second_half$mint_count)

trend_change <- ((second_half_avg - first_half_avg) / first_half_avg) * 100

cat("\n=== Trend Analysis ===\n")
cat("First Half Average:", round(first_half_avg, 2), "mints/day\n")
cat("Second Half Average:", round(second_half_avg, 2), "mints/day\n")
cat("Trend Change:", round(trend_change, 2), "%\n")

if (trend_change > 10) {
  cat("Trend: Strong Upward - Minting activity increased significantly\n")
} else if (trend_change > 0) {
  cat("Trend: Slight Upward - Minting activity increased moderately\n")
} else if (trend_change < -10) {
  cat("Trend: Strong Downward - Minting activity decreased significantly\n")
} else if (trend_change < 0) {
  cat("Trend: Slight Downward - Minting activity decreased moderately\n")
} else {
  cat("Trend: Stable - Minting activity remained consistent\n")
}

# Calculate moving averages
data$ma_7 <- zoo::rollmean(data$mint_count, k = 7, fill = NA, align = "right")

cat("\n=== Analysis Complete ===\n")
cat("Charts saved to public/ directory\n")
cat("- minting_trends.png: Main trend analysis\n")
cat("- minting_histogram.png: Distribution analysis\n") 
cat("- weekly_minting.png: Weekly aggregation\n")
