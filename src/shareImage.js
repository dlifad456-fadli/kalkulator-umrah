import { toPng } from 'html-to-image';

/**
 * Capture a DOM element as PNG and share via Web Share API or download fallback.
 * @returns {'shared' | 'downloaded'} how the image was delivered
 */
export async function shareElementAsImage(element, { filename, title, backgroundColor = '#ffffff' }) {
  if (!element) {
    throw new Error('Elemen capture tidak ditemukan.');
  }

  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor
  });

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return 'shared';
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
