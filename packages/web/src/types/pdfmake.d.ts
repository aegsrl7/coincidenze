// pdfmake 0.3 non ha tipi propri: solo le parti usate dall'export delle riunioni
declare module 'pdfmake/build/pdfmake' {
  type FontFiles = Record<'normal' | 'bold' | 'italics' | 'bolditalics', string>
  interface PdfOutput {
    getBlob(): Promise<Blob>
  }
  interface PdfMake {
    addFonts(fonts: Record<string, FontFiles>): void
    setUrlAccessPolicy(callback: (url: string) => boolean): void
    createPdf(docDefinition: object): PdfOutput
  }
  const pdfMake: PdfMake
  export default pdfMake
}
