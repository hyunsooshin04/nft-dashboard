#!/bin/bash

# CLIP 서비스 시작 스크립트

echo "Starting CLIP Feature Extraction Service..."

# Python 가상환경 활성화 (선택사항)
# source venv/bin/activate

# 필요한 패키지 설치
echo "Installing required packages..."
pip install fastapi uvicorn torch torchvision clip-by-openai pillow numpy

# CLIP 서비스 시작
echo "Starting service on port 8000..."
python scripts/clip-service.py

echo "CLIP service is running at http://localhost:8000"
