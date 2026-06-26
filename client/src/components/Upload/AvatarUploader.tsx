import React, { useState } from 'react';
import { Camera, User, Trash2 } from 'lucide-react';
import ImageCropper from './ImageCropper';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  onUploadSuccess: (newUrl: string) => void;
}

export default function AvatarUploader({
  currentAvatarUrl,
  onUploadSuccess
}: AvatarUploaderProps) {
  const { token } = useAuthStore();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowCropper(true);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setIsUploading(true);

    try {
      const croppedFile = new File([croppedBlob], selectedFile?.name || 'avatar.webp', {
        type: 'image/webp'
      });

      const formData = new FormData();
      formData.append('file', croppedFile);

      const res = await axios.post('/api/upload/image?thumbnail=true', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        const secureUrl = res.data.media.cloudinaryUrl;
        setPreviewUrl(secureUrl);
        onUploadSuccess(secureUrl);
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Avatar upload failed. Using fallback preview.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setPreviewUrl(undefined);
    setSelectedFile(null);
    onUploadSuccess('');
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative group h-24 w-24 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-md">
        {previewUrl ? (
          <img src={previewUrl} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600 bg-slate-900">
            <User className="h-10 w-10 animate-pulse" />
          </div>
        )}

        {/* Hover overlay to change avatar */}
        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition duration-200">
          <Camera className="h-5 w-5 text-white" />
          <span className="text-[10px] text-white mt-1 font-semibold">Change</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="h-5 w-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {previewUrl && (
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition"
        >
          <Trash2 className="h-3 w-3" />
          Remove Avatar
        </button>
      )}

      {showCropper && previewUrl && (
        <ImageCropper
          imageSrc={previewUrl}
          aspectRatio={1}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}
