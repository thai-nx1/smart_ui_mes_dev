
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-0.5 active:shadow-inner",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:shadow-md hover:bg-primary/95 focus:ring-2 focus:ring-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:shadow-md hover:bg-destructive/95 focus:ring-2 focus:ring-destructive/20",
        outline: "border border-primary/30 text-primary hover:bg-primary/5 focus:ring-2 focus:ring-primary/20",
        secondary: "bg-secondary text-secondary-foreground hover:shadow-sm hover:bg-secondary/95 focus:ring-2 focus:ring-secondary/20",
        ghost: "hover:bg-muted/80 focus:ring-2 focus:ring-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
