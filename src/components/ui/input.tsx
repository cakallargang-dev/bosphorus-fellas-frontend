import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[52px] w-full min-w-0 rounded-[16px] border border-[#162544] bg-[#0f1d32] px-4 py-1 text-[15px] text-[#f1f5f9] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#7a8da4] focus-visible:border-[#3b82f6]/60 focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#0a1628]/60 disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
