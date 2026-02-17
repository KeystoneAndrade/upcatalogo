'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, Tag, TicketPercent } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [tenantId, setTenantId] = useState('')
    const supabase = createClient()

    // Coupon dialog
    const [couponDialogOpen, setCouponDialogOpen] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<any>(null)
    const [savingCoupon, setSavingCoupon] = useState(false)

    useEffect(() => { loadData() }, [])

    async function loadData() {
        const { data: { session } } = await supabase.auth.getSession()
        const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', session!.user.id).single()
        setTenantId(tenant!.id)

        const { data } = await supabase
            .from('coupons')
            .select('*')
            .eq('tenant_id', tenant!.id)
            .order('created_at', { ascending: false })

        setCoupons(data || [])
        setLoading(false)
    }

    function openNewCoupon() {
        setEditingCoupon(null)
        setCouponDialogOpen(true)
    }

    function openEditCoupon(coupon: any) {
        setEditingCoupon(coupon)
        setCouponDialogOpen(true)
    }

    async function handleSaveCoupon(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSavingCoupon(true)
        const formData = new FormData(e.currentTarget)

        const code = (formData.get('code') as string).toUpperCase().trim()

        // Validate code
        if (!code) {
            toast.error('O código é obrigatório')
            setSavingCoupon(false)
            return
        }

        const couponData: any = {
            tenant_id: tenantId,
            code: code,
            discount_type: formData.get('discount_type') as string,
            discount_value: parseFloat(formData.get('discount_value') as string),
            min_purchase_amount: formData.get('min_purchase_amount') ? parseFloat(formData.get('min_purchase_amount') as string) : null,
            max_usage_limit: formData.get('max_usage_limit') ? parseInt(formData.get('max_usage_limit') as string) : null,
            expiration_date: formData.get('expiration_date') ? new Date(formData.get('expiration_date') as string).toISOString() : null,
            is_active: true, // Default active on create/edit logic can be customized
        }

        if (editingCoupon) {
            const { error } = await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id)
            if (error) { toast.error('Erro ao atualizar cupom'); setSavingCoupon(false); return }
            toast.success('Cupom atualizado!')
        } else {
            const { error } = await supabase.from('coupons').insert(couponData)
            if (error) {
                if (error.code === '23505') {
                    toast.error('Já existe um cupom com este código')
                } else {
                    toast.error('Erro ao criar cupom: ' + error.message)
                }
                setSavingCoupon(false)
                return
            }
            toast.success('Cupom criado!')
        }

        setCouponDialogOpen(false)
        setSavingCoupon(false)
        loadData()
    }

    async function handleDeleteCoupon(id: string) {
        if (!confirm('Excluir cupom permanentemente?')) return
        await supabase.from('coupons').delete().eq('id', id)
        toast.success('Cupom excluído!')
        loadData()
    }

    async function toggleStatus(id: string, currentStatus: boolean) {
        const { error } = await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id)
        if (error) { toast.error('Erro ao atualizar status'); return }
        loadData()
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
                <Button onClick={openNewCoupon}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Cupom
                </Button>
            </div>

            {coupons.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <TicketPercent className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum cupom cadastrado</p>
                        <p className="text-xs mt-1">Crie cupons para oferecer descontos aos seus clientes</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {coupons.map((coupon) => (
                        <Card key={coupon.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        <Tag className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{coupon.code}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}% OFF`
                                                : `${formatCurrency(coupon.discount_value)} OFF`
                                            }
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                            {coupon.min_purchase_amount && (
                                                <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                    Mínimo: {formatCurrency(coupon.min_purchase_amount)}
                                                </span>
                                            )}

                                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                Usos: {coupon.usage_count} {coupon.max_usage_limit ? `/ ${coupon.max_usage_limit}` : ''}
                                            </span>

                                            {coupon.expiration_date && (
                                                <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                    Expira em: {new Date(coupon.expiration_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 mr-4">
                                        <Label htmlFor={`active-${coupon.id}`} className="text-xs cursor-pointer">
                                            {coupon.is_active ? 'Ativo' : 'Inativo'}
                                        </Label>
                                        <Switch
                                            id={`active-${coupon.id}`}
                                            checked={coupon.is_active}
                                            onCheckedChange={() => toggleStatus(coupon.id, coupon.is_active)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => openEditCoupon(coupon)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Coupon Dialog */}
            <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
                <DialogContent onClose={() => setCouponDialogOpen(false)}>
                    <DialogHeader>
                        <DialogTitle>{editingCoupon ? 'Editar' : 'Novo'} Cupom</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveCoupon} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Código do Cupom *</Label>
                            <Input
                                id="code"
                                name="code"
                                required
                                defaultValue={editingCoupon?.code}
                                placeholder="Ex: BEMVINDO10"
                                className="uppercase"
                                onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="discount_type">Tipo de Desconto *</Label>
                                <Select name="discount_type" defaultValue={editingCoupon?.discount_type || 'percentage'} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount_value">Valor do Desconto *</Label>
                                <Input
                                    id="discount_value"
                                    name="discount_value"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    defaultValue={editingCoupon?.discount_value}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="min_purchase_amount">Mínimo no Carrinho (Opcional)</Label>
                            <Input
                                id="min_purchase_amount"
                                name="min_purchase_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={editingCoupon?.min_purchase_amount}
                                placeholder="R$ 0,00"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="max_usage_limit">Limite de Usos (Opcional)</Label>
                                <Input
                                    id="max_usage_limit"
                                    name="max_usage_limit"
                                    type="number"
                                    min="1"
                                    defaultValue={editingCoupon?.max_usage_limit}
                                    placeholder="Ilimitado"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expiration_date">Validade (Opcional)</Label>
                                <Input
                                    id="expiration_date"
                                    name="expiration_date"
                                    type="date"
                                    defaultValue={editingCoupon?.expiration_date ? new Date(editingCoupon.expiration_date).toISOString().split('T')[0] : ''}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setCouponDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={savingCoupon}>
                                {savingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Cupom
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
