import imageCompression from 'browser-image-compression'

// Compress a File before upload. Targets ~1600px on the longest edge
// and keeps files well under 500 KB for typical phone photos. Skips
// non-image files and already-tiny files.
export async function compressImage(file: File, opts: { maxSizeMB?: number; maxWidthOrHeight?: number } = {}): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size < 400 * 1024) return file // already small enough

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB ?? 0.5,
      maxWidthOrHeight: opts.maxWidthOrHeight ?? 1600,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
    })
    // Preserve original filename so extension logic in callers keeps working
    return new File([compressed], file.name, { type: compressed.type, lastModified: Date.now() })
  } catch {
    return file // compression failed; hand back the original
  }
}
