import { Storage } from '@google-cloud/storage';

import { allowFallbacks, config } from '../config.js';

let storage: Storage | null = null;
const signedUrlTtlMs = 15 * 60 * 1000;

export async function uploadCropImage(userId: string, imageBase64?: string, imageMimeType = 'image/jpeg') {
  if (!imageBase64) return undefined;
  if (!config.gcsBucket) {
    if (!allowFallbacks()) throw new Error('Google Cloud Storage is required for production image diagnosis.');
    return undefined;
  }

  storage ??= new Storage();
  const buffer = Buffer.from(imageBase64, 'base64');
  const extension = imageMimeType.includes('png') ? 'png' : 'jpg';
  const path = `crop-images/${userId}/${Date.now()}.${extension}`;
  const file = storage.bucket(config.gcsBucket).file(path);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: imageMimeType,
      cacheControl: 'private, max-age=31536000',
    },
  });

  return `gs://${config.gcsBucket}/${path}`;
}

export async function getCropImageDisplayURL(imageURL?: string) {
  if (!imageURL) return undefined;
  if (/^https?:\/\//.test(imageURL)) return imageURL;
  if (!imageURL.startsWith('gs://')) return undefined;

  const parsed = parseGsUrl(imageURL);
  if (!parsed) return undefined;
  if (!config.gcsBucket) {
    if (!allowFallbacks()) throw new Error('Google Cloud Storage is required to read production crop images.');
    return undefined;
  }

  storage ??= new Storage();
  const [url] = await storage
    .bucket(parsed.bucket)
    .file(parsed.path)
    .getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + signedUrlTtlMs,
    });
  return url;
}

function parseGsUrl(imageURL: string) {
  const withoutScheme = imageURL.slice('gs://'.length);
  const slashIndex = withoutScheme.indexOf('/');
  if (slashIndex <= 0) return null;
  return {
    bucket: withoutScheme.slice(0, slashIndex),
    path: withoutScheme.slice(slashIndex + 1),
  };
}
