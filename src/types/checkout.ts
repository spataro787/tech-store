export type CheckoutItem = {
  productId: string
  quantity: number
}

export type CheckoutRequest = {
  requestId: string
  items: CheckoutItem[]
  expectedTotalCents: number
}

export type CheckoutResult = {
  orderId: string
  totalCents: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
}