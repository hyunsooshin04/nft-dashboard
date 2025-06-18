"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText, ImageIcon, ExternalLink, Copy, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MetadataModalProps {
  isOpen: boolean
  onClose: () => void
  nftId: number
  tokenUrl?: string
}

interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  external_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  [key: string]: any // 기타 메타데이터 필드들
}

export default function MetadataModal({ isOpen, onClose, nftId, tokenUrl }: MetadataModalProps) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fetchMetadata = async () => {
    if (!tokenUrl) {
      setError("메타데이터 URL이 없습니다.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(tokenUrl)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setMetadata(data)
    } catch (error) {
      console.error("Metadata fetch error:", error)
      setError((error as Error).message || "메타데이터를 가져오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && tokenUrl) {
      fetchMetadata()
    }
  }, [isOpen, tokenUrl])

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
      toast({
        title: "복사됨",
        description: `${fieldName}이(가) 클립보드에 복사되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const renderJsonTree = (obj: any, depth = 0): React.ReactNode => {
    if (obj === null || obj === undefined) {
      return <span className="text-gray-500">null</span>
    }

    if (typeof obj === "string") {
      return (
        <span className="text-green-600">
          "{obj}"
          <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0" onClick={() => copyToClipboard(obj, "문자열")}>
            {copiedField === obj ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </span>
      )
    }

    if (typeof obj === "number") {
      return <span className="text-blue-600">{obj}</span>
    }

    if (typeof obj === "boolean") {
      return <span className="text-purple-600">{obj.toString()}</span>
    }

    if (Array.isArray(obj)) {
      return (
        <div className={`ml-${depth * 4}`}>
          <span className="text-gray-700">[</span>
          {obj.map((item, index) => (
            <div key={index} className="ml-4">
              <span className="text-gray-500">{index}: </span>
              {renderJsonTree(item, depth + 1)}
              {index < obj.length - 1 && <span className="text-gray-700">,</span>}
            </div>
          ))}
          <span className="text-gray-700">]</span>
        </div>
      )
    }

    if (typeof obj === "object") {
      return (
        <div className={`ml-${depth * 4}`}>
          <span className="text-gray-700">{"{"}</span>
          {Object.entries(obj).map(([key, value], index, array) => (
            <div key={key} className="ml-4">
              <span className="text-red-600 font-medium">"{key}"</span>
              <span className="text-gray-700">: </span>
              {renderJsonTree(value, depth + 1)}
              {index < array.length - 1 && <span className="text-gray-700">,</span>}
            </div>
          ))}
          <span className="text-gray-700">{"}"}</span>
        </div>
      )
    }

    return <span>{String(obj)}</span>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            NFT #{nftId} 메타데이터
          </DialogTitle>
          <DialogDescription>
            {tokenUrl && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{tokenUrl}</code>
                <Button variant="ghost" size="sm" onClick={() => window.open(tokenUrl, "_blank")}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">메타데이터 로딩 중...</span>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-600">
                  <span className="font-medium">오류:</span>
                  <span>{error}</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchMetadata}>
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          )}

          {metadata && (
            <Tabs defaultValue="structured" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="structured">구조화된 보기</TabsTrigger>
                <TabsTrigger value="raw">원본 JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="structured" className="space-y-4">
                {/* 기본 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {metadata.name && (
                      <div>
                        <Label className="font-medium">이름:</Label>
                        <p className="text-lg font-semibold">{metadata.name}</p>
                      </div>
                    )}

                    {metadata.description && (
                      <div>
                        <Label className="font-medium">설명:</Label>
                        <p className="text-sm text-gray-600 mt-1">{metadata.description}</p>
                      </div>
                    )}

                    {metadata.external_url && (
                      <div>
                        <Label className="font-medium">외부 URL:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">{metadata.external_url}</code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(metadata.external_url, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 이미지 */}
                {metadata.image && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        이미지
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(metadata.image)}`}
                          alt={metadata.name || "NFT Image"}
                          className="max-w-full h-auto rounded-lg border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=200&width=200"
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">{metadata.image}</code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(metadata.image!, "이미지 URL")}
                          >
                            {copiedField === metadata.image ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 속성 */}
                {metadata.attributes && metadata.attributes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">속성</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {metadata.attributes.map((attr, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="font-medium text-sm text-gray-600">{attr.trait_type}</div>
                            <div className="font-semibold">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 기타 필드 */}
                {Object.keys(metadata).filter(
                  (key) => !["name", "description", "image", "external_url", "attributes"].includes(key),
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">기타 필드</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(metadata)
                          .filter(
                            ([key]) => !["name", "description", "image", "external_url", "attributes"].includes(key),
                          )
                          .map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                              <Badge variant="outline">{key}</Badge>
                              <span className="flex-1 text-sm">{JSON.stringify(value)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(JSON.stringify(value), key)}
                              >
                                {copiedField === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="raw" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      원본 JSON 데이터
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2), "전체 JSON")}
                      >
                        {copiedField === "전체 JSON" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        전체 복사
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                      <pre className="text-sm font-mono">{renderJsonTree(metadata)}</pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>닫기</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium ${className || ""}`} {...props}>
      {children}
    </label>
  )
}
