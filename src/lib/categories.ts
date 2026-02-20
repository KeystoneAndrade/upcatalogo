export interface CategoryNode {
  id: string
  loja_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  display_order: number
  is_active: boolean
  children: CategoryNode[]
}

export interface FlatCategoryOption {
  id: string
  name: string
  slug: string
  level: number
  parent_id: string | null
}

/**
 * Converte lista flat de categorias em arvore aninhada
 */
export function buildCategoryTree(categories: any[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  const roots: CategoryNode[] = []

  // Criar nodes
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }

  // Montar arvore
  for (const cat of categories) {
    const node = map.get(cat.id)!
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

/**
 * Achata a arvore em lista com nivel de profundidade (para selects com indentacao)
 */
export function flattenTree(tree: CategoryNode[], level: number = 0): FlatCategoryOption[] {
  const result: FlatCategoryOption[] = []
  for (const node of tree) {
    result.push({
      id: node.id,
      name: node.name,
      slug: node.slug,
      level,
      parent_id: node.parent_id,
    })
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children, level + 1))
    }
  }
  return result
}

/**
 * Retorna o caminho da raiz ate a categoria (array de categorias)
 */
export function getCategoryPath(allCategories: any[], categoryId: string): any[] {
  const map = new Map<string, any>()
  for (const cat of allCategories) {
    map.set(cat.id, cat)
  }

  const path: any[] = []
  let current = map.get(categoryId)
  while (current) {
    path.unshift(current)
    current = current.parent_id ? map.get(current.parent_id) : null
  }
  return path
}

/**
 * Resolve um array de slugs ['roupas', 'camisetas', 'manga-longa']
 * para a categoria final, seguindo a hierarquia pai->filho
 */
export function resolveSlugPath(allCategories: any[], slugArray: string[]): any | null {
  if (slugArray.length === 0) return null

  let currentParentId: string | null = null

  for (const slug of slugArray) {
    const found = allCategories.find(
      (cat) => cat.slug === slug && cat.parent_id === currentParentId
    )
    if (!found) return null
    currentParentId = found.id
  }

  return allCategories.find((cat) => cat.id === currentParentId) || null
}

/**
 * Retorna todas as categorias filhas diretas de uma categoria
 */
export function getDirectChildren(allCategories: any[], parentId: string | null): any[] {
  return allCategories.filter((cat) => cat.parent_id === parentId)
}

/**
 * Retorna todos os IDs descendentes de uma categoria (para buscar produtos em toda a subarvore)
 */
export function getAllDescendantIds(allCategories: any[], parentId: string): string[] {
  const ids: string[] = []
  const children = allCategories.filter((cat) => cat.parent_id === parentId)
  for (const child of children) {
    ids.push(child.id)
    ids.push(...getAllDescendantIds(allCategories, child.id))
  }
  return ids
}

/**
 * Gera o slug path completo para uma categoria (ex: "roupas/camisetas/manga-longa")
 */
export function buildSlugPath(allCategories: any[], categoryId: string): string {
  const path = getCategoryPath(allCategories, categoryId)
  return path.map((cat) => cat.slug).join('/')
}
