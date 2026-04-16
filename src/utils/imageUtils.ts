/**
 * Compresses an image and converts it to a Base64 string.
 * @param file The file to compress.
 * @param maxWidth The maximum width of the compressed image.
 * @param maxHeight The maximum height of the compressed image.
 * @param quality The quality of the compressed image (0 to 1).
 * @returns A promise that resolves to the Base64 string.
 */
export const compressImage = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.6
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to Base64 with high quality but smaller size
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

import { backendUrl } from '../services/api';

export const resolveImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return backendUrl ? `${backendUrl}${url}` : url;
};

export const MAX_IMAGE_SIZE_MB = 15;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Uploads an image file to the backend, which stores it on Cloudinary CDN.
 * Returns a secure HTTPS CDN URL — nothing is stored in the database.
 *
 * @param file     The image file to upload
 * @param folder   Sub-folder: 'mentors' | 'courses' | 'placed-students'
 * @param apiBase  API base URL (same as backendUrl from api.ts)
 * @returns        Secure Cloudinary CDN URL
 */
export const uploadImageToCDN = async (
  file: File,
  folder: 'mentors' | 'courses' | 'placed-students',
  apiBase: string = ''
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint = `${apiBase}/api/upload/image?folder=${folder}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    credentials: 'include', // Required for session-based auth
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || `Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.url as string;
};

/**
 * ─────────────────────────────────────────────────────────────
 * OPTION B: ImgBB (100% free, no backend change needed!)
 * Uploads directly from browser, returns a permanent CDN URL.
 *
 * Setup (30 seconds):
 *   1. Go to https://api.imgbb.com  → Sign up free → copy API key
 *   2. Add to .env:  VITE_IMGBB_API_KEY=your_key_here
 *   3. In AdminMentors/AdminCourses replace:
 *        uploadImageToCDN(file, 'mentors', backendUrl)
 *      with:
 *        uploadImageToImgBB(file)
 * ─────────────────────────────────────────────────────────────
 */
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error('Set VITE_IMGBB_API_KEY in your .env file');

  // Compress first (max 1024px, 85% quality) then upload
  const base64 = await compressImage(file, 1024, 1024, 0.85);
  const base64Data = base64.split(',')[1]; // strip "data:image/jpeg;base64,"

  const formData = new FormData();
  formData.append('image', base64Data);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`ImgBB upload failed (${res.status})`);

  const data = await res.json();
  return data.data.display_url as string; // Permanent HTTPS CDN URL
};
