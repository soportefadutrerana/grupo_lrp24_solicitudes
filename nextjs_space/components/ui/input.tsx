import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border-2 border-[#333333] bg-[#1a1a1a] px-4 py-2",
          "font-serif text-white placeholder:text-gray-500",
          "focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20",
          "transition-all duration-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
