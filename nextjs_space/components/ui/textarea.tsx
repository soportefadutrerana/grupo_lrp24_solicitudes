import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-md border-2 border-[#333333] bg-[#1a1a1a] px-4 py-3",
        "font-serif text-white placeholder:text-gray-500",
        "focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20",
        "transition-all duration-300",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
