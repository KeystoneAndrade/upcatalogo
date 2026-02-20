'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, X, Loader2, Crop } from 'lucide-react'
import { toast } from 'sonner'
import {
  compressImage,
  uploadProductImage,
  deleteProductImage,
  getCroppedImage,
} from '@/lib/image-upload'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  tenantId: string
  productId: string
  aspectRatio?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ImageUpload({
  value,
  onChange,
  tenantId,
  productId,
  aspectRatio = 1,
  className,
  size = 'md',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-32 w-32',
    lg: 'h-48 w-48',
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande (max 10MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setRawImageSrc(reader.result as string)
      setCropDialogOpen(true)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  async function handleCropConfirm() {
    if (!rawImageSrc || !croppedAreaPixels) return
    setUploading(true)
    setCropDialogOpen(false)
    try {
      const croppedFile = await getCroppedImage(rawImageSrc, croppedAreaPixels)
      const compressed = await compressImage(croppedFile)
      const result = await uploadProductImage(compressed, tenantId, productId)
      if (value) {
        deleteProductImage(value).catch(() => {})
      }
      onChange(result.url)
      toast.success('Imagem enviada!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
      setRawImageSrc(null)
    }
  }

  function handleRemove() {
    if (value) {
      deleteProductImage(value).catch(() => {})
      onChange(null)
    }
  }

  return (
    <>
      <div className={`relative group ${sizeClasses[size]} ${className || ''}`}>
        {value ? (
          <div className="relative w-full h-full">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg border"
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <label className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors bg-gray-50">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-[10px] text-gray-400">Enviar</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
        {uploading && value && (
          <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-lg" onClose={() => setCropDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Recortar imagem
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[300px] bg-gray-900 rounded-lg overflow-hidden mt-4">
            {rawImageSrc && (
              <Cropper
                image={rawImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-black"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setCropDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCropConfirm} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
