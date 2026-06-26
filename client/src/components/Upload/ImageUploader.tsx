import React, { useState } from 'react';
import { X, Crop, MoveLeft, MoveRight, Image as ImageIcon, Sparkles, AlertCircle, Check, Loader2 } from 'lucide-react';
import DragDropUploader from './DragDropUploader';
import ImageCropper from './ImageCropper';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

interface ImageUploaderProps {
  maxImages?: number;
  multiple?: boolean;
  onUploadSuccess: (urls: string[], mediaIds: string[], aiTags?: string[]) => void;
  aspectRatio?: number;
  analyzeImage?: boolean;
}

interface ImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  isUploaded: boolean;
  uploadUrl?: string;
  mediaId?: string;
  isUploading?: boolean;
  progress?: number;
  error?: string;
  aiTags?: string[];
}

export default function ImageUploader({
  maxImages = 10,
  multiple = false,
  onUploadSuccess,
  aspectRatio = 1.33,
  analyzeImage = false
}: ImageUploaderProps) {
  const { token } = useAuthStore();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeCropIndex, setActiveCropIndex] = useState<number | null>(null);

  const uploadImageFile = async (imgId: string, file: File) => {
    // Set item status as uploading
    setImages(prev => prev.map(img => img.id === imgId ? { ...img, isUploading: true, progress: 0, error: undefined } : img));

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(
        `/api/upload/image?analyze=${analyzeImage}`,
        formData,
        {
          headers,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded)
            );
            setImages(prev => prev.map(img => img.id === imgId ? { ...img, progress: percentCompleted } : img));
          }
        }
      );

      if (res.data.success) {
        const media = res.data.media;
        const aiTags = res.data.aiTags || [];

        setImages(prev => {
          const updated = prev.map(img => img.id === imgId ? {
            ...img,
            isUploaded: true,
            isUploading: false,
            progress: 100,
            uploadUrl: media.cloudinaryUrl,
            mediaId: media._id,
            aiTags: aiTags
          } : img);

          // Notify parent of all fully uploaded images
          const uploaded = updated.filter(x => x.isUploaded);
          const urls = uploaded.map(x => x.uploadUrl!).filter(Boolean);
          const ids = uploaded.map(x => x.mediaId!).filter(Boolean);
          const allTags = uploaded.reduce((acc: string[], x) => acc.concat(x.aiTags || []), []);
          onUploadSuccess(urls, ids, Array.from(new Set(allTags)));

          return updated;
        });
      } else {
        throw new Error('Upload response indicated failure');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setImages(prev => prev.map(img => img.id === imgId ? { ...img, isUploading: false, error: msg } : img));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const newImages: ImageItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      isUploaded: false
    }));

    let targetImages: ImageItem[] = [];
    if (multiple) {
      targetImages = newImages.slice(0, maxImages - images.length);
      setImages((prev) => [...prev, ...targetImages]);
    } else {
      // Clear previous previews
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      targetImages = newImages.slice(0, 1);
      setImages(targetImages);
    }

    // Trigger upload immediately for each new image
    targetImages.forEach((img) => {
      if (img.file) {
        uploadImageFile(img.id, img.file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      // Notify parent of updated list
      const uploaded = updated.filter(x => x.isUploaded);
      const urls = uploaded.map(x => x.uploadUrl!).filter(Boolean);
      const ids = uploaded.map(x => x.mediaId!).filter(Boolean);
      const allTags = uploaded.reduce((acc: string[], x) => acc.concat(x.aiTags || []), []);
      onUploadSuccess(urls, ids, Array.from(new Set(allTags)));

      return updated;
    });
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setImages((prev) => {
      const updated = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;

      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    if (activeCropIndex === null) return;

    const original = images[activeCropIndex];
    const croppedFile = new File([croppedBlob], original.file?.name || 'cropped.webp', {
      type: 'image/webp'
    });

    // Cleanup old preview
    URL.revokeObjectURL(original.previewUrl);
    const newPreviewUrl = URL.createObjectURL(croppedFile);

    setImages((prev) => {
      const updated = [...prev];
      updated[activeCropIndex] = {
        ...original,
        file: croppedFile,
        previewUrl: newPreviewUrl,
        isUploaded: false,
        uploadUrl: undefined,
        mediaId: undefined,
        error: undefined
      };
      return updated;
    });

    setActiveCropIndex(null);

    // Re-trigger upload for cropped file
    uploadImageFile(original.id, croppedFile);
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    onUploadSuccess([], [], []);
  };

  // Collect all unique AI tags from fully uploaded images
  const allAiTags = images
    .filter(img => img.isUploaded && img.aiTags)
    .reduce((acc: string[], img) => acc.concat(img.aiTags || []), []);
  const uniqueAiTags = Array.from(new Set(allAiTags));

  return (
    <div className="space-y-4">
      {images.length < (multiple ? maxImages : 1) && (
        <DragDropUploader
          onFilesSelected={handleFilesSelected}
          acceptTypes="image/*"
          multiple={multiple}
          isUploading={false} // Managed at individual image level
          uploadProgress={0}
          uploadStatus="idle"
          errorMessage=""
          maxSizeMB={10}
        />
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-md transition hover:border-slate-700"
              >
                <img
                  src={img.previewUrl}
                  alt="preview"
                  className="h-full w-full object-cover"
                />

                {/* Progress Overlay */}
                {img.isUploading && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-2 z-10">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-10 h-10 transform -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="transparent" />
                        <circle cx="20" cy="20" r="16" stroke="#3B82F6" strokeWidth="3" fill="transparent"
                          strokeDasharray={100}
                          strokeDashoffset={100 - (img.progress || 0)}
                          className="transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-bold text-white">{img.progress || 0}%</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-300 mt-2">Uploading...</span>
                  </div>
                )}

                {/* Error Overlay */}
                {img.error && (
                  <div className="absolute inset-0 bg-red-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-2 z-10 text-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                    <p className="text-[9px] font-semibold text-red-200 line-clamp-2 px-1">{img.error}</p>
                    <button
                      type="button"
                      onClick={() => uploadImageFile(img.id, img.file!)}
                      className="mt-2 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition shadow-md"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Actions overlay */}
                {!img.isUploading && !img.error && (
                  <div className="absolute inset-0 flex flex-col justify-between bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 p-2 z-10">
                    <div className="flex justify-end gap-1.5">
                      {img.file && (
                        <button
                          type="button"
                          onClick={() => setActiveCropIndex(index)}
                          className="rounded-lg bg-slate-900/90 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                          title="Crop Image"
                        >
                          <Crop className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="rounded-lg bg-red-600/90 p-1.5 text-white hover:bg-red-500 transition"
                        title="Remove Image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {multiple && images.length > 1 && (
                      <div className="flex justify-between items-center bg-slate-900/90 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'left')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400"
                        >
                          <MoveLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[10px] font-semibold text-slate-300">
                          {index + 1} of {images.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'right')}
                          disabled={index === images.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400"
                        >
                          <MoveRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {img.isUploaded && (
                  <div className="absolute top-2 left-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-white text-[9px] font-bold shadow-md flex items-center gap-1 z-10">
                    <Check className="h-2.5 w-2.5" /> Uploaded
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Clear All
            </button>
            <span className="text-[11px] text-slate-500 italic">
              Images upload automatically once inserted.
            </span>
          </div>

          {/* AI Tags Preview */}
          {uniqueAiTags.length > 0 && (
            <div className="mt-4 rounded-xl bg-violet-500/5 border border-violet-500/10 p-4 animate-fade-in">
              <div className="flex items-center gap-2 text-violet-400 mb-2.5">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Objects Recognized</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {uniqueAiTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-xs font-semibold text-violet-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeCropIndex !== null && (
        <ImageCropper
          imageSrc={images[activeCropIndex].previewUrl}
          aspectRatio={aspectRatio}
          onCropComplete={handleCropComplete}
          onCancel={() => setActiveCropIndex(null)}
        />
      )}
    </div>
  );
}
