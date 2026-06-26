import { Request, Response, NextFunction } from 'express';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ALLOWED_DOC_EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const ALLOWED_VIDEO_EXTS = ['mp4', 'mov', 'avi'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

// Reject list of dangerous executable formats
const REJECTED_EXTS = ['exe', 'sh', 'bat', 'cmd', 'js', 'vbs', 'com', 'scr', 'msi'];

const checkMagicNumbers = (buffer: Buffer, originalname: string): boolean => {
  const ext = originalname.toLowerCase().split('.').pop();
  if (!ext) return false;
  if (buffer.length < 4) return false;

  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  if (['jpg', 'jpeg'].includes(ext)) {
    return hex.startsWith('FFD8FF');
  }
  if (ext === 'png') {
    return hex.startsWith('89504E47');
  }
  if (ext === 'gif') {
    return hex.startsWith('47494638');
  }
  if (ext === 'webp') {
    const riff = buffer.toString('utf8', 0, 4);
    const webp = buffer.toString('utf8', 8, 12);
    return riff === 'RIFF' && webp === 'WEBP';
  }
  if (ext === 'pdf') {
    return hex.startsWith('25504446'); // %PDF
  }
  return true;
};

export const validateFile = (uploadType: 'image' | 'images' | 'document' | 'video') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Collect files depending on single or multiple uploads
    const files: Express.Multer.File[] = [];
    if (req.file) {
      files.push(req.file);
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        Object.values(req.files).forEach((fileArr) => {
          files.push(...fileArr);
        });
      }
    }

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    for (const file of files) {
      const ext = file.originalname.toLowerCase().split('.').pop() || '';
      
      // 1. Basic script/executable reject validation
      if (REJECTED_EXTS.includes(ext)) {
        return res.status(400).json({
          success: false,
          message: `Security check failed: File extension '.${ext}' is dangerous and not allowed.`
        });
      }

      // 2. Validate based on uploadType
      if (uploadType === 'image' || uploadType === 'images') {
        if (!ALLOWED_IMAGE_EXTS.includes(ext) || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported file type for images: ${file.originalname}. Supported formats: JPG, JPEG, PNG, WEBP, GIF.`
          });
        }
        if (file.size > MAX_IMAGE_SIZE) {
          return res.status(400).json({
            success: false,
            message: `File size limit exceeded for image: ${file.originalname}. Max limit is 10MB.`
          });
        }
        // Malware scan check via magic numbers
        if (!checkMagicNumbers(file.buffer, file.originalname)) {
          return res.status(400).json({
            success: false,
            message: `Security check failed: File header validation failed for ${file.originalname}.`
          });
        }
      } else if (uploadType === 'document') {
        if (!ALLOWED_DOC_EXTS.includes(ext) || !ALLOWED_DOC_MIMES.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported file type for documents: ${file.originalname}. Supported formats: PDF, DOC, DOCX, PPT, PPTX.`
          });
        }
        if (file.size > MAX_DOC_SIZE) {
          return res.status(400).json({
            success: false,
            message: `File size limit exceeded for document: ${file.originalname}. Max limit is 25MB.`
          });
        }
        // Validate PDF magic number
        if (ext === 'pdf' && !checkMagicNumbers(file.buffer, file.originalname)) {
          return res.status(400).json({
            success: false,
            message: `Security check failed: PDF file header validation failed for ${file.originalname}.`
          });
        }
      } else if (uploadType === 'video') {
        if (!ALLOWED_VIDEO_EXTS.includes(ext) || !ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported file type for videos: ${file.originalname}. Supported formats: MP4, MOV, AVI.`
          });
        }
        if (file.size > MAX_VIDEO_SIZE) {
          return res.status(400).json({
            success: false,
            message: `File size limit exceeded for video: ${file.originalname}. Max limit is 100MB.`
          });
        }
      }
    }

    next();
  };
};
