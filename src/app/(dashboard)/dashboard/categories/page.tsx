'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { buildCategoryTree, flattenTree, type CategoryNode } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, ChevronRight, FolderOpen, Folder } from 'lucide-react'
import { toast } from 'sonner'
import { getCategories, saveCategory, deleteCategory } from '@/services/category-service'
import { getTenant } from '@/services/tenant-service'

function CategoryTreeItem({
  node,
  level,
  onEdit,
  onDelete,
}: {
  node: CategoryNode
  level: number
  onEdit: (cat: any) => void
  onDelete: (id: string) => void
}) {
  const hasChildren = node.children.length > 0

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b last:border-0">
        <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 24}px` }}>
          {level > 0 && (
            <ChevronRight className="h-3 w-3 text-gray-400" />
          )}
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-yellow-500" />
          ) : (
            <Folder className="h-4 w-4 text-gray-400" />
          )}
          <span className="font-medium">{node.name}</span>
          <Badge variant={node.is_active ? 'default' : 'secondary'}>
            {node.is_active ? 'Ativa' : 'Inativa'}
          </Badge>
          {hasChildren && (
            <span className="text-xs text-muted-foreground">
              ({node.children.length} sub)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(node)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(node.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {node.children.map((child) => (
        <CategoryTreeItem
          key={child.id}
          node={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string>('')

  const supabase = createClient()

  const tree = useMemo(() => buildCategoryTree(categories), [categories])
  const flatOptions = useMemo(() => flattenTree(tree), [tree])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    try {
      const tenant = await getTenant(supabase)
      setTenantId(tenant.id)

      const data = await getCategories(supabase, tenant.id, false)
      setCategories(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const parentId = formData.get('parent_id') as string
    const isActive = formData.get('is_active') === 'on'

    const data: any = {
      loja_id: tenantId,
      name,
      slug: slugify(name),
      parent_id: parentId || null,
      is_active: isActive,
    }

    try {
      if (editingCategory) {
        if (parentId === editingCategory.id) {
          toast.error('Uma categoria nao pode ser pai de si mesma')
          setSaving(false)
          return
        }
        await saveCategory(supabase, tenantId, data, editingCategory.id)
        toast.success('Categoria atualizada!')
      } else {
        await saveCategory(supabase, tenantId, data)
        toast.success('Categoria criada!')
      }

      setDialogOpen(false)
      setEditingCategory(null)
      loadData()
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir categoria? Subcategorias ficarao sem pai.')) return
    try {
      await deleteCategory(supabase, tenantId, id)
      toast.success('Categoria excluida!')
      loadData()
    } catch (err) {
      toast.error('Erro ao excluir')
    }
  }

  function openEdit(cat: any) {
    setEditingCategory(cat)
    setDialogOpen(true)
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={() => { setEditingCategory(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma categoria cadastrada
            </div>
          ) : (
            <div>
              {tree.map((node) => (
                <CategoryTreeItem
                  key={node.id}
                  node={node}
                  level={0}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input id="cat-name" name="name" required defaultValue={editingCategory?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_id">Categoria pai</Label>
              <Select
                id="parent_id"
                name="parent_id"
                defaultValue={editingCategory?.parent_id || ''}
              >
                <option value="">Nenhuma (raiz)</option>
                {flatOptions
                  .filter((opt) => opt.id !== editingCategory?.id)
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {'— '.repeat(opt.level)}{opt.name}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editingCategory?.is_active ?? true}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Ativa</span>
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
