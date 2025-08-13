"use client";

import { ClipLoader } from "react-spinners";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export default function Spinner({ className }: SpinnerProps) {
  return (
    <ClipLoader
      color="#000000"
      size={24}
      aria-label="Loading Spinner"
      className={cn("block", className)}
    />
  );
}
