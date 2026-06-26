import React from 'react';
import { FileText, Play, Download, ExternalLink } from 'lucide-react';

interface FilePreviewProps {
  url: string;
  fileType: string;
  fileName?: string;
  fileSize?: number;
}

export default function FilePreview({
  url,
  fileType,
  fileName = 'file',
  fileSize
}: FilePreviewProps) {
  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  const isVideo = fileType.startsWith('video/') || /\.(mp4|mov|avi)$/i.test(url);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isImage) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 aspect-[4/3] group">
        <img
          src={url}
          alt={fileName}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{fileName}</p>
            {fileSize && <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(fileSize)}</p>}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-slate-900/90 p-1.5 text-slate-300 hover:text-white transition"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden aspect-[16/9]">
        <video src={url} controls className="h-full w-full object-contain" />
      </div>
    );
  }

  // Document Fallback
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-900/60 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{fileName}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {fileType.split('/').pop()?.toUpperCase() || 'FILE'} {fileSize ? `• ${formatBytes(fileSize)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={url}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/10 transition"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
    </div>
  );
}
