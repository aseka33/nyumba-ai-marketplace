import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart, 
  Store, 
  Package, 
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const productId = params.id ? parseInt(params.id) : 0;
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const { data: product, isLoading } = trpc.product.getById.useQuery({ productId });
  const { data: vendor } = trpc.user.getVendorProfile.useQuery(
    { vendorId: product?.vendorId || 0 },
    { enabled: !!product?.vendorId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Button onClick={() => setLocation("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const images = product.imageUrls ? JSON.parse(product.imageUrls) : [];
  const [currentImage, setCurrentImage] = useState(0);

  const handleAddToCart = () => {
    if (product.stockQuantity !== null && quantity > product.stockQuantity) {
      toast.error("Not enough stock available");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      priceKES: product.priceKES,
      quantity,
      imageUrl: images[0],
      vendorId: product.vendorId,
    });

    toast.success("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container py-4">
          <Button variant="ghost" onClick={() => setLocation("/marketplace")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>

      {/* Product Details */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[currentImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      currentImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{product.category}</Badge>
                {product.isFeatured && <Badge>Featured</Badge>}
                {!product.isActive && <Badge variant="destructive">Unavailable</Badge>}
              </div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-3xl font-bold text-primary mb-6">
                KES {(product.priceKES / 100).toLocaleString()}
              </p>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Product Details */}
            <Card>
              <CardContent className="p-4 space-y-2">
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="font-medium">{product.dimensions}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material:</span>
                    <span className="font-medium">{product.material}</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-medium">{product.color}</span>
                  </div>
                )}
                {product.style && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Style:</span>
                    <span className="font-medium">{product.style}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="font-medium">
                    {product.stockQuantity !== null ? (
                      product.stockQuantity > 0 ? (
                        <span className="text-accent flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {product.stockQuantity} available
                        </span>
                      ) : (
                        <span className="text-destructive">Out of stock</span>
                      )
                    ) : (
                      'In stock'
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            {product.isActive && (product.stockQuantity === null || product.stockQuantity > 0) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                      min="1"
                      max={product.stockQuantity || undefined}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const max = product.stockQuantity || 999;
                        setQuantity(Math.min(max, quantity + 1));
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-primary text-primary-foreground"
                    size="lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={() => {
                      handleAddToCart();
                      setLocation("/checkout");
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            )}

            {/* Vendor Info */}
            {vendor && (
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{vendor.businessName}</h3>
                      {vendor.businessDescription && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {vendor.businessDescription}
                        </p>
                      )}
                      {vendor.businessCity && (
                        <p className="text-sm text-muted-foreground">
                          📍 {vendor.businessCity}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
