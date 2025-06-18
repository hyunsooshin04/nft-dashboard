"use client";

import {useState, useEffect} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Calendar, TrendingUp, BarChart3, Loader2, RefreshCw, Download, Package, AlertTriangle} from "lucide-react";
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";

interface AnalyticsResults {
    summary: {
        total_mints: number;
        avg_daily_mints: number;
        median_daily_mints: number;
        peak_day: string;
        peak_count: number;
        data_period_start: string;
        data_period_end: string;
        total_days: number;
        max_mints: number;
        min_mints: number;
    };
    trend_analysis: string;
    trend_change_percent: number;
    chart_data: Array<{date: string; mint_count: number}>;
    charts?: {
        main_trend: string;
        histogram: string;
        weekly: string;
        monthly_boxplot: string;
    };
    r_info?: {
        r_version: string;
        packages_used: string[];
        generated_at: string;
    };
    analysis_method: string;
    r_output?: string;
    generated_at: string;
}

export default function MintingAnalytics() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInstallingR, setIsInstallingR] = useState(false);
    const [rInstallOutput, setRInstallOutput] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const loadAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/minting-analytics");
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to load analytics");
            }

            const data = await response.json();
            setAnalyticsData(data);
        } catch (error) {
            console.error("Analytics error:", error);
            setError((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const installRPackages = async () => {
        setIsInstallingR(true);
        setRInstallOutput("");
        try {
            const response = await fetch("/api/run-r-analysis", {method: "POST"});
            const data = await response.json();

            if (response.ok) {
                setRInstallOutput(data.output || "R 패키지 설치 완료");
                // 설치 완료 후 자동으로 분석 실행
                setTimeout(() => {
                    loadAnalytics();
                }, 1000);
            } else {
                throw new Error(data.error || "R 패키지 설치 실패");
            }
        } catch (error) {
            console.error("R installation error:", error);
            setError((error as Error).message);
        } finally {
            setIsInstallingR(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">R 스크립트 실행 중...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                        <strong>R 분석 오류:</strong> {error}
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />R 환경 설정
                        </CardTitle>
                        <CardDescription>R 분석을 위해 필요한 패키지를 설치하고 환경을 설정합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                onClick={installRPackages}
                                disabled={isInstallingR}
                                className="flex items-center gap-2"
                            >
                                {isInstallingR ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />R 패키지 설치 중...
                                    </>
                                ) : (
                                    <>
                                        <Package className="h-4 w-4" />R 패키지 설치
                                    </>
                                )}
                            </Button>

                            <Button variant="outline" onClick={loadAnalytics}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                다시 시도
                            </Button>
                        </div>

                        {rInstallOutput && (
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                                <pre>{rInstallOutput}</pre>
                            </div>
                        )}

                        <div className="text-sm text-gray-600">
                            <p>
                                <strong>필요한 R 패키지:</strong>
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>ggplot2 - 그래프 생성</li>
                                <li>dplyr - 데이터 조작</li>
                                <li>scales - 스케일 및 포맷팅</li>
                                <li>lubridate - 날짜/시간 처리</li>
                                <li>jsonlite - JSON 처리</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* R 정보 표시 */}
            {analyticsData?.r_info && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                R Analysis Engine
                            </Badge>
                            <span className="text-sm text-blue-700">{analyticsData.r_info.r_version}</span>
                        </div>
                        <div className="text-sm text-blue-600">
                            <strong>사용된 패키지:</strong> {analyticsData.r_info.packages_used.join(", ")}
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                            생성 시간: {new Date(analyticsData.r_info.generated_at).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            {analyticsData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Mints</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {analyticsData.summary.total_mints.toLocaleString()}
                            </div>
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
                            <p className="text-xs text-muted-foreground">
                                Median: {analyticsData.summary.median_daily_mints}
                            </p>
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

            {/* Charts and Analysis */}
            <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="r-charts">R Generated Charts</TabsTrigger>
                        <TabsTrigger value="interactive">Interactive Charts</TabsTrigger>
                        <TabsTrigger value="r-output">R Output</TabsTrigger>
                    </TabsList>

                    <Button onClick={loadAnalytics} variant="outline" size="sm" disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Re-run R Analysis
                    </Button>
                </div>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 R 분석 결과 요약</CardTitle>
                            <CardDescription>R ggplot2로 생성된 통계 분석 결과</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analyticsData && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {analyticsData.summary.max_mints}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Maximum Daily</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {analyticsData.summary.min_mints}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Minimum Daily</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {analyticsData.summary.avg_daily_mints}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Average Daily</div>
                                    </div>
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {analyticsData.summary.median_daily_mints}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Median Daily</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="r-charts" className="space-y-4">
                    {analyticsData?.charts && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* <Card>
                <CardHeader>
                  <CardTitle>📈 Main Trend (R ggplot2)</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={analyticsData.charts.main_trend || "/placeholder.svg"}
                    alt="Main Trend Chart"
                    className="w-full h-auto rounded-lg border"
                  />
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href={analyticsData.charts.main_trend} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download PNG
                    </a>
                  </Button>
                </CardContent>
              </Card> */}

                            <Card>
                                <CardHeader>
                                    <CardTitle>📊 Distribution (R ggplot2)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <img
                                        src={analyticsData.charts.histogram || "/placeholder.svg"}
                                        alt="Distribution Chart"
                                        className="w-full h-auto rounded-lg border"
                                    />
                                    <Button variant="outline" size="sm" className="mt-2" asChild>
                                        <a href={analyticsData.charts.histogram} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download PNG
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>📅 Weekly Totals (R ggplot2)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <img
                                        src={analyticsData.charts.weekly || "/placeholder.svg"}
                                        alt="Weekly Chart"
                                        className="w-full h-auto rounded-lg border"
                                    />
                                    <Button variant="outline" size="sm" className="mt-2" asChild>
                                        <a href={analyticsData.charts.weekly} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download PNG
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>📦 Monthly Distribution (R ggplot2)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <img
                                        src={analyticsData.charts.monthly_boxplot || "/placeholder.svg"}
                                        alt="Monthly Boxplot"
                                        className="w-full h-auto rounded-lg border"
                                    />
                                    <Button variant="outline" size="sm" className="mt-2" asChild>
                                        <a href={analyticsData.charts.monthly_boxplot} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download PNG
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="interactive" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>🔄 Interactive Charts (React + Recharts)</CardTitle>
                            <CardDescription>R 데이터를 기반으로 한 인터랙티브 차트</CardDescription>
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
                                    <p className="text-muted-foreground">R 데이터 로딩 중...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="r-output" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>🖥️ R Script Output</CardTitle>
                            <CardDescription>R 스크립트 실행 로그 및 출력</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analyticsData?.r_output ? (
                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                                    <pre>{analyticsData.r_output}</pre>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">R 출력 로그가 없습니다.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
