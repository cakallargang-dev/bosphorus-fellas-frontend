import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[16px] border border-[#162544] bg-[#0f1d32] px-4 py-3 text-[15px] text-[#f1f5f9] transition-colors outline-none placeholder:text-[#7a8da4] focus-visible:border-[#3b82f6]/60 focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-[#0a1628]/60 disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
