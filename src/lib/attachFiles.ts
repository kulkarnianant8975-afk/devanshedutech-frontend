import { AssetDTO } from '../dtos';
import { backendUrl } from '../services/api';

/**
 * Getting the actual brochure and video into the chat, rather than a link to them.
 *
 * A `whatsapp://send?text=` link carries text and nothing else. No parameter attaches a file, and
 * none is coming — it is a URL format, not an API. So a swipe can open the right chat with the
 * right message, and that is the end of what it can do.
 *
 * Two things can carry a real file, and both are here:
 *
 * The share sheet (`navigator.share` with `files`) hands the operating system the actual bytes.
 * Picking WhatsApp from it produces a genuine attachment — the document icon, the video that
 * plays in the chat. The cost is that the sheet chooses the contact, so it cannot be aimed at
 * one student the way the deep link can.
 *
 * Downloading puts the files on the counsellor's machine so they can be dragged into WhatsApp
 * Desktop, which is where a lot of this work happens anyway. Slower, and it always works.
 */

/** Above this, a file is left as a link. Fetching it into memory to attach it is not worth it. */
const TOTAL_CAP = 64 * 1024 * 1024;

/** Only these become files. A LINK is already text in the message. */
const ATTACHABLE = new Set(['PDF', 'VIDEO', 'IMAGE']);

export const attachable = (assets: AssetDTO[]): AssetDTO[] =>
  assets.filter(a => ATTACHABLE.has(a.type));

/** Whether this browser can hand real files to the share sheet. */
export const canShareFiles = (): boolean =>
  typeof navigator !== 'undefined'
  && typeof navigator.share === 'function'
  && typeof navigator.canShare === 'function';

const downloadUrl = (asset: AssetDTO): string =>
  `${backendUrl}/api/assets/${asset.id}/download`;

const extensionFor = (type: string): string =>
  type === 'VIDEO' ? '.mp4' : type === 'IMAGE' ? '.jpg' : '.pdf';

/** A filename a student will recognise in their chat, not a UUID. */
const filenameFor = (asset: AssetDTO): string => {
  const base = asset.name.replace(/[^A-Za-z0-9.\- ]+/g, '_').trim() || 'Attachment';
  const extension = extensionFor(asset.type);
  return base.toLowerCase().endsWith(extension) ? base : base + extension;
};

/**
 * Pulls the files down so they can be handed to the share sheet.
 *
 * Stops at the cap rather than failing: a 200 MB film and a 2 MB syllabus should not mean the
 * syllabus goes as a link too. Whatever fits is attached; the rest stays in the message as a
 * link, which is what it would have been anyway.
 */
export const fetchFiles = async (assets: AssetDTO[]): Promise<{ files: File[]; skipped: AssetDTO[] }> => {
  const files: File[] = [];
  const skipped: AssetDTO[] = [];
  let total = 0;

  for (const asset of attachable(assets)) {
    if (asset.sizeBytes && total + asset.sizeBytes > TOTAL_CAP) { skipped.push(asset); continue; }
    try {
      const response = await fetch(downloadUrl(asset), { credentials: 'include' });
      if (!response.ok) { skipped.push(asset); continue; }
      const blob = await response.blob();
      if (total + blob.size > TOTAL_CAP) { skipped.push(asset); continue; }
      total += blob.size;
      files.push(new File([blob], filenameFor(asset), { type: blob.type }));
    } catch {
      // One unreachable file must not cost the others. It stays a link in the message.
      skipped.push(asset);
    }
  }

  return { files, skipped };
};

/**
 * Hands the files to the operating system's share sheet.
 *
 * Returns false when the browser will not take them, so the caller can fall back to downloading
 * rather than leaving somebody with nothing.
 */
export const shareFiles = async (text: string, files: File[]): Promise<boolean> => {
  if (!canShareFiles() || files.length === 0) return false;
  const payload = { text, files };
  if (!navigator.canShare(payload)) return false;
  try {
    await navigator.share(payload);
    return true;
  } catch (err) {
    // Cancelling the sheet throws AbortError. That is a decision, not a failure, and must not
    // trigger a fallback that starts downloading files they just declined to send.
    if ((err as Error)?.name === 'AbortError') return true;
    return false;
  }
};

/** Saves the files locally, to be dragged into WhatsApp Desktop. */
export const downloadFiles = (assets: AssetDTO[]): number => {
  const items = attachable(assets);
  for (const asset of items) {
    const a = document.createElement('a');
    a.href = downloadUrl(asset);
    a.download = filenameFor(asset);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  return items.length;
};
