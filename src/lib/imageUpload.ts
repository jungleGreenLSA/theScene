import imageCompression from 'browser-image-compression'

// Compress a File before upload. Targets ~2560px on the longest edge and
// keeps files ≲2.5 MB — generous enough that we're not the source of
// grain/banding on photos that went through a phone's encoder first.
// Skips non-image files and already-reasonable files.
export async function compressImage(file: File, opts: { maxSizeMB?: number; maxWidthOrHeight?: number; initialQuality?: number } = {}): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size < 1.5 * 1024 * 1024) return file // already a reasonable size

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB ?? 2.5,
      maxWidthOrHeight: opts.maxWidthOrHeight ?? 2560,
      initialQuality: opts.initialQuality ?? 0.92,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
    })
    // Preserve original filename so extension logic in callers keeps working
    return new File([compressed], file.name, { type: compressed.type, lastModified: Date.now() })
  } catch {
    return file // compression failed; hand back the original
  }
}
