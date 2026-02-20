import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

const BUCKET = 'product-images'

export interface UploadResult {
  url: string
  path: string
}

/**
 * Compress and convert image to WebP, max 800px, quality 0.8
 */
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
  })
}

/**
 * Upload a compressed image to Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  tenantId: string,
  productId: string
): Promise<UploadResult> {
  const supabase = createClient()
  const fileId = crypto.randomUUID()
  const path = `${tenantId}/${productId}/${fileId}.webp`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return { url: data.publicUrl, path }
}

/**
 * Delete a single image from storage by its public URL.
 * Silently ignores external URLs.
 */
export async function deleteProductImage(publicUrl: string): Promise<void> {
  if (!isStorageUrl(publicUrl)) return

  const supabase = createClient()
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return

  const path = decodeURIComponent(publicUrl.substring(idx + marker.length))
  await supabase.storage.from(BUCKET).remove([path])
}

/**
 * Delete multiple images from storage by their public URLs.
 */
export async function deleteProductImages(urls: string[]): Promise<void> {
  const storageUrls = urls.filter(isStorageUrl)
  if (storageUrls.length === 0) return

  const supabase = createClient()
  const marker = `/object/public/${BUCKET}/`

  const paths = storageUrls
    .map(url => {
      const idx = url.indexOf(marker)
      return idx !== -1 ? decodeURIComponent(url.substring(idx + marker.length)) : null
    })
    .filter(Boolean) as string[]

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths)
  }
}

/**
 * Check if a URL is a Supabase storage URL (vs external)
 */
export function isStorageUrl(url: string): boolean {
  return url.includes(`supabase.co/storage/v1/object/public/${BUCKET}/`)
}

/**
 * Create a cropped image from canvas crop data
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'))
        resolve(new File([blob], 'cropped.webp', { type: 'image/webp' }))
      },
      'image/webp',
      0.92
    )
  })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.crossOrigin = 'anonymous'
    img.src = url
  })
}
