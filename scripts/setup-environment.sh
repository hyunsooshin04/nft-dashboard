#!/bin/bash

echo "Setting up NFT Dashboard environment..."

# 1. CSV 데이터 다운로드
echo "Downloading CSV data..."
mkdir -p data
curl -o data/dune_minting.csv "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dune_minting-AHb2L2WJvcL8SLpX1yHyRIU3jBsxti.csv"

# 2. 차트 디렉토리 생성
echo "Creating charts directory..."
mkdir -p public/charts

# 3. R 패키지 설치
echo "Installing R packages..."
Rscript -e "
packages <- c('ggplot2', 'dplyr', 'scales', 'lubridate', 'jsonlite')
install.packages(packages, repos='https://cran.rstudio.com/')
"

# 4. Python 패키지 설치
echo "Installing Python packages..."
pip install fastapi uvicorn torch torchvision clip-by-openai pillow numpy psycopg2-binary

# 5. 초기 R 분석 실행
echo "Running initial R analysis..."
Rscript scripts/generate-minting-charts.r

echo "Environment setup complete!"
echo "Next steps:"
echo "1. Start CLIP service: python scripts/clip-service.py"
echo "2. Start Next.js app: npm run dev"
