import Image from 'next/image'

interface AppHeaderProps {
  right?: React.ReactNode
}

export function AppHeader({ right }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-2 mb-4">
      <Image
        src="/logo.png"
        alt="UnCupo"
        width={128}
        height={64}
        className="h-16 w-auto object-contain"
        priority
      />
      {right && <div>{right}</div>}
    </div>
  )
}
