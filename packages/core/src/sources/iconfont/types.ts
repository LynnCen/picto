/**
 * Iconfont API Types
 * Based on Iconfont platform API
 */

export interface IconfontProject {
  id: string | number
  name: string
  description?: string
  user: {
    id: string | number
    name: string
  }
  icon_count?: number
  icons?: IconfontIcon[]
}

export interface IconfontIcon {
  id: string | number
  name: string
  font_class: string
  unicode: string
  unicode_decimal: number
  show_svg?: string
  svg?: string
}

export interface IconfontCSSIcon {
  name: string
  className: string
  unicode: string
  content?: string
}

export interface IconfontClientOptions {
  token?: string
  baseUrl?: string
  timeout?: number
  retries?: number
}

export interface IconfontResponse<T> {
  code: number
  message?: string
  data: T
}
