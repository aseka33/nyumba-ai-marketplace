/**
 * Demo Results Page - Before/After Visualization
 * 
 * Shows the transformed room with interactive product hotspots
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface Product {
  id: number;
  name: string;
  price: number;
  vendor: string;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  position: { x: number; y: number }; // Position on the image (percentage)
}

// Mock products with positions for demo
const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Modern Leather Sofa Set',
    price: 125000,
    vendor: 'Nairobi Furniture Co',
    rating: 4.8,
    reviews: 24,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    category: 'furniture',
    position: { x: 35, y: 60 }
  },
  {
    id: 2,
    name: 'Minimalist Coffee Table',
    price: 25000,
    vendor: 'Nairobi Furniture Co',
    rating: 4.6,
    reviews: 18,
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400',
    category: 'furniture',
    position: { x: 50, y: 75 }
  },
  {
    id: 3,
    name: 'LED Wall Decor Panel',
    price: 45000,
    vendor: 'Kenya Home Decor',
    rating: 4.9,
    reviews: 31,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
    category: 'lighting',
    position: { x: 20, y: 30 }
  },
  {
    id: 4,
    name: 'Tropical Palm Plant Set',
    price: 12000,
    vendor: 'Mombasa Modern Living',
    rating: 4.7,
    reviews: 15,
    image: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=400',
    category: 'plants',
    position: { x: 75, y: 55 }
  },
  {
    id: 5,
    name: 'Modern Floor Lamp',
    price: 18000,
    vendor: 'Kenya Home Decor',
    rating: 4.5,
    reviews: 12,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    category: 'lighting',
    position: { x: 85, y: 45 }
  }
];

export default function DemoResults() {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [, setLocation] = useLocation();
  const [beforeImage, setBeforeImage] = useState<string>('');
  const [afterImage, setAfterImage] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Load actual analysis results from sessionStorage
  useEffect(() => {
    const resultsStr = sessionStorage.getItem('analysisResults');
    if (resultsStr) {
      const results = JSON.parse(resultsStr);
      setAnalysisData(results);
      setBeforeImage(results.frameUrl); // Actual uploaded video frame (before)
      setAfterImage(results.afterImageUrl || results.frameUrl); // AI-composited image with products (after)
    } else {
      // Fallback to demo images if no analysis results
      setBeforeImage('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200');
      setAfterImage('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200');
    }
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: Product) => {
    // In production, this would add to cart
    alert(`Added ${product.name} to cart!`);
    setSelectedProduct(null);
  };

  const handleScheduleVisit = (product: Product) => {
    // Navigate to vendor visit page
    setLocation(`/demo/schedule-visit/${product.id}`);
  };

  const formatPrice = (price: number) => {
    return `KES ${(price / 1000).toFixed(0)}K`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Your Room <span className="text-teal-600">Transformed</span>
            </h1>
            <button
              onClick={() => setLocation('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Start Over
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Success Message */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Analysis Complete!</h2>
              <p className="text-teal-100 mt-1">
                We found {DEMO_PRODUCTS.length} perfect items for your space • Total: {formatPrice(DEMO_PRODUCTS.reduce((sum, p) => sum + p.price, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Before & After</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBefore}
                    onChange={(e) => setShowBefore(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Show Original</span>
                </label>
                <div className="text-sm text-gray-500">
                  Drag slider to compare
                </div>
              </div>
            </div>
          </div>

          {/* Image Comparison Slider */}
          <div className="relative aspect-video bg-gray-900">
            {/* Before Image (underneath) */}
            <img
              src={beforeImage}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* After Image (on top, clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={afterImage}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Product Hotspots - Only visible on "after" side */}
              {!showBefore && DEMO_PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${product.position.x}%`,
                    top: `${product.position.y}%`,
                    display: product.position.x < sliderPosition ? 'block' : 'none'
                  }}
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  onClick={() => handleProductClick(product)}
                >
                  {/* Pulsing Hotspot */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-teal-500 rounded-full animate-ping absolute opacity-75"></div>
                    <div className="w-8 h-8 bg-teal-600 rounded-full relative flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-white text-xs font-bold">$</span>
                    </div>
                  </div>

                  {/* Hover Card */}
                  {hoveredProduct === product.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-2xl p-4 border-2 border-teal-500 z-10 pointer-events-none">
                      <div className="flex items-start space-x-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {product.name}
                          </h4>
                          <p className="text-teal-600 font-bold text-lg">
                            {formatPrice(product.price)}
                          </p>
                          <p className="text-xs text-gray-500">{product.vendor}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400 text-sm">★</span>
                            <span className="text-xs text-gray-600 ml-1">
                              {product.rating} ({product.reviews})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-center text-gray-500">
                        Click to view details
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={(e) => {
                const container = e.currentTarget.parentElement;
                if (!container) return;

                const handleMove = (moveEvent: MouseEvent) => {
                  const rect = container.getBoundingClientRect();
                  const x = moveEvent.clientX - rect.left;
                  const percentage = (x / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, percentage)));
                };

                const handleUp = () => {
                  document.removeEventListener('mousemove', handleMove);
                  document.removeEventListener('mouseup', handleUp);
                };

                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleUp);
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg font-semibold">
              Before
            </div>
            <div className="absolute top-4 right-4 bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold">
              After with NyumbaAI
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Recommended Products
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="text-2xl font-bold text-teal-600">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-sm text-gray-500">{product.vendor}</p>
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm text-gray-600 ml-1">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full rounded-xl"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-4xl font-bold text-teal-600 mb-2">
                      {formatPrice(selectedProduct.price)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400 text-xl">★</span>
                      <span className="text-lg text-gray-700">
                        {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Vendor</h3>
                    <p className="text-gray-600">{selectedProduct.vendor}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleAddToCart(selectedProduct)}
                      className="w-full bg-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-teal-700 transition-colors"
                    >
                      🛒 Add to Cart
                    </button>

                    <button
                      onClick={() => handleScheduleVisit(selectedProduct)}
                      className="w-full bg-white border-2 border-teal-600 text-teal-600 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-teal-50 transition-colors"
                    >
                      📍 Schedule Vendor Visit
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Want to see it in person?</p>
                        <p>Schedule a visit to the vendor's showroom. You'll get a QR code to ensure your purchase is protected through our platform.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
