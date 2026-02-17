'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id: string
  title: string
  description: string | null
  image_url: string
  link_url: string | null
  open_in_new_tab?: boolean
}

interface BannerSliderProps {
  banners: Banner[]
}

export function BannerSlider({ banners }: BannerSliderProps) {
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [autoPlay, banners.length])

  if (banners.length === 0) return null

  const handlePrev = () => {
    setAutoPlay(false)
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length)
    setTimeout(() => setAutoPlay(true), 8000)
  }

  const handleNext = () => {
    setAutoPlay(false)
    setCurrent((prev) => (prev + 1) % banners.length)
    setTimeout(() => setAutoPlay(true), 8000)
  }

  const activeBanner = banners[current]

  return (
    <div className="relative w-full bg-gray-900 overflow-hidden rounded-lg">
      {/* Banner content */}
      <div className="relative aspect-video">
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${idx === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
          >
            {banner.link_url ? (
              <Link
                href={banner.link_url}
                target={banner.open_in_new_tab ? '_blank' : undefined}
                rel={banner.open_in_new_tab ? 'noopener noreferrer' : undefined}
                className="block w-full h-full relative group"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">
                      {banner.title}
                    </h2>
                    {banner.description && (
                      <p className="text-gray-200 text-sm md:text-base mb-4">
                        {banner.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="w-full h-full relative">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">
                      {banner.title}
                    </h2>
                    {banner.description && (
                      <p className="text-gray-200 text-sm md:text-base mb-4">
                        {banner.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-colors"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-colors"
              aria-label="Proximo banner"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAutoPlay(false)
                  setCurrent(idx)
                  setTimeout(() => setAutoPlay(true), 8000)
                }}
                className={`h-2 rounded-full transition-all ${idx === current
                  ? 'bg-white w-8'
                  : 'bg-white/50 w-2 hover:bg-white/75'
                  }`}
                aria-label={`Ir para banner ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
