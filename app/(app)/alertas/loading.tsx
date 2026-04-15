import { Skeleton } from '@/components/ui/Skeleton'

export default function AlertasLoading() {
  return (
    <div className="page-container">
      <div className="pt-2 mb-6">
        <Skeleton className="h-7 w-32 mb-2" />
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
