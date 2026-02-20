'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
        Sem imagem
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={images[selectedIndex]}
          alt={productName}
          width={800}
          height={800}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? 'border-black' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={img}
                alt=""
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
