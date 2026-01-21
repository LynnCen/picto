/**
 * Figma API Client
 * Handles all communication with Figma REST API
 */

import { ofetch } from 'ofetch'
import type { FigmaFile, FigmaImageResponse, FigmaClientOptions, FigmaErrorResponse } from './types'
import type { Logger } from '../../logger'

export class FigmaClient {
  private token: string
  private baseUrl: string
  private timeout: number
  private retries: number
  private concurrency: number
  private logger?: Logger

  constructor(options: FigmaClientOptions, logger?: Logger) {
    this.token = options.token
    this.baseUrl = options.baseUrl || 'https://api.figma.com/v1'
    this.timeout = options.timeout || 30000
    this.retries = options.retries || 3
    this.concurrency = options.concurrency || 5
    this.logger = logger
  }

  /**
   * Get file data from Figma
   */
  async getFile(fileKey: string): Promise<FigmaFile> {
    this.logger?.debug(`Fetching Figma file: ${fileKey}`)

    try {
      const response = await this.request<FigmaFile>(`/files/${fileKey}`)
      this.logger?.success(`File fetched successfully: ${response.name}`)
      return response
    } catch (error) {
      this.logger?.error(`Failed to fetch file: ${fileKey}`)
      throw this.handleError(error, 'getFile')
    }
  }

  /**
   * Get specific nodes from a file
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<FigmaFile> {
    this.logger?.debug(`Fetching nodes from file: ${fileKey}`)

    const ids = nodeIds.join(',')
    try {
      const response = await this.request<FigmaFile>(`/files/${fileKey}/nodes?ids=${ids}`)
      this.logger?.success(`Nodes fetched successfully`)
      return response
    } catch (error) {
      this.logger?.error(`Failed to fetch nodes from file: ${fileKey}`)
      throw this.handleError(error, 'getFileNodes')
    }
  }

  /**
   * Export images (SVG) from Figma
   * Automatically handles batching for large requests to avoid 413 errors
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    options: { format?: 'svg' | 'png' | 'jpg'; scale?: number } = {}
  ): Promise<FigmaImageResponse> {
    if (nodeIds.length === 0) {
      throw new Error('nodeIds cannot be empty')
    }

    const { format = 'svg', scale = 1 } = options

    this.logger?.debug(`Exporting ${nodeIds.length} image(s) from ${fileKey}`)

    // Batch size to avoid URL too long error (413)
    const BATCH_SIZE = 100

    // If nodeIds is small enough, make a single request
    if (nodeIds.length <= BATCH_SIZE) {
      return await this.getImagesBatch(fileKey, nodeIds, { format, scale })
    }

    // Otherwise, split into batches
    this.logger?.info(`Splitting ${nodeIds.length} icons into batches of ${BATCH_SIZE}...`)
    const batches: string[][] = []
    for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
      batches.push(nodeIds.slice(i, i + BATCH_SIZE))
    }

    // Process all batches
    const allImages: Record<string, string> = {}
    let hasError = false
    let errorMessage = ''

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      if (!batch) continue

      this.logger?.info(`Processing batch ${i + 1}/${batches.length} (${batch.length} icons)...`)

      try {
        const response = await this.getImagesBatch(fileKey, batch, { format, scale })

        if (response.err) {
          hasError = true
          errorMessage = response.err
          this.logger?.error(`Batch ${i + 1} failed: ${response.err}`)
          continue
        }

        // Merge results
        Object.assign(allImages, response.images)
        this.logger?.success(`Batch ${i + 1}/${batches.length} completed (${Object.keys(response.images).length} icons)`)
      } catch (error) {
        hasError = true
        errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.logger?.error(`Batch ${i + 1} failed: ${errorMessage}`)
      }
    }

    this.logger?.success(`Total: exported ${Object.keys(allImages).length} image(s)`)

    return {
      err: hasError ? errorMessage : null,
      images: allImages,
    }
  }

  /**
   * Export a single batch of images
   */
  private async getImagesBatch(
    fileKey: string,
    nodeIds: string[],
    options: { format?: 'svg' | 'png' | 'jpg'; scale?: number } = {}
  ): Promise<FigmaImageResponse> {
    const { format = 'svg', scale = 1 } = options
    const ids = nodeIds.join(',')
    const params = new URLSearchParams({
      ids,
      format,
      scale: scale.toString(),
    })

    try {
      const response = await this.request<FigmaImageResponse>(
        `/images/${fileKey}?${params.toString()}`
      )

      return response
    } catch (error) {
      this.logger?.error(`Failed to export batch from file: ${fileKey}`)
      throw this.handleError(error, 'getImagesBatch')
    }
  }

  /**
   * Download SVG content from URL
   */
  async downloadSVG(url: string): Promise<string> {
    try {
      const svg = await ofetch(url, {
        timeout: this.timeout,
        retry: this.retries,
        responseType: 'text', // Force text response to get SVG as string
      })

      // Ensure we return a string
      if (typeof svg !== 'string') {
        throw new Error(`Expected SVG content to be string, got ${typeof svg}`)
      }

      return svg
    } catch (error) {
      this.logger?.error(`Failed to download SVG from: ${url}`)
      throw this.handleError(error, 'downloadSVG')
    }
  }

  /**
   * Download multiple SVGs with concurrency control
   */
  async downloadSVGs(
    urls: Array<{ id: string; url: string }>
  ): Promise<Array<{ id: string; svg: string }>> {
    this.logger?.info(`Downloading ${urls.length} SVG(s)...`)

    const results: Array<{ id: string; svg: string }> = []
    const errors: Array<{ id: string; error: Error }> = []

    // Process in batches based on concurrency
    for (let i = 0; i < urls.length; i += this.concurrency) {
      const batch = urls.slice(i, i + this.concurrency)
      const promises = batch.map(async ({ id, url }) => {
        try {
          const svg = await this.downloadSVG(url)
          results.push({ id, svg })
        } catch (error) {
          errors.push({ id, error: error as Error })
        }
      })

      await Promise.all(promises)
      this.logger?.debug(`Progress: ${Math.min(i + this.concurrency, urls.length)}/${urls.length}`)
    }

    if (errors.length > 0) {
      this.logger?.warn(`${errors.length} SVG(s) failed to download`)
    }

    this.logger?.success(`Downloaded ${results.length} SVG(s)`)
    return results
  }

  /**
   * Make authenticated request to Figma API
   */
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    return await ofetch<T>(url, {
      headers: {
        'X-Figma-Token': this.token,
      },
      timeout: this.timeout,
      retry: this.retries,
      onRequestError: ({ error }) => {
        this.logger?.error(`Request error: ${error.message}`)
      },
      onResponseError: ({ response }) => {
        this.logger?.error(`Response error: ${response.status} ${response.statusText}`)
      },
    })
  }

  /**
   * Handle and format errors
   */
  private handleError(error: unknown, context: string): Error {
    if (error instanceof Error) {
      // Check if it's a Figma API error
      const figmaError = error as FigmaErrorResponse & Error
      if (figmaError.status && figmaError.err) {
        return new Error(`Figma API Error (${context}): ${figmaError.status} - ${figmaError.err}`)
      }

      return new Error(`${context} failed: ${error.message}`)
    }

    return new Error(`${context} failed: Unknown error`)
  }
}
