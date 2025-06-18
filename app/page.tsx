import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NFTSimilaritySearch from "@/components/nft-similarity-search"
import MintingAnalytics from "@/components/minting-analytics"
import { BarChart3, Search, TrendingUp, Database } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">NFT Analytics Dashboard</h1>
          <p className="text-slate-600">Discover similar NFTs and analyze minting trends</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total NFTs</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,345</div>
              <p className="text-xs text-muted-foreground">In database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Features Extracted</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,901</div>
              <p className="text-xs text-muted-foreground">Ready for comparison</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Similarity Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Similarity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.847</div>
              <p className="text-xs text-muted-foreground">Match threshold</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="similarity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="similarity">NFT Similarity Search</TabsTrigger>
            <TabsTrigger value="analytics">Minting Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="similarity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Find Similar NFTs</CardTitle>
                <CardDescription>
                  Upload an image to find visually similar NFTs using CLIP feature extraction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading similarity search...</div>}>
                  <NFTSimilaritySearch />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Minting Trends Analysis</CardTitle>
                <CardDescription>Analyze NFT minting patterns and trends over time using R</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading analytics...</div>}>
                  <MintingAnalytics />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
