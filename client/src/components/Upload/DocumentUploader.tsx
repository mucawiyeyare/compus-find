import React, { useState } from 'react';
import { FileUp, FileText, Check, Trash2, ShieldAlert } from 'lucide-react';
import DragDropUploader from './DragDropUploader';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

interface DocumentUploaderProps {
  onUploadSuccess: (fileUrl: string, mediaId: string, metadata: { fileSize: number; fileType: string }) => void;
}

interface DocFileItem {
  file: File;
  isUploaded: boolean;
  fileSize: number;
  fileType: string;
  url?: string;
  mediaId?: string;
}

export default function DocumentUploader({
  onUploadSuccess
}: DocumentUploaderProps) {
  const { token } = useAuthStore();
  const [doc, setDoc] = useState<DocFileItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setUploadStatus('idle');
    setErrorMessage('');
    
    const selected = files[0];
    setDoc({
      file: selected,
      isUploaded: false,
      fileSize: selected.size,
      fileType: selected.name.split('.').pop() || 'pdf'
    });
  };

  const startUpload = async () => {
    if (!doc || doc.isUploaded) return;
    setIsUploading(true);
    setUploadProgress(15);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', doc.file);

      setUploadProgress(50);
      const res = await axios.post('/api/upload/document', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUploadProgress(90);
      if (res.data.success) {
        const media = res.data.media;
        setDoc((prev) =>
          prev
            ? {
                ...prev,
                isUploaded: true,
                url: media.cloudinaryUrl,
                mediaId: media._id
              }
            : null
        );
        setUploadStatus('success');
        onUploadSuccess(media.cloudinaryUrl, media._id, {
          fileSize: media.fileSize,
          fileType: media.fileType
        });
      }
    } catch (error: any) {
      setUploadStatus('error');
      setErrorMessage(error.response?.data?.message || 'Server document upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setDoc(null);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!doc ? (
        <DragDropUploader
          onFilesSelected={handleFilesSelected}
          acceptTypes=".pdf,.doc,.docx,.ppt,.pptx"
          maxSizeMB={25}
          multiple={false}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadStatus={uploadStatus}
          errorMessage={errorMessage}
        />
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400">
              <FileText className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {doc.file.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatBytes(doc.fileSize)} • {doc.fileType.toUpperCase()}
              </p>
            </div>

            {doc.isUploaded ? (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <Check className="h-3.5 w-3.5" />
                Done
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleRemove}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition"
                  title="Remove File"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={startUpload}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  Upload
                </button>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-semibold">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
