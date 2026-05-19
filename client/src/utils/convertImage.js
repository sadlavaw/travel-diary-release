function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => resolve(ev.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress a data-URL to fit within targetKB.
 * Tries quality steps from 0.90 down to 0.55, then shrinks width if still too large.
 */
async function compressToTarget(dataUrl, { maxWidth = 1920, targetKB = 400 } = {}) {
  const targetChars = targetKB * 1024 * 1.37 // base64 overhead ~37%

  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })

  const drawAt = (w, h, quality) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  }

  let w = img.naturalWidth
  let h = img.naturalHeight

  // Scale down if wider than maxWidth
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w)
    w = maxWidth
  }

  // Try decreasing quality first
  const qualities = [0.90, 0.83, 0.76, 0.68, 0.60, 0.55]
  for (const q of qualities) {
    const result = drawAt(w, h, q)
    if (result.length <= targetChars) return result
  }

  // If still too large, halve the width and try again
  w = Math.round(w / 2)
  h = Math.round(h / 2)
  return drawAt(w, h, 0.75)
}

export async function toDataUrl(file) {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)

  let dataUrl
  if (isHeic) {
    try {
      const heic2any = (await import('heic2any')).default
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
      dataUrl = await readFileAsDataUrl(Array.isArray(blob) ? blob[0] : blob)
    } catch {
      dataUrl = await readFileAsDataUrl(file)
    }
  } else {
    dataUrl = await readFileAsDataUrl(file)
  }

  // Skip compression for tiny files (already small enough)
  if (file.size < 200_000) return dataUrl

  return compressToTarget(dataUrl)
}
