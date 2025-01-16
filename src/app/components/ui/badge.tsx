import { cn } from "@/app/components/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 