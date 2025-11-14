declare module 'citation-js' {
  class Cite {
    constructor(data: unknown, options?: Record<string, unknown>)
    format(format: string, options?: Record<string, unknown>): string
  }
  export default Cite
}
