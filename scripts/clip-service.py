#!/usr/bin/env python3
"""
CLIP Feature Extraction Service with Database Integration
FastAPI 서버로 이미지 특징점 추출 및 NFT 유사도 검색 서비스 제공
"""

import os
import io
import clip
import torch
import numpy as np
import psycopg2
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Dict, Any
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(title="CLIP Feature Extraction Service", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CLIP 모델 로드
print("Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)
print(f"CLIP model loaded on {device}")

# 데이터베이스 연결 설정
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '192.168.120.206'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'liam'),
    'password': os.getenv('DB_PASSWORD', '') # 뭘까용 ~?
}

def get_db_connection():
    """데이터베이스 연결 생성"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

def calculate_similarity(features1: np.ndarray, features2: np.ndarray) -> float:
    """코사인 유사도 계산"""
    # 벡터 정규화
    features1 = features1 / np.linalg.norm(features1)
    features2 = features2 / np.linalg.norm(features2)
    
    # 코사인 유사도 계산
    similarity = np.dot(features1, features2)
    return float(similarity)

def get_feature_comparison(features1: np.ndarray, features2: np.ndarray) -> Dict[str, Any]:
    """특징점 비교 분석"""
    # 차원별 유사도 계산
    dim_similarities = []
    for i in range(len(features1)):
        dim_sim = abs(features1[i] - features2[i])
        dim_similarities.append(float(dim_sim))
    
    # 상위 유사한 차원들 찾기
    sorted_dims = sorted(enumerate(dim_similarities), key=lambda x: x[1])
    top_similar_dims = sorted_dims[:20]  # 상위 20개 유사한 차원
    
    # 통계 계산
    mean_diff = float(np.mean(dim_similarities))
    std_diff = float(np.std(dim_similarities))
    
    return {
        "dimension_similarities": dim_similarities,
        "top_similar_dimensions": [{"dimension": dim, "difference": diff} for dim, diff in top_similar_dims],
        "mean_difference": mean_diff,
        "std_difference": std_diff,
        "total_dimensions": len(features1)
    }

@app.get("/")
async def root():
    return {
        "message": "CLIP Feature Extraction Service with Database Integration",
        "device": device,
        "model": "ViT-B/32",
        "database": f"{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    }

@app.get("/health")
async def health_check():
    """서비스 상태 확인"""
    try:
        # 데이터베이스 연결 테스트
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM nft_features")
        feature_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return {
            "status": "healthy",
            "device": device,
            "nft_features_count": feature_count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/extract-features")
async def extract_features(image: UploadFile = File(...)):
    """
    이미지에서 CLIP 특징점을 추출합니다.
    """
    try:
        # 이미지 파일 검증
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # 이미지 로드 및 전처리
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # CLIP 전처리 적용
        image_tensor = preprocess(pil_image).unsqueeze(0).to(device)
        
        # 특징점 추출
        with torch.no_grad():
            features = model.encode_image(image_tensor)
            features = features.cpu().numpy().astype(np.float32).flatten()
        
        return {
            "features": features.tolist(),
            "dimensions": len(features),
            "device": device
        }
        
    except Exception as e:
        logger.error(f"Feature extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")

@app.post("/search-similar-nfts")
async def search_similar_nfts(
    image: UploadFile = File(...),
    threshold: float = Form(0.8)
):
    """
    이미지를 업로드하여 유사한 NFT를 검색합니다.
    """
    try:
        logger.info(f"Starting NFT similarity search with threshold: {threshold}")
        
        # 이미지 파일 검증
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # 이미지에서 특징점 추출
        logger.info("Extracting features from uploaded image...")
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
        image_tensor = preprocess(pil_image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            query_features = model.encode_image(image_tensor)
            query_features = query_features.cpu().numpy().astype(np.float32).flatten()
        
        logger.info(f"Query features extracted: {len(query_features)} dimensions")
        
        # 데이터베이스에서 모든 NFT 특징점 조회 및 메타데이터 포함
        logger.info("Connecting to database...")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # NFT 특징점, 정보, 메타데이터를 함께 조회
        query = """
        SELECT 
            nf.nftid, 
            nf.features, 
            ni.contractaddress, 
            ni.tokenid, 
            ni.tokenurl, 
            ni.blocknumber,
            ni.createddate,
            nm.asseturl
        FROM nft_features nf
        JOIN nft_info ni ON nf.nftid = ni.nftid
        LEFT JOIN nft_metadata nm ON nf.nftid = nm.nftid
        ORDER BY nf.nftid
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        logger.info(f"Found {len(rows)} NFTs in database")
        
        similar_nfts = []
        processed_count = 0
        valid_feature_count = 0
        
        for row in rows:
            try:
                nft_id = row[0]
                features_bytes = row[1]
                contract_address = row[2]
                token_id = row[3]
                token_url = row[4]
                block_number = row[5]
                created_date = row[6]
                asset_url = row[7]  # nft_metadata 테이블의 asseturl
                
                # bytea를 numpy array로 변환
                if not features_bytes:
                    continue
                    
                features = np.frombuffer(features_bytes, dtype=np.float32)
                
                # 특징점 차원 확인
                if features.size != query_features.size:
                    logger.warning(f"Feature size mismatch for NFT ID {nft_id}: {features.size} != {query_features.size}")
                    continue
                
                valid_feature_count += 1
                
                # 유사도 계산
                similarity = calculate_similarity(query_features, features)
                
                if similarity >= threshold:
                    # 특징점 비교 분석 추가
                    feature_comparison = get_feature_comparison(query_features, features)
                    
                    similar_nfts.append({
                        "nftId": int(nft_id),
                        "similarity": round(float(similarity), 4),
                        "contractAddress": contract_address,
                        "tokenId": token_id,
                        "tokenUrl": token_url,
                        "blockNumber": int(block_number) if block_number else None,
                        "createdDate": created_date.strftime('%Y-%m-%d') if created_date else None,
                        "assetUrl": asset_url,  # NFT 이미지 URL 추가
                        "featureComparison": feature_comparison
                    })
                
                processed_count += 1
                
                # 진행상황 로그 (1000개마다)
                if processed_count % 1000 == 0:
                    logger.info(f"Processed {processed_count}/{len(rows)} NFTs")
                    
            except Exception as e:
                logger.error(f"Error processing NFT {row[0]}: {e}")
                continue
        
        cursor.close()
        conn.close()
        
        # 유사도 순으로 정렬 (높은 순)
        similar_nfts.sort(key=lambda x: x['similarity'], reverse=True)
        
        logger.info(f"Search completed: {len(similar_nfts)} similar NFTs found")
        
        return {
            "results": similar_nfts[:50],  # 상위 50개 결과만 반환
            "stats": {
                "total_processed": processed_count,
                "valid_features": valid_feature_count,
                "similar_found": len(similar_nfts),
                "threshold_used": threshold
            }
        }
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting CLIP service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
