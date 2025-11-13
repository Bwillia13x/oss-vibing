declare module 'citation-js' {
  class Cite {
    constructor(data: any, options?: any)
    format(format: string, options?: any): string
  }
  export default Cite
}
