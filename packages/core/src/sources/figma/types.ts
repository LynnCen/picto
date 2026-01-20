/**
 * Figma API Types
 * Based on Figma REST API v1
 */

export interface FigmaFile {
  name: string
  lastModified: string
  thumbnailUrl: string
  version: string
  document: FigmaNode
  components: Record<string, FigmaComponent>
  componentSets: Record<string, FigmaComponentSet>
  schemaVersion: number
  styles: Record<string, FigmaStyle>
}

export interface FigmaNode {
  id: string
  name: string
  type: FigmaNodeType
  visible?: boolean
  children?: FigmaNode[]
  absoluteBoundingBox?: FigmaBoundingBox
  // Component specific
  description?: string
  componentPropertyDefinitions?: Record<string, unknown>
}

export type FigmaNodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'

export interface FigmaComponent {
  key: string
  name: string
  description: string
  componentSetId?: string
  documentationLinks: unknown[]
}

export interface FigmaComponentSet {
  key: string
  name: string
  description: string
  documentationLinks: unknown[]
}

export interface FigmaStyle {
  key: string
  name: string
  styleType: string
  description: string
}

export interface FigmaBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FigmaImageResponse {
  err: string | null
  images: Record<string, string>
  status?: number
}

export interface FigmaErrorResponse {
  status: number
  err: string
}

export interface FigmaClientOptions {
  token: string
  baseUrl?: string
  timeout?: number
  retries?: number
  concurrency?: number
}
