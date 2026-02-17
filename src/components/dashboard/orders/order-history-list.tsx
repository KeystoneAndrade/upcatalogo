'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface HistoryItem {
    id: string
    type: string
    description: string
    created_at: string
    user_id: string | null
}

export function OrderHistoryList({ orderId }: { orderId: string }) {
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadHistory()
    }, [orderId])

    async function loadHistory() {
        const supabase = createClient()
        const { data } = await supabase
            .from('order_history')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })

        if (data) {
            setHistory(data)
        }
        setLoading(false)
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l border-gray-200 ml-3 space-y-6">
                    {history.map((item) => (
                        <div key={item.id} className="mb-8 ml-6 relative">
                            <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white">
                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                            </span>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                                <h3 className="text-base font-semibold text-gray-900">{getTypeLabel(item.type)}</h3>
                                <time className="block mb-2 text-sm font-normal leading-none text-gray-400 sm:mb-0">
                                    {formatDateTime(item.created_at)}
                                </time>
                            </div>
                            <p className="text-base font-normal text-gray-500">{item.description}</p>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <p className="text-sm text-gray-500 ml-6">Nenhum histórico registrado.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function getTypeLabel(type: string) {
    switch (type) {
        case 'status_change': return 'Alteração de Status'
        case 'item_change': return 'Alteração de Itens'
        case 'stock_change': return 'Alteração de Estoque'
        case 'creation': return 'Pedido Criado'
        case 'update': return 'Atualização'
        default: return 'Nota'
    }
}
