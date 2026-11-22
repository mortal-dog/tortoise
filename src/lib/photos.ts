// Progress photos (implementation Phase 9): taken or picked on the phone, shrunk to a JPEG of at most 1280 px on the
// long side, and kept only in this phone's database and its backups. Nothing leaves the phone.
import type { LocalDate } from './dates'
import { notifyChange } from './live'
import { newId, nowIso, type PhotoRecord } from './records'
import { getDb } from './repo'

export const PHOTO_MAX_PX = 1280
export const PHOTO_QUALITY = 0.8

/** The size a photo is shrunk to, keeping its shape; a smaller photo keeps its size. */
export function fitWithin(
  width: number,
  height: number,
  max = PHOTO_MAX_PX,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Decodes an image file and re-encodes it as a JPEG data URL of at most PHOTO_MAX_PX. */
export async function shrinkPhoto(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = fitWithin(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot draw the photo.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', PHOTO_QUALITY)
}

export async function getPhotos(): Promise<PhotoRecord[]> {
  const list = await (await getDb()).getAll('photos')
  return list.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.updatedAt.localeCompare(a.updatedAt),
  )
}

export async function addPhoto(date: LocalDate, dataUrl: string, note?: string): Promise<PhotoRecord> {
  const rec: PhotoRecord = { id: newId(), date, dataUrl, ...(note ? { note } : {}), updatedAt: nowIso() }
  await (await getDb()).put('photos', rec)
  notifyChange()
  return rec
}

export async function deletePhoto(id: string): Promise<void> {
  await (await getDb()).delete('photos', id)
  notifyChange()
}
