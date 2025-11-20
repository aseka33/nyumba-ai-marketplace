import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useRef } from "react";

type BudgetTier = "economy" | "mid-range" | "premium" | "luxury";

const BUDGET_TIERS = [
  { id: "economy", label: "Economy", description: "Budget-friendly options", icon: "💰" },
  { id: "mid-range", label: "Mid-Range", description: "Balanced quality & price", icon: "⭐" },
  { id: "premium", label: "Premium", description: "High-end selections", icon: "✨" },
  { id: "luxury", label: "Luxury", description: "Exclusive collections", icon: "👑" }
] as const;

export default function AnalyzeRoom() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<BudgetTier>("mid-range");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.video.uploadVideo.useMutation({
    onSuccess: (data) => {
      toast.success("Video uploaded successfully! AI analysis in progress...");
      setTimeout(() => {
        setLocation(`/analysis/${data.videoId}?tier=${selectedBudgetTier}`);
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload video");
      setUploading(false);
      setUploadProgress(0);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      toast.error("Please select a video or image file");
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      toast.error("File must be less than 16MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 50;
          setUploadProgress(progress);
        }
      };

      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setUploadProgress(60);

        await uploadMutation.mutateAsync({
          videoData: base64Data,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          budgetTier: selectedBudgetTier
        });

        setUploadProgress(100);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Camera className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analyze Your Room</h1>
          <p className="text-gray-600">Upload a video or photo and get AI-powered design recommendations</p>
        </div>

        {/* Budget Tier Selection */}
        <Card className="mb-8 border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-600">Select Your Budget Tier</CardTitle>
            <CardDescription>Choose your preferred price range for recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BUDGET_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedBudgetTier(tier.id as BudgetTier)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedBudgetTier === tier.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{tier.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{tier.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{tier.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="border-2 border-dashed border-orange-300">
          <CardHeader>
            <CardTitle>Upload Your Video or Photo</CardTitle>
            <CardDescription>Max 16MB • MP4, WebM, or Image formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-orange-300 rounded-lg p-12 text-center cursor-pointer hover:bg-orange-50 transition-colors"
              >
                <Upload className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">Your room video or photo</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Selected File */}
              {selectedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">{selectedFile.name}</p>
                    <p className="text-sm text-green-700">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Uploading and analyzing...</span>
                    <span className="font-semibold text-orange-600">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg font-semibold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze Room
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="mt-8 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Tip:</strong> For best results, record a video showing different angles of your room with good lighting, or upload a clear photo of the space you want to redesign.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
