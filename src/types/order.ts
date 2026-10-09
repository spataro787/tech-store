export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'

export type OrderItem = {
  productId: string
  name: string
  imageUrl: string
  quantity: number
  unitPriceCents: number
  subtotalCents: number
}

export type Order = {
  id: string
  userId: string
  items: OrderItem[]
  totalCents: number
  currency: 'ARS'
  status: OrderStatus
  createdAt: string
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  processing: 'En preparación',
  completed: 'Completada',
  cancelled: 'Cancelada',
}