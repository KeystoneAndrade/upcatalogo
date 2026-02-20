'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ImageUpload } from './image-upload'
import { GripVertical, Star, X, ImageIcon } from 'lucide-react'
import { deleteProductImage } from '@/lib/image-upload'

interface ProductGalleryProps {
  images: string[]
  onChange: (images: string[]) => void
  tenantId: string
  productId: string
  maxImages?: number
}

export function ProductGallery({
  images,
  onChange,
  tenantId,
  productId,
  maxImages = 8,
}: ProductGalleryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = images.indexOf(active.id as string)
    const newIndex = images.indexOf(over.id as string)
    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(images, oldIndex, newIndex))
    }
  }

  function handleImageUploaded(url: string) {
    onChange([...images, url])
  }

  function handleImageRemoved(url: string) {
    deleteProductImage(url).catch(() => {})
    onChange(images.filter(img => img !== url))
  }

  const canAddMore = images.length < maxImages

  if (images.length === 0) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <ImageUpload
            value={null}
            onChange={(url) => url && handleImageUploaded(url)}
            tenantId={tenantId}
            productId={productId}
            size="lg"
          />
          <div className="col-span-3 flex items-center">
            <div className="text-sm text-muted-foreground">
              <ImageIcon className="h-5 w-5 mb-1 inline-block mr-1" />
              Clique para adicionar a primeira imagem do produto.
              <br />
              <span className="text-xs">A imagem sera recortada e otimizada automaticamente.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, index) => (
              <SortableImageItem
                key={img}
                url={img}
                isMain={index === 0}
                onRemove={() => handleImageRemoved(img)}
              />
            ))}
            {canAddMore && (
              <ImageUpload
                value={null}
                onChange={(url) => url && handleImageUploaded(url)}
                tenantId={tenantId}
                productId={productId}
                size="md"
                className="!h-full !w-full aspect-square"
              />
            )}
          </div>
        </SortableContext>
      </DndContext>
      <p className="text-xs text-muted-foreground">
        {images.length}/{maxImages} imagens. Arraste para reordenar. A primeira e a imagem principal.
      </p>
    </div>
  )
}

function SortableImageItem({
  url,
  isMain,
  onRemove,
}: {
  url: string
  isMain: boolean
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-square">
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover rounded-lg border"
      />
      {isMain && (
        <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Star className="h-2.5 w-2.5 fill-current" /> Principal
        </span>
      )}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 right-7 bg-white/80 rounded p-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <GripVertical className="h-3.5 w-3.5 text-gray-600" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
