/**
 * Demo Upload Page - No Login Required
 * 
 * Second step after preferences - upload video for REAL AI analysis
 */

import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

interface AnalysisStep {
  id: string;
  label: string;
  completed: boolean;
}

export default function DemoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { id: 'upload', label: 'Uploading video', completed: false },
    { id: 'extract', label: 'Extracting room frame', completed: false },
    { id: 'detect', label: 'Detecting room dimensions', completed: false },
    { id: 'analyze', label: 'Analyzing lighting & style', completed: false },
    { id: 'match', label: 'Finding perfect matches', completed: false },
    { id: 'generate', label: 'Generating recommendations', completed: false },
  ]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const analyzeVideoMutation = trpc.upload.analyzeRoomVideo.useMutation();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const completeStep = (stepId: string) => {
    setAnalysisSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError('');

    try {
      // Get user preferences from sessionStorage
      const preferencesStr = sessionStorage.getItem('userPreferences');
      if (!preferencesStr) {
        setError('Preferences not found. Please start over.');
        setAnalyzing(false);
        return;
      }

      const preferences = JSON.parse(preferencesStr);

      // Step 1: Upload
      completeStep('upload');

      // Convert video to base64
      const reader = new FileReader();
      const videoData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Step 2: Extract frame
      await new Promise(resolve => setTimeout(resolve, 500));
      completeStep('extract');

      // Step 3: Detect dimensions
      await new Promise(resolve => setTimeout(resolve, 500));
      completeStep('detect');

      // Step 4: Start analyzing (show progress during API call)
      setTimeout(() => completeStep('analyze'), 2000);
      setTimeout(() => completeStep('match'), 5000);
      setTimeout(() => completeStep('generate'), 8000);

      // Call AI analysis API (this takes 10-20 seconds)
      const result = await analyzeVideoMutation.mutateAsync({
        videoData,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        preferences
      });

      // Ensure all steps are complete
      completeStep('analyze');
      completeStep('match');
      completeStep('generate');

      // Store analysis results in sessionStorage
      sessionStorage.setItem('analysisResults', JSON.stringify({
        analysis: result.analysis,
        frameUrl: result.frameUrl,
        thumbnailUrl: result.thumbnailUrl,
        videoId: result.videoId,
        preferences
      }));

      // Navigate to results
      await new Promise(resolve => setTimeout(resolve, 500));
      setLocation('/demo/results');

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              NyumbaAI <span className="text-teal-600">Demo</span>
            </h1>
            <div className="text-sm text-gray-500">
              Step 2 of 3 • Upload your room video
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!analyzing ? (
          /* Upload Interface */
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">
                Upload Your Room Video
              </h2>
              <p className="text-xl text-gray-600">
                Record a 10-30 second walkthrough of your room for best results
              </p>
            </div>

            {/* Upload Area */}
            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-teal-300 rounded-2xl p-16 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all duration-300"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <svg className="h-24 w-24 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-700">
                      Drop your room video here
                    </p>
                    <p className="text-gray-500 mt-2">
                      or click to browse
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    MP4, MOV, WebM • Max 50MB • 10-30 seconds recommended
                  </div>
                </div>
              </div>
            ) : (
              /* Video Preview */
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-96 object-contain bg-black"
                  />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedFile.name}</h3>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                        }}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    <button
                      onClick={handleAnalyze}
                      disabled={uploading || analyzeVideoMutation.isLoading}
                      className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {uploading || analyzeVideoMutation.isLoading ? 'Starting AI Analysis...' : '✨ Analyze My Room with AI'}
                    </button>
                  </div>
                </div>

                {/* What to Expect */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
                  <div className="space-y-3">
                    {[
                      'AI extracts the best frame from your video',
                      'Analyzes room dimensions, lighting, and current style',
                      'Matches furniture based on your preferences and budget',
                      'Shows you a personalized before/after visualization',
                      'Provides interactive product recommendations'
                    ].map((step, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-gray-600">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                {error}
              </div>
            )}
          </div>
        ) : (
          /* Analysis Progress */
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 border-8 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                AI is analyzing your space...
              </h2>
              <p className="text-lg text-gray-600">
                Using real AI vision to understand your room
              </p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="space-y-4">
                {analysisSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                      step.completed
                        ? 'bg-teal-50'
                        : analysisSteps[index - 1]?.completed
                        ? 'bg-blue-50 animate-pulse'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-teal-600 text-white'
                          : analysisSteps[index - 1]?.completed
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step.completed ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${step.completed ? 'text-teal-900' : 'text-gray-700'}`}>
                        {step.label}
                      </p>
                    </div>
                    {!step.completed && analysisSteps[index - 1]?.completed && (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>🔒 Your video is processed securely and never stored permanently</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
