/**
 * Image Upload Component for DecorAI Marketplace
 * 
 * Features:
 * - Drag & drop support
 * - Multiple image upload
 * - Image preview
 * - Progress tracking
 * - File size validation
 * - Image type validation
 */

import { useState, useRef } from 'react';
import { trpc } from '../lib/trpc';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  existingImages?: string[];
}

interface UploadedImage {
  url: string;
  key: string;
  fileName: string;
}

export function ImageUpload({ 
  onUploadComplete, 
  maxImages = 5, 
  maxSizeMB = 5,
  existingImages = []
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.uploadProductImages.useMutation();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    // Validate and process files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check total count
      if (selectedFiles.length + newFiles.length + existingImages.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        break;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      newFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === newFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');

    try {
      // Convert files to base64
      const imagePromises = selectedFiles.map(async (file) => {
        return new Promise<{ imageData: string; fileName: string; fileSize: number; mimeType: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              imageData: reader.result as string,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(imagePromises);

      // Upload to server
      const result = await uploadMutation.mutateAsync({ images });

      // Process results
      const successful: UploadedImage[] = [];
      const failed: string[] = [];

      result.results.forEach((res, index) => {
        if (res.success && res.url && res.key) {
          successful.push({
            url: res.url,
            key: res.key,
            fileName: res.fileName,
          });
        } else {
          failed.push(res.fileName);
        }
      });

      if (failed.length > 0) {
        setError(`Failed to upload: ${failed.join(', ')}`);
      }

      // Update state
      const newUploaded = [...uploadedImages, ...successful];
      setUploadedImages(newUploaded);
      
      // Clear selected files
      setSelectedFiles([]);
      setPreviews([]);

      // Notify parent
      const allUrls = [...existingImages, ...newUploaded.map(img => img.url)];
      onUploadComplete(allUrls);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-gray-600">
            <span className="font-medium text-teal-600">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, WebP up to {maxSizeMB}MB (max {maxImages} images)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded truncate">
                  {selectedFiles[index]?.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <button
          onClick={uploadImages}
          disabled={uploading}
          className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}...
            </span>
          ) : (
            `Upload ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}`
          )}
        </button>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 text-center">
        {existingImages.length + uploadedImages.length} / {maxImages} images uploaded
      </div>
    </div>
  );
}
