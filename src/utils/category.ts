import type { Category, CategoryType } from '../types/category'

export interface CategoryTreeNode {
  category: Category
  children: Category[]
}

export interface CategoryOption {
  id: string
  label: string
  category: Category
}

export interface CategoryOptionGroup {
  label: string
  options: CategoryOption[]
}

export interface CategoryTreeGroup {
  category: Category
  children: Category[]
}

function compareCategories(left: Category, right: Category): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'zh-CN')
}

export function isChildCategory(category: Pick<Category, 'parentId'>): boolean {
  return Boolean(category.parentId)
}

export function isTopLevelCategory(category: Pick<Category, 'parentId'>): boolean {
  return !category.parentId
}

export function getCategoryTypeGroupLabel(type: CategoryType): string {
  return type === 'income' ? '金额来源 / 收入' : '金额去向 / 支出'
}

export function buildCategoryTree(categories: Category[], type?: CategoryType): CategoryTreeNode[] {
  const scopedCategories = type ? categories.filter((category) => category.type === type) : categories
  const categoryMap = new Map(scopedCategories.map((category) => [category.id, category]))
  const childrenMap = new Map<string, Category[]>()
  const roots: Category[] = []

  scopedCategories.forEach((category) => {
    if (category.parentId && categoryMap.has(category.parentId)) {
      const siblings = childrenMap.get(category.parentId) ?? []
      siblings.push(category)
      childrenMap.set(category.parentId, siblings)
      return
    }

    roots.push(category)
  })

  return roots
    .sort(compareCategories)
    .map((category) => ({
      category,
      children: [...(childrenMap.get(category.id) ?? [])].sort(compareCategories),
    }))
}

export function sortCategories(categories: Category[]): Category[] {
  const orderedIds = new Set<string>()
  const orderedCategories: Category[] = []

  buildCategoryTree(categories).forEach(({ category, children }) => {
    orderedCategories.push(category)
    orderedIds.add(category.id)

    children.forEach((child) => {
      orderedCategories.push(child)
      orderedIds.add(child.id)
    })
  })

  categories
    .filter((category) => !orderedIds.has(category.id))
    .sort(compareCategories)
    .forEach((category) => {
      orderedCategories.push(category)
    })

  return orderedCategories
}

export function getCategoryDisplayName(
  categoryOrId: string | Category | null | undefined,
  categories: Category[],
): string {
  if (!categoryOrId) {
    return ''
  }

  const category = typeof categoryOrId === 'string'
    ? categories.find((item) => item.id === categoryOrId) ?? null
    : categoryOrId

  if (!category) {
    return ''
  }

  if (!category.parentId) {
    return category.name
  }

  const parent = categories.find((item) => item.id === category.parentId)
  return parent ? `${parent.name} / ${category.name}` : category.name
}

export function getCategoryDescendantIds(categoryId: string, categories: Category[]): string[] {
  const descendantIds = [categoryId]

  categories.forEach((category) => {
    if (category.parentId === categoryId) {
      descendantIds.push(category.id)
    }
  })

  return descendantIds
}

export function createCategoryOptionGroups(categories: Category[]): CategoryOptionGroup[] {
  return (['expense', 'income'] satisfies CategoryType[]).map((type) => ({
    label: getCategoryTypeGroupLabel(type),
    options: buildCategoryTree(categories, type)
      .flatMap(({ category, children }) => [
        {
          id: category.id,
          label: `${category.icon} ${category.name}`,
          category,
        },
        ...children.map((child) => ({
          id: child.id,
          label: `${child.icon} ${getCategoryDisplayName(child, categories)}`,
          category: child,
        })),
      ]),
  }))
}

export function createFlatCategoryOptions(categories: Category[]): CategoryOption[] {
  return createCategoryOptionGroups(categories).flatMap((group) => group.options)
}

export function createTopLevelCategoryGroups(categories: Category[], type?: CategoryType): CategoryTreeGroup[] {
  return buildCategoryTree(categories, type).filter((group) => !group.category.parentId)
}
