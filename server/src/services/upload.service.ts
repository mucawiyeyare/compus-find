import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { isCloudinaryConfigured } from '../config/cloudinary.config';

const localUploadDir = path.join(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

const uploadToCloudinary = (
  buffer: Buffer,
  resourceType: 'image' | 'video' | 'raw',
  fileName: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: path.parse(fileName).name,
        folder: 'campus_connect'
      },
      (error, result) => {
        if (error) reject(error);
        else if (!result) reject(new Error('Upload failed with empty response'));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' | 'raw'): Promise<void> => {
  if (!isCloudinaryConfigured || publicId.startsWith('local_')) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
  }
};

export const processAndUploadImage = async (
  file: Express.Multer.File,
  options?: { width?: number; height?: number; thumbnail?: boolean }
) => {
  const ext = file.originalname.toLowerCase().split('.').pop() || '';
  let outputBuffer = file.buffer;
  let finalName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  let finalExt = 'webp';

  try {
    // Sharp processing: strip metadata, resize, compress to WebP
    if (ext !== 'gif') {
      let pipeline = sharp(file.buffer).rotate(); // auto-rotate based on EXIF tag

      if (options?.thumbnail) {
        pipeline = pipeline.resize(150, 150, { fit: 'cover' });
      } else if (options?.width || options?.height) {
        pipeline = pipeline.resize(options.width, options.height, { fit: 'inside', withoutEnlargement: true });
      }

      pipeline = pipeline.webp({ quality: 80 });
      outputBuffer = await pipeline.toBuffer();
    } else {
      // GIFs bypass WebP compression to preserve animation
      finalExt = 'gif';
    }
  } catch (error) {
    console.warn('Sharp compression failed, uploading raw file buffer as fallback:', error);
    finalExt = ext;
  }

  finalName = `${finalName}.${finalExt}`;

  if (isCloudinaryConfigured) {
    const result = await uploadToCloudinary(outputBuffer, 'image', finalName);
    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      fileSize: outputBuffer.length,
      fileType: `image/${finalExt}`
    };
  } else {
    const localPath = path.join(localUploadDir, finalName);
    fs.writeFileSync(localPath, outputBuffer);
    return {
      secureUrl: `/uploads/${finalName}`,
      publicId: `local_${finalName}`,
      fileSize: outputBuffer.length,
      fileType: `image/${finalExt}`
    };
  }
};

export const uploadRawFile = async (
  file: Express.Multer.File,
  resourceType: 'video' | 'raw'
) => {
  const ext = file.originalname.toLowerCase().split('.').pop() || '';
  const finalName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

  if (isCloudinaryConfigured) {
    const result = await uploadToCloudinary(file.buffer, resourceType, finalName);
    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      fileSize: file.size,
      fileType: file.mimetype
    };
  } else {
    const localPath = path.join(localUploadDir, finalName);
    fs.writeFileSync(localPath, file.buffer);
    return {
      secureUrl: `/uploads/${finalName}`,
      publicId: `local_${finalName}`,
      fileSize: file.size,
      fileType: file.mimetype
    };
  }
};

export const deleteFile = async (publicId: string, secureUrl: string, fileType: string): Promise<void> => {
  let resourceType: 'image' | 'video' | 'raw' = 'raw';
  if (fileType.startsWith('image/')) {
    resourceType = 'image';
  } else if (fileType.startsWith('video/')) {
    resourceType = 'video';
  }

  if (publicId.startsWith('local_')) {
    const fileName = publicId.replace('local_', '');
    const localPath = path.join(localUploadDir, fileName);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (error) {
        console.error(`Failed to delete local file ${localPath}:`, error);
      }
    }
  } else {
    await deleteFromCloudinary(publicId, resourceType);
  }
};
