/* eslint-disable @typescript-eslint/no-empty-object-type */
"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        className={cn("h-px bg-gray-200", className)}
        {...props}
      />
    );
  },
);

Separator.displayName = "Separator";

export default Separator;
