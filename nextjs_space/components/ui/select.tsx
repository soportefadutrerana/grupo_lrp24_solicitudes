import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-md border-2 border-[#333333] bg-[#1a1a1a] px-4 py-2 pr-10",
          "font-serif text-white",
          "focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20",
          "transition-all duration-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#D4AF37] pointer-events-none" />
    </div>
  )
})
Select.displayName = "Select"

export { Select }
