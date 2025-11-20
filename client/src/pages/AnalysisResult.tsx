import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Sparkles, 
  Home, 
  Lightbulb, 
  Palette, 
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Heart,
  Eye
} from "lucide-react";
import AnnotatedRoomViewer from "@/components/AnnotatedRoomViewer";

export default function AnalysisResult() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const videoId = params.id ? parseInt(params.id) : 0;

  // Validate video ID
  if (!params.id || isNaN(videoId) || videoId <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Invalid video ID. Please upload a video first.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => setLocation('/analyze')}>
                Upload Video
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = trpc.video.getVideoAnalysis.useQuery(
    { videoId },
    { 
      enabled: videoId > 0,
      refetchInterval: (query) => {
        return query.state.data?.video?.status === 'processing' ? 3000 : false;
      }
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-64 w-full" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Failed to load analysis. {error?.message || 'Video not found.'}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => setLocation('/analyze')}>
                Try Another Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { video, analysis } = data;

  if (video.status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Analyzing Your Room</h2>
            <p className="text-muted-foreground">
              Our AI is analyzing your video and generating personalized recommendations. This usually takes 10-30 seconds.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (video.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Analysis failed. Please try uploading your video again.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => setLocation('/analyze')}>
                Upload New Video
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Analysis not yet available. Please check back in a moment.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  const suggestedStyles = JSON.parse(analysis.suggestedStyles || '[]');
  const suggestedProducts = JSON.parse(analysis.suggestedProducts || '[]');
  const productPlacements = JSON.parse(analysis.productPlacements || '[]');
  // Use frameUrl if available, otherwise use video URL or placeholder
  const frameUrl = video.frameUrl || video.videoUrl || '/placeholder-room.jpg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div className="container py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI Analysis Complete
            </div>
            <h1 className="text-4xl font-bold mb-4">Your Personalized Design Recommendations</h1>
            <p className="text-xl text-muted-foreground">
              Click the pulsing dots to explore AI-recommended products
            </p>
          </div>

          {/* Interactive Room View & Product Grid Tabs */}
          <Tabs defaultValue="interactive" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="interactive" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Interactive View
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Product Grid
              </TabsTrigger>
            </TabsList>

            {/* Interactive Annotated Room View */}
            <TabsContent value="interactive" className="mt-6">
              {productPlacements.length > 0 ? (
                <AnnotatedRoomViewer 
                  frameUrl={frameUrl}
                  placements={productPlacements}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No interactive placements available. View products in the grid tab.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Traditional Product Grid */}
            <TabsContent value="grid" className="mt-6 space-y-8">
              {suggestedProducts.length > 0 ? (
                suggestedProducts.map((category: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold">{category.category}</h3>
                      <p className="text-muted-foreground">{category.reasoning}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category.products?.map((product: any) => (
                        <Link key={product.productId} href={`/product/${product.productId}`}>
                          <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden h-full">
                            {product.imageUrl ? (
                              <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                                  AI Recommended
                                </Badge>
                              </div>
                            ) : (
                              <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                                <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <CardContent className="p-5">
                              <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                                {product.name}
                              </h4>
                              <Badge variant="outline" className="mb-3">{product.category}</Badge>
                              <div className="flex items-center justify-between">
                                <p className="text-2xl font-bold text-primary">
                                  KES {(product.priceKES / 100).toLocaleString()}
                                </p>
                                <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                                  View
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No product matches found yet. Check out our full marketplace!
                    </p>
                    <Link href="/marketplace">
                      <Button>Browse All Products</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Room Overview Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Home className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Room Type</p>
                <p className="text-lg font-bold">{analysis.roomType || 'General Space'}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-background">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Lightbulb className="w-8 h-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Lighting</p>
                <p className="text-lg font-bold">{analysis.lightingCondition || 'Moderate'}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Palette className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Current Style</p>
                <p className="text-lg font-bold">{analysis.currentStyle || 'Mixed'}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-background">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Room Size</p>
                <p className="text-lg font-bold">{analysis.roomSize || 'Medium'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Styles */}
          {suggestedStyles.length > 0 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Recommended Styles for Your Space
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {suggestedStyles.map((style: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-base px-4 py-2">
                      {style}
                    </Badge>
                  ))}
                </div>
                {analysis.colorScheme && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-2">💡 Color Palette Suggestion</p>
                    <p className="text-muted-foreground">{analysis.colorScheme}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center pt-8">
            <Link href="/marketplace">
              <Button size="lg" className="bg-primary text-primary-foreground">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Explore Full Marketplace
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={() => setLocation('/analyze')}>
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze Another Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
