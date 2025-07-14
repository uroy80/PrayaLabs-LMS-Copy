import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-soft",
  "inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md",
  {
    variants: {
      variant: {
        default:
          "border-blue-800 bg-blue-900 text-white hover:bg-blue-800 hover:shadow-lg",
        secondary:
          "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-lg",
        destructive:
          "border-red-600 bg-red-600 text-white hover:bg-red-700 hover:shadow-lg",
        outline: "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
