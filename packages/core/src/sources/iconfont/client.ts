/**
 * Iconfont API Client
 * Handles communication with Iconfont platform
 */

import { ofetch } from 'ofetch'
import type {
  IconfontProject,
  IconfontIcon,
  IconfontClientOptions,
  IconfontResponse,
  IconfontCSSIcon,
} from './types'
import type { Logger } from '../../logger'

export class IconfontClient {
  private token?: string
  private baseUrl: string
  private timeout: number
  private retries: number
  private logger?: Logger

  constructor(options: IconfontClientOptions, logger?: Logger) {
    this.token = options.token
    this.baseUrl = options.baseUrl || 'https://www.iconfont.cn'
    this.timeout = options.timeout || 30000
    this.retries = options.retries || 3
    this.logger = logger
  }

  /**
   * Get project information
   */
  async getProject(projectId: string): Promise<IconfontProject> {
    this.logger?.debug(`Fetching Iconfont project: ${projectId}`)

    try {
      const response = await this.request<IconfontResponse<IconfontProject>>(
        `/api/project/detail.json?pid=${projectId}`
      )

      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Failed to fetch project')
      }

      this.logger?.success(`Project fetched successfully: ${response.data.name}`)
      return response.data
    } catch (error) {
      this.logger?.error(`Failed to fetch project: ${projectId}`)
      throw this.handleError(error, 'getProject')
    }
  }

  /**
   * Get icons from project
   */
  async getProjectIcons(projectId: string): Promise<IconfontIcon[]> {
    this.logger?.debug(`Fetching icons from project: ${projectId}`)

    try {
      const project = await this.getProject(projectId)

      if (!project.icons || project.icons.length === 0) {
        this.logger?.warn(`No icons found in project: ${projectId}`)
        return []
      }

      this.logger?.success(`Fetched ${project.icons.length} icon(s) from project`)
      return project.icons
    } catch (error) {
      this.logger?.error(`Failed to fetch icons from project: ${projectId}`)
      throw this.handleError(error, 'getProjectIcons')
    }
  }

  /**
   * Download SVG content for an icon
   */
  async downloadIconSVG(icon: IconfontIcon): Promise<string> {
    // If SVG is already in the response, use it
    if (icon.show_svg) {
      return icon.show_svg
    }

    if (icon.svg) {
      return icon.svg
    }

    // Otherwise, try to fetch from CDN
    const url = `${this.baseUrl}/api/icon/${icon.id}.svg`

    try {
      const svg = await ofetch<string>(url, {
        timeout: this.timeout,
        retry: this.retries,
      })
      return svg
    } catch (error) {
      this.logger?.error(`Failed to download SVG for icon: ${icon.name}`)
      throw this.handleError(error, 'downloadIconSVG')
    }
  }

  /**
   * Download multiple SVGs with concurrency control
   */
  async downloadIconSVGs(
    icons: IconfontIcon[],
    concurrency = 5
  ): Promise<Array<{ icon: IconfontIcon; svg: string }>> {
    this.logger?.info(`Downloading ${icons.length} SVG(s)...`)

    const results: Array<{ icon: IconfontIcon; svg: string }> = []
    const errors: Array<{ icon: IconfontIcon; error: Error }> = []

    // Process in batches based on concurrency
    for (let i = 0; i < icons.length; i += concurrency) {
      const batch = icons.slice(i, i + concurrency)
      const promises = batch.map(async icon => {
        try {
          const svg = await this.downloadIconSVG(icon)
          results.push({ icon, svg })
        } catch (error) {
          errors.push({ icon, error: error as Error })
        }
      })

      await Promise.all(promises)
      this.logger?.debug(`Progress: ${Math.min(i + concurrency, icons.length)}/${icons.length}`)
    }

    if (errors.length > 0) {
      this.logger?.warn(`${errors.length} SVG(s) failed to download`)
    }

    this.logger?.success(`Downloaded ${results.length} SVG(s)`)
    return results
  }

  /**
   * Parse CSS file to extract icon information
   */
  parseCSSFile(cssContent: string): IconfontCSSIcon[] {
    this.logger?.debug('Parsing CSS file for icon definitions')

    const icons: IconfontCSSIcon[] = []
    const cssIconRegex = /\.icon-([^:]+):before\s*{\s*content:\s*["']\\([^"']+)["']/g

    let match
    while ((match = cssIconRegex.exec(cssContent)) !== null) {
      const name = match[1]
      const unicode = match[2]

      if (name && unicode) {
        icons.push({
          name,
          className: `icon-${name}`,
          unicode,
          content: `\\${unicode}`,
        })
      }
    }

    this.logger?.success(`Parsed ${icons.length} icon(s) from CSS`)
    return icons
  }

  /**
   * Make request to Iconfont API
   */
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {}

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return await ofetch<T>(url, {
      headers,
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
      return new Error(`${context} failed: ${error.message}`)
    }

    return new Error(`${context} failed: Unknown error`)
  }
}
