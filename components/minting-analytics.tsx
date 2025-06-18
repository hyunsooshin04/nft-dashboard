"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, BarChart3, Loader2, RefreshCw } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface AnalyticsResults {
  summary: {
    total_mints: number
    avg_daily_mints: number
    median_daily_mints: number
    peak_day: string
    peak_count: number
    data_period_start: string
    data_period_end: string
    total_days: number
    max_mints: number
    min_mints: number
  }
  trend_analysis: string
  trend_change_percent: number
  chart_data: Array<{ date: string; mint_count: number }>
  generated_at: string
  analysis_method: string
}

export default function MintingAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/minting-analytics")
      if (!response.ok) throw new Error("Failed to load analytics")

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error("Analytics error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">분석 실행 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mints</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.summary.total_mints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{analyticsData.summary.total_days} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.summary.avg_daily_mints}</div>
              <p className="text-xs text-muted-foreground">Median: {analyticsData.summary.median_daily_mints}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{analyticsData.summary.peak_day}</div>
              <p className="text-xs text-muted-foreground">{analyticsData.summary.peak_count} mints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trend</CardTitle>
              <Badge
                variant={analyticsData.trend_change_percent > 0 ? "default" : "secondary"}
                className={analyticsData.trend_change_percent > 0 ? "bg-green-600" : "bg-red-600"}
              >
                {analyticsData.trend_change_percent > 0 ? "+" : ""}
                {analyticsData.trend_change_percent.toFixed(1)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{analyticsData.trend_analysis}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Method Info */}
      {analyticsData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100">
                {analyticsData.analysis_method}
              </Badge>
              <span className="text-sm text-blue-700">
                Generated: {new Date(analyticsData.generated_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Analysis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="data">Raw Data</TabsTrigger>
          </TabsList>

          <Button onClick={loadAnalytics} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Analysis
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Minting Activity Over Time</CardTitle>
              <CardDescription>Daily NFT minting counts with trend analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.chart_data ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="mint_count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center border rounded-lg">
                  <p className="text-muted-foreground">Chart loading...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📈 Daily Minting Trends</CardTitle>
              <CardDescription>Bar chart showing daily variations</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.chart_data ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.chart_data.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="mint_count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center border rounded-lg">
                  <p className="text-muted-foreground">Chart loading...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Statistics Summary</CardTitle>
              <CardDescription>Key statistics from the minting data</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.summary.max_mints}</div>
                    <div className="text-sm text-muted-foreground">Maximum Daily</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.summary.min_mints}</div>
                    <div className="text-sm text-muted-foreground">Minimum Daily</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analyticsData.summary.avg_daily_mints}</div>
                    <div className="text-sm text-muted-foreground">Average Daily</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analyticsData.summary.median_daily_mints}</div>
                    <div className="text-sm text-muted-foreground">Median Daily</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
              <CardDescription>
                Daily minting counts from the dataset
                {analyticsData && (
                  <span className="ml-2">
                    ({analyticsData.summary.data_period_start} to {analyticsData.summary.data_period_end})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData && (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Mint Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.chart_data.map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row.date}</td>
                          <td className="text-right p-2">{row.mint_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
