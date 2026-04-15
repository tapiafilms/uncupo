import { Skeleton } from '@/components/ui/Skeleton'

function TripRowSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-surface-border/60">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export default function MisViajesLoading() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between pt-2 mb-5">
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="flex gap-2 mb-5">
        <Skeleton className="flex-1 h-9" />
        <Skeleton className="flex-1 h-9" />
      </div>
      <div className="space-y-3">
        <TripRowSkeleton />
        <TripRowSkeleton />
        <TripRowSkeleton />
      </div>
    </div>
  )
}
