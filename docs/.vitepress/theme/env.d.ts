declare module 'virtual:private-index' {
  export const data: {
    dev?: boolean
    items?: { title: string; path: string; date: string; code: string }[]
    blob?: import('./crypto').EncBlob | null
  }
}
