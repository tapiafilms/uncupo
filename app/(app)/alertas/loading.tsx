import { Skeleton } from '@/components/ui/Skeleton'

export default function AlertasLoading() {
  return (
    <div className="page-container">
      <div className="flex items-center pt-2 mb-4">
        <img src="/logo.png" alt="UnCupo" className="h-16 w-auto object-contain" />
      </div>
      <div className="mb-6">
        <Skeleton className="h-6 w-28 mb-2" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-12 w-full mb-6" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
