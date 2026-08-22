import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachable, canShareFiles, fetchFiles, shareFiles, downloadFiles } from '../lib/attachFiles';
import { AssetDTO } from '../dtos';

/**
 * Turning the brochure and the video into real attachments.
 *
 * A WhatsApp deep link carries text and nothing else, so the files have to travel some other
 * way. These describe that other way: hand the actual bytes to the share sheet where the browser
 * allows it, and save them to be dragged in where it does not.
 */

const asset = (over: Partial<AssetDTO> = {}): AssetDTO => ({
  id: 'a1', key: 'brochure', name: 'Institute brochure', type: 'PDF',
  url: 'https://example.test/b', sizeLabel: '2 MB', sizeBytes: 2 * 1024 * 1024,
  tracked: true, active: true, ...over,
} as AssetDTO);

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('attachable', () => {
  it('takes the things that are actually files', () => {
    const items = [asset(), asset({ id: 'a2', type: 'VIDEO' }), asset({ id: 'a3', type: 'IMAGE' })];
    expect(attachable(items)).toHaveLength(3);
  });

  it('leaves links alone — they are already text in the message', () => {
    expect(attachable([asset({ type: 'LINK' })])).toHaveLength(0);
  });
});

describe('fetchFiles', () => {
  it('names the file something a student will recognise', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, blob: async () => new Blob(['x'], { type: 'application/pdf' }),
    }));

    const { files } = await fetchFiles([asset({ name: 'AI Launchpad — syllabus' })]);

    // Not the UUID the server stores it under, which is what WhatsApp would otherwise show.
    expect(files[0].name).toBe('AI Launchpad _ syllabus.pdf');
  });

  it('does not add a second extension to a name that already has one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, blob: async () => new Blob(['x'], { type: 'application/pdf' }),
    }));

    const { files } = await fetchFiles([asset({ name: 'brochure.pdf' })]);
    expect(files[0].name).toBe('brochure.pdf');
  });

  it('skips a file too large to attach without losing the small ones', async () => {
    // A 200 MB film and a 2 MB syllabus should not mean the syllabus goes as a link too.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, blob: async () => new Blob(['x'], { type: 'application/pdf' }),
    }));

    const { files, skipped } = await fetchFiles([
      asset({ id: 'big', name: 'Full seminar', type: 'VIDEO', sizeBytes: 200 * 1024 * 1024 }),
      asset({ id: 'small', name: 'Syllabus' }),
    ]);

    expect(skipped.map(s => s.id)).toEqual(['big']);
    expect(files.map(f => f.name)).toEqual(['Syllabus.pdf']);
  });

  it('one unreachable file does not cost the others', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({ ok: true, blob: async () => new Blob(['x'], { type: 'application/pdf' }) }));

    const { files, skipped } = await fetchFiles([
      asset({ id: 'gone', name: 'Missing' }),
      asset({ id: 'here', name: 'Syllabus' }),
    ]);

    expect(skipped.map(s => s.id)).toEqual(['gone']);
    expect(files).toHaveLength(1);
  });
});

describe('shareFiles', () => {
  it('reports success when the sheet accepted the files', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, canShare: () => true });

    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    expect(await shareFiles('Hello', [file])).toBe(true);
    expect(share).toHaveBeenCalled();
  });

  it('treats a cancelled share as done, not as a failure', async () => {
    // Cancelling throws AbortError. Falling back here would start downloading files the
    // counsellor just decided not to send.
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(abort), canShare: () => true });

    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    expect(await shareFiles('Hello', [file])).toBe(true);
  });

  it('reports failure when the browser will not take files, so a fallback can run', async () => {
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: () => false });

    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    expect(await shareFiles('Hello', [file])).toBe(false);
  });

  it('reports failure when there is no share support at all', async () => {
    vi.stubGlobal('navigator', {});
    expect(canShareFiles()).toBe(false);
    expect(await shareFiles('Hello', [new File(['x'], 'a.pdf')])).toBe(false);
  });
});

describe('downloadFiles', () => {
  it('saves one file per attachment and none for links', () => {
    const clicks: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.getAttribute('download') ?? '');
    });

    const saved = downloadFiles([
      asset({ id: 'a1', name: 'Syllabus' }),
      asset({ id: 'a2', name: 'Student review', type: 'VIDEO' }),
      asset({ id: 'a3', name: 'Book a demo', type: 'LINK' }),
    ]);

    expect(saved).toBe(2);
    expect(clicks).toEqual(['Syllabus.pdf', 'Student review.mp4']);
  });
});
