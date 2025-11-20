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

interface ProductPosition {
  productName: string;
  x: number; // pixels from left
  y: number; // pixels from top
  width: number; // pixels
  height: number; // pixels
}

export default function DemoResults() {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [, setLocation] = useLocation();
  const [beforeImage, setBeforeImage] = useState<string>('');
  const [afterImage, setAfterImage] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [productPositions, setProductPositions] = useState<ProductPosition[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1280, height: 720 });

  // Load actual analysis results from sessionStorage
  useEffect(() => {
    const resultsStr = sessionStorage.getItem('analysisResults');
    if (resultsStr) {
      const results = JSON.parse(resultsStr);
      console.log('Analysis results:', results);
      setAnalysisData(results);
      setBeforeImage(results.frameUrl); // Actual uploaded video frame (before)
      setAfterImage(results.afterImageUrl || results.frameUrl); // AI-composited image with products (after)
      setProductPositions(results.productPositions || []);
      
      // Get image dimensions
      if (results.frameUrl) {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
        };
        img.src = results.frameUrl;
      }
    } else {
      // Fallback to demo images if no analysis results
      setBeforeImage('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200');
      setAfterImage('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200');
    }
  }, []);

  const handleProductClick = (recommendation: any) => {
    setSelectedProduct(recommendation);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    alert(`Added ${selectedProduct.productName} to cart!`);
    setSelectedProduct(null);
  };

  const handleScheduleVisit = () => {
    if (!selectedProduct) return;
    // Navigate to vendor visit page
    setLocation(`/demo/schedule-visit/1`);
  };

  const formatPrice = (priceStr: string) => {
    // Extract number from price string like "KES 80,000 - 150,000"
    const match = priceStr.match(/(\d+,?\d*)/);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ''));
      return `KES ${(price / 1000).toFixed(0)}K`;
    }
    return priceStr;
  };

  const getProductPosition = (productName: string): { x: number; y: number } | null => {
    const position = productPositions.find(p => p.productName === productName);
    if (!position) return null;
    
    // Convert pixel position to percentage for the hotspot
    return {
      x: (position.x / imageSize.width) * 100,
      y: (position.y / imageSize.height) * 100
    };
  };

  const recommendations = analysisData?.analysis?.recommendations || [];
  const totalBudget = recommendations.reduce((sum: number, rec: any) => {
    const match = rec.estimatedBudget.match(/(\d+,?\d*)/);
    if (match) {
      return sum + parseInt(match[1].replace(/,/g, ''));
    }
    return sum;
  }, 0);

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
                We found {recommendations.length} perfect items for your space • Estimated Total: KES {(totalBudget / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Before & After</h3>
              <div className="text-sm text-gray-500">
                Drag slider to compare • Hover over products on the right
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
              {recommendations.map((rec: any, index: number) => {
                const position = getProductPosition(rec.productName);
                if (!position) return null;

                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      display: position.x < sliderPosition ? 'block' : 'none'
                    }}
                    onMouseEnter={() => setHoveredProduct(rec.productName)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    onClick={() => handleProductClick(rec)}
                  >
                    {/* Pulsing Hotspot */}
                    <div className="relative">
                      <div className="w-8 h-8 bg-teal-500 rounded-full animate-ping absolute opacity-75"></div>
                      <div className="w-8 h-8 bg-teal-600 rounded-full relative flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-white text-xs font-bold">$</span>
                      </div>
                    </div>

                    {/* Hover Card */}
                    {hoveredProduct === rec.productName && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-2xl p-4 border-2 border-teal-500 z-10 pointer-events-none">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {rec.productName}
                          </h4>
                          <p className="text-teal-600 font-bold text-lg">
                            {formatPrice(rec.estimatedBudget)}
                          </p>
                          <p className="text-xs text-gray-600">{rec.reason}</p>
                          <p className="text-xs text-gray-500 italic">{rec.placement}</p>
                        </div>
                        <div className="mt-2 text-xs text-center text-gray-500">
                          Click to view details
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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

        {/* Recommended Products Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommended Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleProductClick(rec)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">📦</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{rec.productName}</h4>
                <p className="text-teal-600 font-bold text-lg mb-2">
                  {formatPrice(rec.estimatedBudget)}
                </p>
                <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 capitalize">{rec.category}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.productName}</h3>
                <p className="text-teal-600 font-bold text-3xl mt-2">
                  {formatPrice(selectedProduct.estimatedBudget)}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-700">{selectedProduct.reason}</p>
              <p className="text-sm text-gray-600"><strong>Placement:</strong> {selectedProduct.placement}</p>
              <p className="text-sm text-gray-600"><strong>Category:</strong> {selectedProduct.category}</p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                🛒 Add to Cart
              </button>
              <button
                onClick={handleScheduleVisit}
                className="flex-1 bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold border-2 border-teal-600 hover:bg-teal-50 transition-colors"
              >
                📍 Schedule Vendor Visit
              </button>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Want to see it in person?</strong> Schedule a visit to the vendor's showroom. 
                You'll get a QR code to ensure your purchase is protected through our platform.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
