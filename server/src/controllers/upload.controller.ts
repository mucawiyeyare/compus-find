import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Media from '../models/Media';
import { processAndUploadImage, uploadRawFile, deleteFile } from '../services/upload.service';
import { analyzeUploadedImage } from '../services/ai.service';

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const { width, height, thumbnail, analyze } = req.query;
    const resizeOptions = {
      width: width ? parseInt(width as string, 10) : undefined,
      height: height ? parseInt(height as string, 10) : undefined,
      thumbnail: thumbnail === 'true'
    };

    const uploadResult = await processAndUploadImage(req.file, resizeOptions);

    const media = await Media.create({
      userId: req.user?._id,
      fileName: req.file.originalname,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      cloudinaryUrl: uploadResult.secureUrl,
      publicId: uploadResult.publicId
    });

    let aiTags: string[] = [];
    if (analyze === 'true') {
      aiTags = await analyzeUploadedImage(req.file.buffer, req.file.mimetype);
    }

    return res.status(201).json({
      success: true,
      media,
      aiTags
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadImages = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }

    const { width, height, thumbnail, analyze } = req.query;
    const resizeOptions = {
      width: width ? parseInt(width as string, 10) : undefined,
      height: height ? parseInt(height as string, 10) : undefined,
      thumbnail: thumbnail === 'true'
    };

    const mediaRecords = [];
    const allAiTags = [];

    for (const file of files) {
      const uploadResult = await processAndUploadImage(file, resizeOptions);
      const media = await Media.create({
        userId: req.user?._id,
        fileName: file.originalname,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        cloudinaryUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId
      });
      mediaRecords.push(media);

      if (analyze === 'true') {
        const tags = await analyzeUploadedImage(file.buffer, file.mimetype);
        allAiTags.push({ fileName: file.originalname, tags });
      }
    }

    return res.status(201).json({
      success: true,
      media: mediaRecords,
      aiTags: allAiTags
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded' });
    }

    const uploadResult = await uploadRawFile(req.file, 'raw');

    const media = await Media.create({
      userId: req.user?._id,
      fileName: req.file.originalname,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      cloudinaryUrl: uploadResult.secureUrl,
      publicId: uploadResult.publicId
    });

    return res.status(201).json({
      success: true,
      media
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }

    const uploadResult = await uploadRawFile(req.file, 'video');

    const media = await Media.create({
      userId: req.user?._id,
      fileName: req.file.originalname,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      cloudinaryUrl: uploadResult.secureUrl,
      publicId: uploadResult.publicId
    });

    return res.status(201).json({
      success: true,
      media
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media record not found' });
    }

    // Security check: Only allow resource owner or admin to delete media
    if (media.userId.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this media' });
    }

    // Delete physical file (local or Cloudinary)
    await deleteFile(media.publicId || '', media.cloudinaryUrl, media.fileType);

    // Remove from DB
    await Media.deleteOne({ _id: id });

    return res.status(200).json({ success: true, message: 'Media deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMediaById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id).populate('userId', 'name email role');

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    return res.status(200).json({ success: true, media });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const media = await Media.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, media });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
