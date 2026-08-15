import { FileText, FileImage, FileSpreadsheet, File, Archive } from 'lucide-react'
import { cn } from '@/utils'

const FILE_CONFIG = {
  pdf: {
    icon: FileText,
    bg: 'bg-red-50',
    color: 'text-red-500',
    label: 'PDF',
  },
  doc: {
    icon: FileText,
    bg: 'bg-blue-50',
    color: 'text-blue-500',
    label: 'DOC',
  },
  docx: {
    icon: FileText,
    bg: 'bg-blue-50',
    color: 'text-blue-500',
    label: 'DOCX',
  },
  xls: {
    icon: FileSpreadsheet,
    bg: 'bg-green-50',
    color: 'text-green-500',
    label: 'XLS',
  },
  xlsx: {
    icon: FileSpreadsheet,
    bg: 'bg-green-50',
    color: 'text-green-500',
    label: 'XLSX',
  },
  png: {
    icon: FileImage,
    bg: 'bg-purple-50',
    color: 'text-purple-500',
    label: 'PNG',
  },
  jpg: {
    icon: FileImage,
    bg: 'bg-purple-50',
    color: 'text-purple-500',
    label: 'JPG',
  },
  jpeg: {
    icon: FileImage,
    bg: 'bg-purple-50',
    color: 'text-purple-500',
    label: 'JPEG',
  },
  zip: {
    icon: Archive,
    bg: 'bg-amber-50',
    color: 'text-amber-500',
    label: 'ZIP',
  },
}

export function FileIcon({ fileType, size = 'md' }) {
  const config = FILE_CONFIG[fileType?.toLowerCase()] || {
    icon: File,
    bg: 'bg-background',
    color: 'text-slate-400',
    label: 'FILE',
  }

  const Icon = config.icon

  const sizes = {
    sm: { wrap: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { wrap: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { wrap: 'w-14 h-14', icon: 'w-7 h-7' },
  }

  return (
    <div className={cn(
      'rounded-lg flex items-center justify-center flex-shrink-0',
      config.bg,
      sizes[size].wrap
    )}>
      <Icon className={cn(config.color, sizes[size].icon)} />
    </div>
  )
}