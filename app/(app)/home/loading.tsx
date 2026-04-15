import { Skeleton } from '@/components/ui/Skeleton'

function TripCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1.5 gap-1 shrink-0">
          <Skeleton className="w-2.5 h-2.5 rounded-full" />
          <Skeleton className="w-px h-8" />
          <Skeleton className="w-2.5 h-2.5 rounded-full" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="space-y-5 flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-16 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-40 mt-3" />
          <Skeleton className="h-1.5 w-full rounded-full mt-2" />
          <div className="flex items-center gap-2 pt-2 border-t border-surface-border/60">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomeLoading() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="UnCupo" className="h-8 w-auto object-contain" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Saludo */}
      <div className="flex items-center gap-3 mb-5">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <Skeleton className="flex-1 h-9" />
        <Skeleton className="flex-1 h-9" />
        <Skeleton className="flex-1 h-9" />
      </div>

      <Skeleton className="h-3 w-32 mb-3" />

      {/* Trip cards */}
      <div className="space-y-3">
        <TripCardSkeleton />
        <TripCardSkeleton />
        <TripCardSkeleton />
      </div>
    </div>
  )
}
