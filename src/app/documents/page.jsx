import { DocumentsList } from '@/components/documents/documents-list'

export const metadata = {
  title: 'Documents',
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Documents
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload and manage all team documents and files.
        </p>
      </div>
      <DocumentsList />
    </div>
  )
}