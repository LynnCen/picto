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

      if (response.err) {
        throw new Error(`Figma API error: ${response.err}`)
      }

      this.logger?.success(`Images exported successfully`)
      return response
    } catch (error) {
      this.logger?.error(`Failed to export images from file: ${fileKey}`)
      throw this.handleError(error, 'getImages')
    }
  }

  /**
   * Download SVG content from URL
   */
  async downloadSVG(url: string): Promise<string> {
    try {
      const svg = await ofetch<string>(url, {
        timeout: this.timeout,
        retry: this.retries,
      })
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
