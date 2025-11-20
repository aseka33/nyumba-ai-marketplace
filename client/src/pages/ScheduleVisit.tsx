/**
 * Schedule Vendor Visit Page
 * 
 * Allows customers to schedule a physical visit to vendor showroom
 * Generates QR code for anti-bypass protection
 */

import { useState } from 'react';
import { useParams, useLocation } from 'wouter';

// Mock product data - in production, fetch from API
const MOCK_PRODUCT = {
  id: 1,
  name: 'Modern Leather Sofa Set',
  price: 125000,
  vendor: 'Nairobi Furniture Co',
  vendorAddress: 'Westlands Shopping Centre, Nairobi',
  vendorPhone: '+254 712 345 678',
  image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'
};

export default function ScheduleVisit() {
  const { productId } = useParams();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    notes: ''
  });
  const [visitToken, setVisitToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In production, this would call the API to create a vendor visit
    // For demo, we'll simulate it
    const token = `VIS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setVisitToken(token);
    setStep('confirmation');
  };

  const formatPrice = (price: number) => {
    return `KES ${(price / 1000).toFixed(0)}K`;
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Visit Scheduled <span className="text-teal-600">✓</span>
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2">Visit Confirmed!</h2>
              <p className="text-teal-100">
                Your vendor visit has been scheduled. Show this QR code at the showroom.
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block bg-white p-6 rounded-2xl shadow-lg border-4 border-teal-500">
                  {/* In production, use actual QR code library */}
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📱</div>
                      <div className="text-sm text-gray-600 font-mono">
                        {visitToken}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        QR Code would appear here
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Valid for 7 days • Expires on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              {/* Visit Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Product Details</h3>
                  <div className="flex items-start space-x-4">
                    <img
                      src={MOCK_PRODUCT.image}
                      alt={MOCK_PRODUCT.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{MOCK_PRODUCT.name}</h4>
                      <p className="text-teal-600 font-bold">{formatPrice(MOCK_PRODUCT.price)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Vendor Location</h3>
                  <div className="space-y-2 text-gray-600">
                    <p className="font-medium">{MOCK_PRODUCT.vendor}</p>
                    <p className="text-sm">{MOCK_PRODUCT.vendorAddress}</p>
                    <p className="text-sm">{MOCK_PRODUCT.vendorPhone}</p>
                  </div>
                </div>
              </div>

              {/* Your Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 text-lg mb-4">Your Details</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900 font-medium">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 text-gray-900 font-medium">{formData.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900 font-medium">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Preferred Date:</span>
                    <span className="ml-2 text-gray-900 font-medium">{formData.preferredDate}</span>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Important: How This Protects You
                </h3>
                <ul className="space-y-2 text-sm text-blue-900">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>When you show this QR code, the vendor knows you came from NyumbaAI</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Your purchase will be processed through our platform for your protection</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>You'll get warranty, returns policy, and customer support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Earn loyalty points and get access to exclusive deals</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-white border-2 border-teal-600 text-teal-600 py-3 px-6 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
                >
                  🖨️ Print QR Code
                </button>
                <button
                  onClick={() => setLocation('/demo/results')}
                  className="flex-1 bg-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                >
                  ← Back to Results
                </button>
              </div>

              {/* Download Options */}
              <div className="text-center text-sm text-gray-500">
                <p>💡 Tip: Take a screenshot or save this page to show at the vendor</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Schedule Vendor Visit
            </h1>
            <button
              onClick={() => setLocation('/demo/results')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Product You're Viewing</h3>
            <img
              src={MOCK_PRODUCT.image}
              alt={MOCK_PRODUCT.name}
              className="w-full rounded-xl mb-4"
            />
            <h4 className="font-semibold text-lg text-gray-900">{MOCK_PRODUCT.name}</h4>
            <p className="text-2xl font-bold text-teal-600 mt-2">{formatPrice(MOCK_PRODUCT.price)}</p>
            
            <div className="mt-6 space-y-3">
              <h5 className="font-medium text-gray-900">Vendor Information</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{MOCK_PRODUCT.vendor}</p>
                <p>{MOCK_PRODUCT.vendorAddress}</p>
                <p>{MOCK_PRODUCT.vendorPhone}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Information</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="John Kamau"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="+254 712 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Visit Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Any specific questions or requirements?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg"
              >
                Generate Visit QR Code
              </button>
            </form>

            {/* Benefits */}
            <div className="mt-6 bg-teal-50 rounded-xl p-4">
              <h4 className="font-medium text-teal-900 mb-2 text-sm">Why use NyumbaAI for your visit?</h4>
              <ul className="space-y-1 text-xs text-teal-800">
                <li>✓ Purchase protection & warranty</li>
                <li>✓ Secure payment through platform</li>
                <li>✓ Easy returns & refunds</li>
                <li>✓ Earn loyalty points</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
