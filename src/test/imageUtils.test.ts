import { describe, it, expect } from 'vitest';
import { resolveImageUrl } from '../utils/imageUtils';

/**
 * Asking the CDN for an image the size of the slot it goes into.
 *
 * Measured against production on 2026-08-21: the first six course thumbnails came to 296 KB, one
 * of them 167 KB by itself, for cards 192px tall. Format and quality were already negotiated —
 * only the dimensions never were, so Cloudinary kept sending the full-resolution original.
 * Adding a width brought the same six down to 115 KB.
 */

const CLOUDINARY = 'https://res.cloudinary.com/downhed3f/image/upload/v1776369935/devanshedutech/courses/abc';

describe('resolveImageUrl', () => {
  it('asks Cloudinary for the width the slot actually needs', () => {
    expect(resolveImageUrl(CLOUDINARY, 600))
      .toContain('/upload/f_auto,q_auto,w_600,c_limit/');
  });

  it('shrinks a large image but never stretches a small one', () => {
    // c_limit is the half that matters here. Without it a modest upload gets scaled up into a
    // blurry one, which is a worse outcome than the slow image this is meant to fix.
    expect(resolveImageUrl(CLOUDINARY, 600)).toContain('c_limit');
  });

  it('still negotiates format and quality when no width is given', () => {
    expect(resolveImageUrl(CLOUDINARY)).toContain('/upload/f_auto,q_auto/');
    expect(resolveImageUrl(CLOUDINARY)).not.toContain('w_');
  });

  it('leaves URLs from other hosts alone', () => {
    // Unsplash carries its own sizing in the query string; rewriting it would break the URL.
    const unsplash = 'https://images.unsplash.com/photo-1526379095098?auto=format&w=800';
    expect(resolveImageUrl(unsplash, 600)).toBe(unsplash);
  });

  it('passes a data URI through untouched', () => {
    const data = 'data:image/jpeg;base64,/9j/4AAQ';
    expect(resolveImageUrl(data, 600)).toBe(data);
  });

  it('returns an empty string for a course with no image', () => {
    // The card checks this to decide between a photograph and its placeholder, so it has to stay
    // falsy rather than becoming a URL that will 404.
    expect(resolveImageUrl(undefined, 600)).toBe('');
    expect(resolveImageUrl('', 600)).toBe('');
  });
});
