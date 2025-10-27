// --- Conteúdo do arquivo: src/constants/categories.ts ---

// Interface para definir a estrutura de cada categoria
export interface Category {
  id: string;
  name: string;
  icon?: string; 
}

/**
 * Lista padronizada de categorias para todo o Ecossistema TrazAí.
 */
export const categories: Category[] = [
  { id: 'Todos', name: 'Todos', icon: 'grid-outline' },
  { id: 'Acessórios', name: 'Acessórios', icon: 'bag-handle-outline' },
  { id: 'Pet Shop', name: 'Pet Shop', icon: 'paw-outline' },
  { id: 'Mercearia', name: 'Mercearia', icon: 'basket-outline' },
  { id: 'Moda', name: 'Moda', icon: 'shirt-outline' },
  { id: 'Casa & Decoração', name: 'Casa & Decoração', icon: 'home-outline' },
  { id: 'Serviços', name: 'Serviços', icon: 'construct-outline' },
  { id: 'Eletrônicos', name: 'Eletrônicos', icon: 'laptop-outline' },
  { id: 'Beleza', name: 'Beleza', icon: 'sparkles-outline' },
  { id: 'Saúde', name: 'Saúde', icon: 'medkit-outline' },
];

/**
 * Retorna a lista de categorias filtrada para uso em formulários (sem a opção "Todos").
 */
export const productCategoriesForForms = categories.filter(c => c.id !== 'Todos');

// -----------------------------------------------------------------