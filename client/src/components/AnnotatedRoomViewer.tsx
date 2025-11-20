import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ShoppingCart, Eye } from "lucide-react";
import { Link } from "wouter";

interface ProductPlacement {
  productId: number;
  name: string;
  category: string;
  priceKES: number;
  imageUrl: string;
  x: number; // percentage from left
  y: number; // percentage from top
  reasoning: string;
}

interface AnnotatedRoomViewerProps {
  frameUrl: string;
  placements: ProductPlacement[];
}

export default function AnnotatedRoomViewer({ frameUrl, placements }: AnnotatedRoomViewerProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductPlacement | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  return (
    <div className="relative w-full">
      <Card className="overflow-hidden border-2">
        <CardContent className="p-0 relative">
          {/* Room Image */}
          <div className="relative w-full bg-gradient-to-br from-orange-100 to-orange-50 min-h-96 flex items-center justify-center">
            <img 
              src={frameUrl} 
              alt="Your Room" 
              className="w-full h-auto"
              onError={(e) => {
                // If image fails to load, show placeholder
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
              <div className="text-gray-400">
                <p className="text-lg font-medium">Room Image</p>
                <p className="text-sm">Your room visualization will appear here</p>
              </div>
            </div>
            
            {/* Interactive Hotspots */}
            {placements.map((placement, idx) => (
              <div
                key={idx}
                className="absolute cursor-pointer group"
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseEnter={() => setHoveredProduct(idx)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => setSelectedProduct(placement)}
              >
                {/* Pulsing Dot */}
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full bg-primary border-4 border-white shadow-lg transition-all duration-300 ${
                    hoveredProduct === idx ? 'scale-125' : 'scale-100'
                  }`}>
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></div>
                  </div>
                  
                  {/* Price Tag */}
                  <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 transition-all duration-200 ${
                    hoveredProduct === idx ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}>
                    <div className="bg-white rounded-lg shadow-xl px-3 py-2 whitespace-nowrap border-2 border-primary">
                      <p className="text-xs font-semibold text-muted-foreground">{placement.category}</p>
                      <p className="text-sm font-bold">KES {(placement.priceKES / 100).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions Overlay */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary animate-pulse"></div>
              <p className="text-sm font-medium">
                Click the pulsing dots to see AI-recommended products for each area
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Detail Popup */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={() => setSelectedProduct(null)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative aspect-[4/3] bg-muted">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                  AI Recommended
                </Badge>
              </div>

              {/* Product Details */}
              <div className="p-6 space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2">{selectedProduct.category}</Badge>
                  <h3 className="text-2xl font-bold mb-2">{selectedProduct.name}</h3>
                  <p className="text-muted-foreground text-sm">{selectedProduct.reasoning}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    KES {(selectedProduct.priceKES / 100).toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Link href={`/product/${selectedProduct.productId}`} className="flex-1">
                    <Button className="w-full" size="lg">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
