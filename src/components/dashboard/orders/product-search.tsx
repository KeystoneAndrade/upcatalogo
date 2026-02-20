'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface ProductSearchProps {
    onSelect: (product: any) => void
    tenantId: string
}

export function ProductSearch({ onSelect, tenantId }: ProductSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                searchProducts()
            } else {
                setResults([])
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query])

    async function searchProducts() {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('produtos')
            .select('*')
            .eq('loja_id', tenantId)
            .ilike('name', `%${query}%`)
            .limit(10)

        if (data) setResults(data)
        setLoading(false)
        setShowResults(true)
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar produtos para adicionar..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8"
                    onFocus={() => setShowResults(true)}
                />
                {loading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                                onSelect(product)
                                setShowResults(false)
                                setQuery('')
                                setResults([])
                            }}
                        >
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-500" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(product.price)} • Estoque: {product.manage_stock ? product.stock_quantity : 'infinito'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
