"use client"

import { CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Eye, TrendingUp, BarChart3 } from "lucide-react"

interface FeatureComparison {
  dimension_similarities: number[]
  top_similar_dimensions: Array<{ dimension: number; difference: number }>
  mean_difference: number
  std_difference: number
  total_dimensions: number
}

interface FeatureComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  nftId: number
  similarity: number
  featureComparison: FeatureComparison
}

export default function FeatureComparisonModal({
  isOpen,
  onClose,
  nftId,
  similarity,
  featureComparison,
}: FeatureComparisonModalProps) {
  // 히트맵 데이터 준비 (차원을 그룹으로 나누어 시각화)
  const heatmapData = featureComparison.dimension_similarities.map((diff, index) => ({
    dimension: index,
    difference: diff,
    similarity: 1 - diff, // 차이가 작을수록 유사도가 높음
  }))

  // 상위 유사한 차원들을 차트 데이터로 변환
  const topSimilarData = featureComparison.top_similar_dimensions.slice(0, 20).map((item) => ({
    dimension: `Dim ${item.dimension}`,
    difference: item.difference,
    similarity: (1 - item.difference) * 100,
  }))

  // 차원별 분포 히스토그램 데이터
  const distributionData = []
  const bins = 20
  const maxDiff = Math.max(...featureComparison.dimension_similarities)
  const binSize = maxDiff / bins

  for (let i = 0; i < bins; i++) {
    const binStart = i * binSize
    const binEnd = (i + 1) * binSize
    const count = featureComparison.dimension_similarities.filter((diff) => diff >= binStart && diff < binEnd).length

    distributionData.push({
      range: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
      count: count,
      binStart: binStart,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            NFT #{nftId} 특징점 비교 분석
          </DialogTitle>
          <DialogDescription>
            업로드된 이미지와 NFT #{nftId}의 CLIP 특징점 상세 비교 ({similarity * 100}% 유사도)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">전체 차원</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{featureComparison.total_dimensions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">평균 차이</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{featureComparison.mean_difference.toFixed(4)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">표준편차</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{featureComparison.std_difference.toFixed(4)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">전체 유사도</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{(similarity * 100).toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* 탭 컨텐츠 */}
          <Tabs defaultValue="top-similar" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="top-similar">상위 유사 차원</TabsTrigger>
              <TabsTrigger value="distribution">차이 분포</TabsTrigger>
              <TabsTrigger value="heatmap">전체 히트맵</TabsTrigger>
            </TabsList>

            <TabsContent value="top-similar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    가장 유사한 상위 20개 차원
                  </CardTitle>
                  <CardDescription>차이가 가장 작은 특징 차원들 (낮을수록 더 유사)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSimilarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dimension" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "difference" ? `${value}` : `${value}%`,
                          name === "difference" ? "차이값" : "유사도",
                        ]}
                      />
                      <Bar dataKey="difference" fill="#ef4444" name="difference" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    특징점 차이 분포
                  </CardTitle>
                  <CardDescription>모든 차원에서의 차이값 분포 히스토그램</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}개`, "차원 수"]} />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="heatmap" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>전체 차원 히트맵</CardTitle>
                  <CardDescription>모든 512개 차원의 차이값 시각화 (처음 100개 차원만 표시)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={heatmapData.slice(0, 100)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dimension" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value}`, name === "difference" ? "차이값" : "유사도"]} />
                      <Line type="monotone" dataKey="difference" stroke="#ef4444" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 차원별 상세 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>상위 유사 차원 상세</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {featureComparison.top_similar_dimensions.slice(0, 20).map((item, index) => (
                      <Badge key={index} variant="outline" className="justify-between">
                        <span>Dim {item.dimension}</span>
                        <span className="text-green-600">{item.difference.toFixed(4)}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 닫기 버튼 */}
          <div className="flex justify-end">
            <Button onClick={onClose}>닫기</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
