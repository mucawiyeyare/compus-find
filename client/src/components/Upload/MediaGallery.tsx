import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Video, Trash2, Copy, Check, FileUp, Sparkles, FolderOpen } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

export default function MediaGallery() {
  const { user, token } = useAuthStore();
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'document' | 'video'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUserMedia = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/upload/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMediaList(res.data.media);
      }
    } catch (error) {
      console.error('Failed to fetch media list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserMedia();
  }, [user?._id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media item? This will also remove it from Cloudinary/storage.')) return;
    try {
      const res = await axios.delete(`/api/upload/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMediaList((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      alert('Failed to delete media item.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    const fullUrl = text.startsWith('http') ? text : `${window.location.origin}${text}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-indigo-400" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5 text-rose-400" />;
    return <FileText className="h-5 w-5 text-blue-400" />;
  };

  const filteredMedia = mediaList.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'image') return item.fileType.startsWith('image/');
    if (activeFilter === 'video') return item.fileType.startsWith('video/');
    if (activeFilter === 'document') return !item.fileType.startsWith('image/') && !item.fileType.startsWith('video/');
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="h-5.5 w-5.5 text-blue-500" />
            Media Vault
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage and access all your uploaded files and visual media assets.</p>
        </div>

        {/* Filters */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold self-start">
          {(['all', 'image', 'document', 'video'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-3 py-1.5 capitalize transition ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}s
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-400">Loading your media files...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10">
          <FileUp className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">No media items found</p>
          <p className="text-xs text-slate-500 mt-1">Files you upload across other modules will show up here.</p>
          <button
            onClick={fetchUserMedia}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            Refresh Gallery
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredMedia.map((item) => (
            <div
              key={item._id}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 p-4 transition duration-200"
            >
              <div>
                {/* Visual Thumbnail */}
                {item.fileType.startsWith('image/') ? (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 mb-3">
                    <img
                      src={item.cloudinaryUrl}
                      alt={item.fileName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-video w-full rounded-lg border border-slate-800 bg-slate-950/80 mb-3">
                    {getFileIcon(item.fileType)}
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">{getFileIcon(item.fileType)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-200 truncate" title={item.fileName}>
                      {item.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                      {formatBytes(item.fileSize)} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 border-t border-slate-800/80 mt-4 pt-3">
                <button
                  onClick={() => copyToClipboard(item.cloudinaryUrl, item._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-800/60 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  {copiedId === item._id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="rounded-lg bg-red-500/10 hover:bg-red-500/20 p-2 text-red-400 transition"
                  title="Delete Media"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
