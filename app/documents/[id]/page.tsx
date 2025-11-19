import { PdfViewer } from '@/components/pdf/pdf-viewer'

export default function DocumentPage({ params }: { params: { id: string } }) {
    // In a real app, we would fetch the document URL from the DB using params.id
    // For this demo, we'll use a sample PDF
    const samplePdfUrl = '/sample.pdf' // Local file to avoid CORS

    return (
        <div className="h-screen flex flex-col">
            <header className="h-14 border-b flex items-center px-4 bg-background z-10">
                <h1 className="font-semibold">Document Viewer</h1>
            </header>
            <div className="flex-1 overflow-hidden relative">
                <PdfViewer url={samplePdfUrl} />
            </div>
        </div>
    )
}
