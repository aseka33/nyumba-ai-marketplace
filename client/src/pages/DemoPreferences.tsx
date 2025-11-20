/**
 * DemoPreferences.tsx
 * Collects user preferences before video upload to personalize AI recommendations
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Home, Palette, DollarSign, Heart, Sofa, ArrowRight } from 'lucide-react';

interface UserPreferences {
  budget: 'economy' | 'mid-range' | 'premium' | 'luxury';
  roomType: 'living-room' | 'bedroom' | 'kitchen' | 'dining' | 'office' | 'other';
  favoriteColors: string[];
  stylePreference: 'minimalist' | 'modern' | 'traditional' | 'eclectic' | 'rustic' | 'industrial';
  priorities: string[];
  spaceSize: 'small' | 'medium' | 'large';
}

const BUDGET_OPTIONS = [
  { value: 'economy', label: 'Economy', range: 'KES 50K - 150K', icon: '💰', description: 'Starting out, budget-friendly' },
  { value: 'mid-range', label: 'Mid-Range', range: 'KES 150K - 500K', icon: '💎', description: 'Quality and value balance' },
  { value: 'premium', label: 'Premium', range: 'KES 500K - 1M', icon: '✨', description: 'High-quality, designer pieces' },
  { value: 'luxury', label: 'Luxury', range: 'KES 1M+', icon: '👑', description: 'Exclusive, custom designs' }
];

const ROOM_TYPES = [
  { value: 'living-room', label: 'Living Room', icon: '🛋️' },
  { value: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { value: 'dining', label: 'Dining Room', icon: '🍽️' },
  { value: 'office', label: 'Home Office', icon: '💼' },
  { value: 'other', label: 'Other', icon: '🏠' }
];

const COLOR_OPTIONS = [
  { value: 'neutral', label: 'Neutral', colors: ['#F5F5F5', '#E5E5E5', '#D4D4D4'] },
  { value: 'warm', label: 'Warm', colors: ['#FFA07A', '#FFD700', '#FF6347'] },
  { value: 'cool', label: 'Cool', colors: ['#4682B4', '#20B2AA', '#9370DB'] },
  { value: 'earth', label: 'Earth Tones', colors: ['#8B4513', '#D2691E', '#A0522D'] },
  { value: 'bold', label: 'Bold & Vibrant', colors: ['#FF1493', '#00CED1', '#FFD700'] },
  { value: 'monochrome', label: 'Monochrome', colors: ['#000000', '#808080', '#FFFFFF'] }
];

const STYLE_OPTIONS = [
  { value: 'minimalist', label: 'Minimalist', description: 'Clean lines, simple, clutter-free', icon: '⚪' },
  { value: 'modern', label: 'Modern', description: 'Contemporary, sleek, functional', icon: '🔲' },
  { value: 'traditional', label: 'Traditional', description: 'Classic, timeless, elegant', icon: '🏛️' },
  { value: 'eclectic', label: 'Eclectic', description: 'Mix of styles, colorful, unique', icon: '🎨' },
  { value: 'rustic', label: 'Rustic', description: 'Natural, warm, cozy', icon: '🌲' },
  { value: 'industrial', label: 'Industrial', description: 'Raw, exposed, urban', icon: '🏭' }
];

const PRIORITY_OPTIONS = [
  { value: 'comfort', label: 'Comfort', icon: '🛋️' },
  { value: 'aesthetics', label: 'Aesthetics', icon: '✨' },
  { value: 'functionality', label: 'Functionality', icon: '⚙️' },
  { value: 'storage', label: 'Storage', icon: '📦' },
  { value: 'lighting', label: 'Lighting', icon: '💡' },
  { value: 'sustainability', label: 'Sustainability', icon: '🌱' }
];

const SPACE_SIZES = [
  { value: 'small', label: 'Small', description: 'Bedsitter, studio (< 30 sqm)', icon: '🏠' },
  { value: 'medium', label: 'Medium', description: '1-2 bedroom (30-60 sqm)', icon: '🏡' },
  { value: 'large', label: 'Large', description: '3+ bedroom (> 60 sqm)', icon: '🏰' }
];

export default function DemoPreferences() {
  const [, setLocation] = useLocation();
  const [preferences, setPreferences] = useState<UserPreferences>({
    budget: 'mid-range',
    roomType: 'living-room',
    favoriteColors: [],
    stylePreference: 'modern',
    priorities: [],
    spaceSize: 'medium'
  });

  const handleContinue = () => {
    // Store preferences in sessionStorage for use in analysis
    sessionStorage.setItem('userPreferences', JSON.stringify(preferences));
    setLocation('/demo/upload');
  };

  const toggleColor = (color: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteColors: prev.favoriteColors.includes(color)
        ? prev.favoriteColors.filter(c => c !== color)
        : [...prev.favoriteColors, color]
    }));
  };

  const togglePriority = (priority: string) => {
    setPreferences(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority]
    }));
  };

  const isComplete = preferences.favoriteColors.length > 0 && preferences.priorities.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-teal-600" />
              <span className="text-xl font-bold">NyumbaAI</span>
              <span className="text-sm text-gray-500 ml-2">Demo</span>
            </div>
            <button
              onClick={() => setLocation('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2 text-teal-600 font-medium">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center">1</div>
              <span>Your Preferences</span>
            </div>
            <div className="w-12 h-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">2</div>
              <span>Upload Video</span>
            </div>
            <div className="w-12 h-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">3</div>
              <span>AI Analysis</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Tell Us About <span className="text-teal-600">Your Vision</span>
          </h1>
          <p className="text-lg text-gray-600">
            Help our AI understand your style and budget to create the perfect recommendations
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8 bg-white rounded-2xl shadow-lg p-8">
          {/* Budget */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-4">
              <DollarSign className="w-5 h-5 text-teal-600" />
              What's your budget?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BUDGET_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setPreferences(prev => ({ ...prev, budget: option.value as any }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    preferences.budget === option.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-sm text-teal-600 font-medium">{option.range}</div>
                      <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Home className="w-5 h-5 text-teal-600" />
              Which room are you furnishing?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ROOM_TYPES.map(room => (
                <button
                  key={room.value}
                  onClick={() => setPreferences(prev => ({ ...prev, roomType: room.value as any }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    preferences.roomType === room.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{room.icon}</div>
                  <div className="text-sm font-medium">{room.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Space Size */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Sofa className="w-5 h-5 text-teal-600" />
              How big is your space?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SPACE_SIZES.map(size => (
                <button
                  key={size.value}
                  onClick={() => setPreferences(prev => ({ ...prev, spaceSize: size.value as any }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    preferences.spaceSize === size.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{size.icon}</div>
                  <div className="font-semibold">{size.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{size.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Preferences */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Palette className="w-5 h-5 text-teal-600" />
              What colors do you love? <span className="text-sm font-normal text-gray-500">(Select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {COLOR_OPTIONS.map(colorGroup => (
                <button
                  key={colorGroup.value}
                  onClick={() => toggleColor(colorGroup.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    preferences.favoriteColors.includes(colorGroup.value)
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex gap-1 mb-2 justify-center">
                    {colorGroup.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="text-sm font-medium">{colorGroup.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Preference */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Heart className="w-5 h-5 text-teal-600" />
              What's your style?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STYLE_OPTIONS.map(style => (
                <button
                  key={style.value}
                  onClick={() => setPreferences(prev => ({ ...prev, stylePreference: style.value as any }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    preferences.stylePreference === style.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{style.icon}</span>
                    <div>
                      <div className="font-semibold">{style.label}</div>
                      <div className="text-sm text-gray-500">{style.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Sparkles className="w-5 h-5 text-teal-600" />
              What matters most to you? <span className="text-sm font-normal text-gray-500">(Select 2-3)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRIORITY_OPTIONS.map(priority => (
                <button
                  key={priority.value}
                  onClick={() => togglePriority(priority.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    preferences.priorities.includes(priority.value)
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{priority.icon}</div>
                  <div className="text-sm font-medium">{priority.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-6">
            <button
              onClick={handleContinue}
              disabled={!isComplete}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                isComplete
                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Upload Video
              <ArrowRight className="w-5 h-5" />
            </button>
            {!isComplete && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Please select at least one color preference and one priority
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        {isComplete && (
          <div className="mt-8 p-6 bg-teal-50 rounded-xl border-2 border-teal-200">
            <h3 className="font-semibold text-teal-900 mb-3">Your Preferences Summary:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Budget:</span>
                <div className="font-medium text-teal-900">{BUDGET_OPTIONS.find(b => b.value === preferences.budget)?.label}</div>
              </div>
              <div>
                <span className="text-gray-600">Room:</span>
                <div className="font-medium text-teal-900">{ROOM_TYPES.find(r => r.value === preferences.roomType)?.label}</div>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <div className="font-medium text-teal-900">{SPACE_SIZES.find(s => s.value === preferences.spaceSize)?.label}</div>
              </div>
              <div>
                <span className="text-gray-600">Style:</span>
                <div className="font-medium text-teal-900">{STYLE_OPTIONS.find(s => s.value === preferences.stylePreference)?.label}</div>
              </div>
              <div>
                <span className="text-gray-600">Colors:</span>
                <div className="font-medium text-teal-900">{preferences.favoriteColors.length} selected</div>
              </div>
              <div>
                <span className="text-gray-600">Priorities:</span>
                <div className="font-medium text-teal-900">{preferences.priorities.length} selected</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
