import { afterEach, describe, expect, test } from 'bun:test';

import { config } from '../config.js';
import { getCropImageDisplayURL, uploadCropImage } from '../services/storage.js';

const originalNodeEnv = config.nodeEnv;
const originalGcsBucket = config.gcsBucket;

afterEach(() => {
  config.nodeEnv = originalNodeEnv;
  config.gcsBucket = originalGcsBucket;
});

describe('crop image storage', () => {
  test('allows local development diagnosis without a GCS bucket', async () => {
    config.nodeEnv = 'development';
    config.gcsBucket = undefined;

    await expect(uploadCropImage('farmer-a', Buffer.from('fake-image').toString('base64'))).resolves.toBeUndefined();
  });

  test('rejects production image diagnosis when GCS is missing', async () => {
    config.nodeEnv = 'production';
    config.gcsBucket = undefined;

    await expect(uploadCropImage('farmer-a', Buffer.from('fake-image').toString('base64'))).rejects.toThrow(
      'Google Cloud Storage is required for production image diagnosis.',
    );
  });

  test('does not require storage when no image is submitted', async () => {
    config.nodeEnv = 'production';
    config.gcsBucket = undefined;

    await expect(uploadCropImage('farmer-a')).resolves.toBeUndefined();
  });

  test('passes through already displayable image URLs', async () => {
    config.nodeEnv = 'production';
    config.gcsBucket = undefined;

    const url = 'https://storage.example.com/crop.jpg';
    await expect(getCropImageDisplayURL(url)).resolves.toBe(url);
  });

  test('rejects production GCS image reads when GCS is missing', async () => {
    config.nodeEnv = 'production';
    config.gcsBucket = undefined;

    await expect(getCropImageDisplayURL('gs://wheaty-crop-images/crop-images/farmer-a/image.jpg')).rejects.toThrow(
      'Google Cloud Storage is required to read production crop images.',
    );
  });
});
