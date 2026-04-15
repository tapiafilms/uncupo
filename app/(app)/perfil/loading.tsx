import { Skeleton } from '@/components/ui/Skeleton'

export default function PerfilLoading() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between pt-2 mb-5">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>

      {/* Avatar + nombre */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-surface-border">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[0,1,2].map(i => <Skeleton key={i} className="h-20" />)}
      </div>

      {/* Links */}
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}
