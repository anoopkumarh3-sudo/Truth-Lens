import { supabase } from '../lib/supabase';
import { AnalysisType } from '../types/database';
import { generateUUID } from './analysisService';

export const MAX_FILE_SIZES: Record<AnalysisType, number> = {
  image: 10 * 1024 * 1024, // 10 MB
  audio: 20 * 1024 * 1024, // 20 MB
  video: 50 * 1024 * 1024, // 50 MB
  linklens: 0, // URL only
  websentinel: 0, // URL only
  qrguard: 10 * 1024 * 1024, // 10 MB
  reorigin: 15 * 1024 * 1024, // 15 MB
};

export const ALLOWED_MIME_TYPES: Record<AnalysisType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  linklens: [],
  websentinel: [],
  qrguard: ['image/jpeg', 'image/png', 'image/webp'],
  reorigin: ['image/jpeg', 'image/png', 'image/webp'],
};

export interface UploadResult {
  path: string;
  fullPath: string;
  fileId: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Uploads media to private 'media' bucket: {userId}/{fileId}/{sanitizedFileName}
 */
export async function uploadMedia(
  file: File,
  userId: string,
  analysisType: AnalysisType
): Promise<{ data: UploadResult | null; error: Error | null }> {
  try {
    const maxSize = MAX_FILE_SIZES[analysisType] || 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024));
      return {
        data: null,
        error: new Error(`File size exceeds limit of ${maxMb} MB for ${analysisType}.`),
      };
    }

    const allowed = ALLOWED_MIME_TYPES[analysisType];
    if (allowed && allowed.length > 0 && !allowed.includes(file.type)) {
      return {
        data: null,
        error: new Error(`Unsupported file type: ${file.type || 'unknown'}. Allowed: ${allowed.join(', ')}`),
      };
    }

    const fileId = generateUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${fileId}/${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        path: storagePath,
        fullPath: data.fullPath,
        fileId,
        fileName: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function getSignedMediaUrl(
  path: string,
  expiresInSeconds: number = 3600
): Promise<{ signedUrl: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(path, expiresInSeconds);

    if (error) return { signedUrl: null, error };
    return { signedUrl: data.signedUrl, error: null };
  } catch (err: any) {
    return { signedUrl: null, error: err };
  }
}

export async function getSignedReportUrl(
  path: string,
  expiresInSeconds: number = 300
): Promise<{ signedUrl: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('reports')
      .createSignedUrl(path, expiresInSeconds);

    if (error) return { signedUrl: null, error };
    return { signedUrl: data.signedUrl, error: null };
  } catch (err: any) {
    return { signedUrl: null, error: err };
  }
}
