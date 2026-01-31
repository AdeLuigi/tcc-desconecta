import appCategoriesData from "@/data/appCategories.json"

export type AppCategory = 
  | 'social' 
  | 'entertainment' 
  | 'streaming' 
  | 'games' 
  | 'productivity' 
  | 'education' 
  | 'photo' 
  | 'news' 
  | 'maps' 
  | 'shopping' 
  | 'other'

interface CategoryInfo {
  label: string
  emoji: string
  packages: string[]
}

const categories = appCategoriesData as Record<AppCategory, CategoryInfo>

/**
 * Obtém a categoria de um app, com fallback para lista manual
 * @param packageName - Nome do pacote do aplicativo (ex: com.instagram.android)
 * @param nativeCategory - Categoria retornada pelo sistema Android (opcional)
 * @returns A categoria do app
 */
export const getAppCategory = (packageName: string, nativeCategory?: string): AppCategory => {
  // 1. Usar categoria nativa se disponível e diferente de 'other'
  if (nativeCategory && nativeCategory !== 'other' && isValidCategory(nativeCategory)) {
    return nativeCategory as AppCategory
  }
  
  // 2. Buscar na lista manual
  for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
    if (categoryInfo.packages.includes(packageName)) {
      return categoryKey as AppCategory
    }
  }
  
  return 'other'
}

/**
 * Verifica se uma string é uma categoria válida
 */
const isValidCategory = (category: string): boolean => {
  return category in categories
}

/**
 * Obtém o label traduzido de uma categoria
 * @param category - A categoria do app
 * @returns O nome traduzido da categoria
 */
export const getCategoryLabel = (category: AppCategory): string => {
  return categories[category]?.label || 'Outros'
}

/**
 * Obtém o emoji representativo de uma categoria
 * @param category - A categoria do app
 * @returns O emoji da categoria
 */
export const getCategoryEmoji = (category: AppCategory): string => {
  return categories[category]?.emoji || '📱'
}

/**
 * Obtém todas as categorias disponíveis
 * @returns Objeto com todas as categorias e suas informações
 */
export const getAllCategories = (): Record<AppCategory, CategoryInfo> => {
  return categories
}

/**
 * Obtém a lista de pacotes de uma categoria específica
 * @param category - A categoria desejada
 * @returns Array com os nomes dos pacotes da categoria
 */
export const getCategoryPackages = (category: AppCategory): string[] => {
  return categories[category]?.packages || []
}
