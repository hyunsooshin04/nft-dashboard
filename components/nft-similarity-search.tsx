"use client";

import type React from "react";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Slider} from "@/components/ui/slider";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {Search, Loader2, ImageIcon, AlertCircle, CheckCircle, Database, Eye, FileText} from "lucide-react";
import {toast} from "@/hooks/use-toast";
import FeatureComparisonModal from "./feature-comparison-modal";
import MetadataModal from "./metadata-modal";

interface FeatureComparison {
    dimension_similarities: number[];
    top_similar_dimensions: Array<{dimension: number; difference: number}>;
    mean_difference: number;
    std_difference: number;
    total_dimensions: number;
}

interface SimilarNFT {
    nftId: number;
    similarity: number;
    contractAddress?: string;
    tokenId?: string;
    tokenUrl?: string;
    blockNumber?: number;
    createdDate?: string;
    assetUrl?: string; // NFT 이미지 URL 추가
    featureComparison: FeatureComparison;
}

interface SearchStats {
    total_processed: number;
    valid_features: number;
    similar_found: number;
    threshold_used: number;
}

export default function NFTSimilaritySearch() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [similarityThreshold, setSimilarityThreshold] = useState([0.8]);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SimilarNFT[]>([]);
    const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [searchProgress, setSearchProgress] = useState(0);
    const [selectedNFT, setSelectedNFT] = useState<SimilarNFT | null>(null);
    const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
    const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // 파일 크기 체크 (10MB 제한)
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "파일 크기 초과",
                    description: "이미지 파일은 10MB 이하여야 합니다.",
                    variant: "destructive",
                });
                return;
            }

            // 이미지 파일 형식 체크
            if (!file.type.startsWith("image/")) {
                toast({
                    title: "잘못된 파일 형식",
                    description: "이미지 파일만 업로드할 수 있습니다.",
                    variant: "destructive",
                });
                return;
            }

            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setResults([]); // 이전 결과 초기화
            setSearchStats(null);
        }
    };

    const handleSearch = async () => {
        if (!selectedFile) {
            toast({
                title: "이미지를 선택해주세요",
                description: "유사한 NFT를 검색하려면 이미지를 먼저 선택해주세요.",
                variant: "destructive",
            });
            return;
        }

        setIsSearching(true);
        setSearchProgress(0);

        try {
            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("threshold", similarityThreshold[0].toString());

            // 진행률 시뮬레이션
            const progressInterval = setInterval(() => {
                setSearchProgress((prev) => Math.min(prev + 10, 90));
            }, 500);

            const response = await fetch("/api/similarity-search", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);
            setSearchProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "검색에 실패했습니다");
            }

            const data = await response.json();
            setResults(data.results || []);
            setSearchStats(data.stats || null);

            toast({
                title: "검색 완료",
                description: `${data.results?.length || 0}개의 유사한 NFT를 찾았습니다`,
            });
        } catch (error) {
            console.error("Search error:", error);
            toast({
                title: "검색 실패",
                description: (error as Error).message || "검색 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsSearching(false);
            setTimeout(() => setSearchProgress(0), 1000);
        }
    };

    const handleViewFeatures = (nft: SimilarNFT) => {
        setSelectedNFT(nft);
        setIsFeatureModalOpen(true);
    };

    const handleViewMetadata = (nft: SimilarNFT) => {
        setSelectedNFT(nft);
        setIsMetadataModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="image-upload">이미지 업로드</Label>
                        <div className="mt-2">
                            <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="cursor-pointer"
                                disabled={isSearching}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">지원 형식: JPG, PNG, GIF (최대 10MB)</p>
                    </div>

                    <div className="space-y-2">
                        <Label>유사도 임계값: {similarityThreshold[0].toFixed(2)}</Label>
                        <Slider
                            value={similarityThreshold}
                            onValueChange={setSimilarityThreshold}
                            max={1}
                            min={0.5}
                            step={0.01}
                            className="w-full"
                            disabled={isSearching}
                        />
                        <p className="text-sm text-muted-foreground">높은 값일수록 더 유사한 결과만 반환됩니다</p>
                    </div>

                    <Button onClick={handleSearch} disabled={!selectedFile || isSearching} className="w-full" size="lg">
                        {isSearching ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                검색 중...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                유사한 NFT 찾기
                            </>
                        )}
                    </Button>

                    {/* Progress Bar */}
                    {isSearching && (
                        <div className="space-y-2">
                            <Progress value={searchProgress} className="w-full" />
                            <p className="text-sm text-center text-muted-foreground">
                                데이터베이스에서 NFT를 검색하고 있습니다...
                            </p>
                        </div>
                    )}
                </div>

                {/* Preview */}
                <div className="space-y-4">
                    <Label>이미지 미리보기</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[200px] flex items-center justify-center">
                        {previewUrl ? (
                            <div className="space-y-2">
                                <img
                                    src={previewUrl || "/placeholder.svg"}
                                    alt="Preview"
                                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                                />
                                <p className="text-sm text-muted-foreground">
                                    {selectedFile?.name} ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="text-gray-500">이미지를 선택해주세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Stats */}
            {searchStats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            검색 통계
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{searchStats.total_processed}</div>
                                <div className="text-muted-foreground">처리된 NFT</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{searchStats.valid_features}</div>
                                <div className="text-muted-foreground">유효한 특징점</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{searchStats.similar_found}</div>
                                <div className="text-muted-foreground">유사 NFT 발견</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {(searchStats.threshold_used * 100).toFixed(0)}%
                                </div>
                                <div className="text-muted-foreground">사용된 임계값</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results Section */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            유사한 NFT 발견 ({results.length}개)
                        </h3>
                        <Badge variant="outline">{similarityThreshold[0].toFixed(2)} 이상 유사도</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((nft) => (
                            <Card key={nft.nftId} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-sm">NFT #{nft.nftId}</CardTitle>
                                        <Badge
                                            variant={nft.similarity >= 0.9 ? "default" : "secondary"}
                                            className={nft.similarity >= 0.9 ? "bg-green-600" : ""}
                                        >
                                            {(nft.similarity * 100).toFixed(1)}% 일치
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* NFT 이미지 표시 - 프록시를 통해 로드 */}
                                    {nft.assetUrl && (
                                        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={`/api/proxy-image?url=${encodeURIComponent(nft.assetUrl)}`}
                                                alt={`NFT #${nft.nftId}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                onError={(e) => {
                                                    // 이미지 로드 실패 시 플레이스홀더 표시
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/placeholder.svg?height=200&width=200";
                                                    target.alt = "이미지를 불러올 수 없습니다";
                                                }}
                                                onClick={() =>
                                                    window.open(
                                                        `/api/proxy-image?url=${encodeURIComponent(nft.assetUrl!)}`,
                                                        "_blank"
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* NFT 정보 */}
                                    <div className="space-y-1">
                                        {nft.contractAddress && (
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium">컨트랙트:</span>
                                                <code className="ml-1 bg-gray-100 px-1 rounded">
                                                    {nft.contractAddress.slice(0, 10)}...
                                                </code>
                                            </p>
                                        )}
                                        {nft.tokenId && (
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium">토큰 ID:</span> {nft.tokenId}
                                            </p>
                                        )}
                                        {nft.blockNumber && (
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium">블록:</span>{" "}
                                                {nft.blockNumber.toLocaleString()}
                                            </p>
                                        )}
                                        {nft.createdDate && (
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium">생성일:</span> {nft.createdDate}
                                            </p>
                                        )}
                                    </div>

                                    {/* 액션 버튼들 */}
                                    <div className="flex gap-2 mt-3">
                                        {nft.tokenUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleViewMetadata(nft)}
                                            >
                                                <FileText className="mr-1 h-3 w-3" />
                                                메타데이터
                                            </Button>
                                        )}
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleViewFeatures(nft)}
                                        >
                                            <Eye className="mr-1 h-3 w-3" />
                                            특징점 비교
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {!isSearching && results.length === 0 && searchStats && (
                <Card>
                    <CardContent className="text-center py-8">
                        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">유사한 NFT를 찾지 못했습니다</h3>
                        <p className="text-muted-foreground mb-4">
                            임계값을 낮춰서 다시 시도해보세요 (현재: {similarityThreshold[0].toFixed(2)})
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSimilarityThreshold([Math.max(0.5, similarityThreshold[0] - 0.1)])}
                        >
                            임계값 낮추기 ({Math.max(0.5, similarityThreshold[0] - 0.1).toFixed(2)})
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Feature Comparison Modal */}
            {selectedNFT && (
                <FeatureComparisonModal
                    isOpen={isFeatureModalOpen}
                    onClose={() => setIsFeatureModalOpen(false)}
                    nftId={selectedNFT.nftId}
                    similarity={selectedNFT.similarity}
                    featureComparison={selectedNFT.featureComparison}
                />
            )}

            {/* Metadata Modal */}
            {selectedNFT && (
                <MetadataModal
                    isOpen={isMetadataModalOpen}
                    onClose={() => setIsMetadataModalOpen(false)}
                    nftId={selectedNFT.nftId}
                    tokenUrl={selectedNFT.tokenUrl}
                />
            )}
        </div>
    );
}
