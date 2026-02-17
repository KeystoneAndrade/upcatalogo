'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTenantSettings } from '@/components/storefront/tenant-settings-provider'

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
  const { banners_per_view = 1 } = useTenantSettings()
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  const chunks = useMemo(() => {
    if (!banners) return []
    // No mobile sempre 1, no desktop respeita a config
    // Mas aqui vamos simplificar para o slide comportar N items
    const result = []
    for (let i = 0; i < banners.length; i += banners_per_view) {
      result.push(banners.slice(i, i + banners_per_view))
    }
    return result
  }, [banners, banners_per_view])

  useEffect(() => {
    if (!autoPlay || chunks.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % chunks.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [autoPlay, chunks.length])

  if (!chunks || chunks.length === 0) return null

  const handlePrev = () => {
    setAutoPlay(false)
    setCurrent((prev) => (prev - 1 + chunks.length) % chunks.length)
    setTimeout(() => setAutoPlay(true), 8000)
  }

  const handleNext = () => {
    setAutoPlay(false)
    setCurrent((prev) => (prev + 1) % chunks.length)
    setTimeout(() => setAutoPlay(true), 8000)
  }

  const activeBanner = banners[current]

  return (
    <div className="relative w-full bg-gray-900 overflow-hidden rounded-lg">
      {/* Banner content */}
      <div className="relative aspect-[21/9] md:aspect-video">
        {chunks.map((chunk, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500  ${idx === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
          >
            <div className={`grid h-full grid-cols-1 gap-2 p-2 ${banners_per_view === 2 ? 'md:grid-cols-2' :
                banners_per_view === 3 ? 'md:grid-cols-3' :
                  banners_per_view === 4 ? 'md:grid-cols-4' : ''
              }`}>
              {chunk.map((banner) => (
                <div key={banner.id} className="relative h-full overflow-hidden rounded-md">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                        <div className="text-white">
                          <h2 className="text-xl md:text-2xl font-bold mb-1 leading-tight">
                            {banner.title}
                          </h2>
                          {banner.description && (
                            <p className="text-gray-200 text-xs md:text-sm line-clamp-1">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                        <div className="text-white">
                          <h2 className="text-xl md:text-2xl font-bold mb-1 leading-tight">
                            {banner.title}
                          </h2>
                          {banner.description && (
                            <p className="text-gray-200 text-xs md:text-sm line-clamp-1">
                              {banner.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Navigation arrows */}
        {chunks.length > 1 && (
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
        {chunks.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {chunks.map((_, idx) => (
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
