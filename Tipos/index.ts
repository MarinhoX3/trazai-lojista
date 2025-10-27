// Tipos para o sistema de pedidos
export interface PedidoItem {
  id: number
  produto_id: number
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  observacao?: string
}

export interface Pedido {
  id: number
  usuario_id: number
  loja_id: number
  status: "pendente" | "aceito" | "em_preparo" | "saiu_para_entrega" | "entregue" | "cancelado"
  total: number
  taxa_entrega: number
  forma_pagamento: string
  endereco_entrega: string
  observacoes?: string
  created_at: string
  updated_at: string
  usuario_nome?: string
  usuario_telefone?: string
  itens: PedidoItem[]
}

export interface Usuario {
  id: number
  nome: string
  email: string
  telefone?: string
  cpf?: string
}

export interface Loja {
  id: number
  nome: string
  descricao?: string
  endereco?: string
  telefone?: string
  taxa_entrega: number
  tempo_entrega_min: number
  tempo_entrega_max: number
  aberta: boolean
}

export interface Produto {
  id: number
  loja_id: number
  nome: string
  descricao?: string
  preco: number
  categoria: string
  imagem_url?: string
  disponivel: boolean
  estoque?: number
  unidade_venda: "UN" | "KG" | "L" | "G" | "ML"
}

export interface PedidoDetalhes {
  id: number
  nome_loja: string
  data_hora: string
  nome_cliente: string
  telefone_cliente: string
  endereco_entrega: string
  forma_pagamento: string
  valor_total: string | number
  itens: {
    nome_produto: string
    quantidade: number | string
    preco_unitario_congelado: string | number
  }[]
}
