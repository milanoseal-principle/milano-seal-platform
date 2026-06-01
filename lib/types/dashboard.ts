export interface DestinationIntelligenceItem {
  country: string
  slug: string
  routeLabel: string
  nodeType: string
  protocol: string
  activeMatters: number
  awaitingPayment: number
  apostillePending: number
  courierReleased: number
  completed: number
  paidRevenue?: number
  latestMatter?: {
    id: string
    status: string
    updatedAt: string
  } | null
}

export interface DestinationIntelligenceResponse {
  destinations: DestinationIntelligenceItem[]
}
