import { DESTINATIONS } from "@/data/destinations"
import { CORRIDOR_INTEL, getCorridorIntel, type MatterVector } from "@/data/corridor-intel"

export type { MatterVector }

export interface GlobalRouteRecord {
  slug: string
  name: string
  flag: string
  lat: number
  lng: number
  hague: boolean
  hagueStatus: string
  demand: number
  timeline: string
  translationRequired: boolean
  routeType: string
  executionPath: string[]
  commonDocuments: string[]
  note: string
  matterVectors: MatterVector[]
}

export const GLOBAL_ROUTE_DATA: GlobalRouteRecord[] = DESTINATIONS
  .filter((d): d is typeof d & { lat: number; lng: number } =>
    d.lat !== undefined && d.lng !== undefined
  )
  .map((d) => {
    const intel = getCorridorIntel(d.slug, d.hague)
    return {
      slug: d.slug,
      name: d.name,
      flag: d.flag,
      lat: d.lat,
      lng: d.lng,
      hague: d.hague,
      hagueStatus: d.hagueStatus,
      demand: d.demand,
      timeline: intel.timeline,
      translationRequired: intel.translationRequired,
      routeType: intel.routeType,
      executionPath: d.executionPath,
      commonDocuments: d.commonDocuments,
      note: d.note,
      matterVectors: intel.matterVectors,
    }
  })

export function getGlobalRoute(slug: string): GlobalRouteRecord | undefined {
  return GLOBAL_ROUTE_DATA.find((r) => r.slug === slug)
}

export const HAGUE_ROUTES: GlobalRouteRecord[] = GLOBAL_ROUTE_DATA
  .filter((r) => r.hague)
  .sort((a, b) => b.demand - a.demand)

export const ALL_ROUTES_SORTED: GlobalRouteRecord[] = [...GLOBAL_ROUTE_DATA].sort(
  (a, b) => b.demand - a.demand
)
