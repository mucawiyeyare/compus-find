import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropUploaderProps {
  onFilesSelected: (files: File[]) => void;
  acceptTypes?: string; // e.g., "image/*" or ".pdf,.docx"
  maxSizeMB?: number;
  multiple?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'success' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

export default function DragDropUploader({
  onFilesSelected,
  acceptTypes = '*/*',
  maxSizeMB = 10,
  multiple = false,
  isUploading = false,
  uploadProgress = 0,
  uploadStatus = 'idle',
  errorMessage = '',
  onRetry
}: DragDropUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = (fileList: FileList) => {
    setLocalError(null);
    const selectedFiles = Array.from(fileList);
    const validFiles: File[] = [];

    // Filter single file if not multiple
    const filesToValidate = multiple ? selectedFiles : [selectedFiles[0]].filter(Boolean);

    for (const file of filesToValidate) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setLocalError(`File "${file.name}" exceeds the limit of ${maxSizeMB}MB.`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const activeError = localError || errorMessage;

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5'
            : activeError
            ? 'border-red-500 bg-red-500/5'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full"
            >
              <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-blue-500/10 text-blue-500 mb-4 animate-pulse">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-slate-200">Uploading your file...</p>
              <p className="text-xs text-slate-400 mt-1">Please wait a moment</p>
              
              <div className="w-full max-w-xs bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="bg-blue-500 h-full rounded-full"
                />
              </div>
              <span className="text-xs font-semibold text-blue-500 mt-2">{uploadProgress}%</span>
            </motion.div>
          ) : uploadStatus === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                <CheckCircle className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-slate-200">Upload Complete!</p>
              <p className="text-xs text-slate-400 mt-1">File was successfully saved</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-slate-800 text-slate-400 mb-4 group-hover:text-slate-300">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Drag & drop files here, or <span className="text-blue-500 hover:text-blue-400 font-semibold underline">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports files up to {maxSizeMB}MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-2.5 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Upload Error</span>
              <p className="mt-0.5">{activeError}</p>
            </div>
            {onRetry && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="rounded-lg p-1 hover:bg-red-500/20 text-red-300 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
