import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { 
  Camera, 
  Sparkles, 
  Store, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Upload,
  ShoppingBag,
  Users
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">NyumbaAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/vendors">
              <Button variant="ghost">Vendors</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/demo">
                  <Button className="bg-primary text-primary-foreground">
                    <Camera className="w-4 h-4 mr-2" />
                    Analyze Room
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/demo">
                <Button>Try Demo</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Interior Design
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Transform Your Space with{" "}
                <span className="text-primary">Smart Design</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Upload a photo of your room and get instant AI-powered furniture and decor recommendations. 
                Shop directly from Kenya's best interior design businesses.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/demo">
                  <Button size="lg" className="bg-primary text-primary-foreground">
                    <Camera className="w-5 h-5 mr-2" />
                    Try Demo - No Login Required
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="outline">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-2xl font-bold text-primary">Free</div>
                  <div className="text-sm text-muted-foreground">For Users</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-2xl font-bold text-accent">0% Fee</div>
                  <div className="text-sm text-muted-foreground">For Vendors</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-2xl font-bold">Kenya</div>
                  <div className="text-sm text-muted-foreground">Based</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Camera className="w-24 h-24 mx-auto text-primary" />
                  <p className="text-lg font-medium">Upload Your Room Photo</p>
                  <p className="text-muted-foreground">Get AI suggestions in seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your space
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>1. Upload Photo</CardTitle>
                <CardDescription>
                  Take a photo of your room using your phone. Our AI analyzes the space, lighting, and style.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>2. Get AI Suggestions</CardTitle>
                <CardDescription>
                  Receive personalized furniture and decor recommendations matched with real products from local vendors.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>3. Shop & Transform</CardTitle>
                <CardDescription>
                  Purchase directly through our platform. Vendors fulfill orders and deliver to your location in Kenya.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose NyumbaAI?</h2>
              <div className="space-y-4">
                {[
                  "AI-powered room analysis and recommendations",
                  "Shop from verified Kenya-based interior businesses",
                  "Secure on-platform transactions and order tracking",
                  "No fees for users, free vendor registration",
                  "Platform-exclusive deals and discounts",
                  "Direct messaging with vendors after purchase"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    For Homeowners
                  </CardTitle>
                  <CardDescription>
                    Get professional interior design advice powered by AI. Discover products that perfectly match your style and space.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-accent" />
                    For Vendors
                  </CardTitle>
                  <CardDescription>
                    Reach customers actively looking for interior products. No listing fees, only pay for premium positioning and ads.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Vendors */}
      <section className="py-20 bg-gradient-to-br from-accent/10 to-accent/5">
        <div className="container">
          <Card className="border-2 border-accent/20">
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl font-bold mb-4">Are You a Furniture or Decor Business?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join Kenya's first AI-powered interior design marketplace. List your products for free and reach customers ready to buy.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {isAuthenticated ? (
                  <Link href="/become-vendor">
                    <Button size="lg" className="bg-accent text-accent-foreground">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Become a Vendor
                    </Button>
                  </Link>
                ) : (
                  <Link href="/become-vendor">
                    <Button size="lg" className="bg-accent text-accent-foreground">
                      Become a Vendor
                    </Button>
                  </Link>
                )}
                <Link href="/vendors">
                  <Button size="lg" variant="outline">
                    View Vendor Directory
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold">NyumbaAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Kenya's first AI-powered interior design marketplace.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Users</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/analyze">Analyze Room</Link></li>
                <li><Link href="/marketplace">Browse Products</Link></li>
                <li><Link href="/dashboard">My Orders</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Vendors</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/become-vendor">Become a Vendor</Link></li>
                <li><Link href="/vendors">Vendor Directory</Link></li>
                <li><Link href="/vendor/dashboard">Vendor Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 NyumbaAI. All rights reserved. Made in Kenya 🇰🇪</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
