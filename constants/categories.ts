// Product categories for TrazAí store app

export interface ProductCategory {
  id: string
  name: string
  icon?: string
}

export const productCategoriesForForms: ProductCategory[] = [
  { id: "alimentos", name: "Alimentos" },
  { id: "bebidas", name: "Bebidas" },
  { id: "padaria", name: "Padaria" },
  { id: "acougue", name: "Açougue" },
  { id: "hortifruti", name: "Hortifruti" },
  { id: "laticinios", name: "Laticínios" },
  { id: "limpeza", name: "Limpeza" },
  { id: "higiene", name: "Higiene Pessoal" },
  { id: "congelados", name: "Congelados" },
  { id: "mercearia", name: "Mercearia" },
  { id: "doces", name: "Doces e Sobremesas" },
  { id: "petshop", name: "Pet Shop" },
  { id: "outros", name: "Outros" },
]

export const storeCategoriesForForms: ProductCategory[] = [
  { id: "supermercado", name: "Supermercado" },
  { id: "padaria", name: "Padaria" },
  { id: "acougue", name: "Açougue" },
  { id: "hortifruti", name: "Hortifruti" },
  { id: "farmacia", name: "Farmácia" },
  { id: "restaurante", name: "Restaurante" },
  { id: "lanchonete", name: "Lanchonete" },
  { id: "pizzaria", name: "Pizzaria" },
  { id: "petshop", name: "Pet Shop" },
  { id: "conveniencia", name: "Conveniência" },
  { id: "outros", name: "Outros" },
]
