// this particular code is to provide the dark them in the nextjs project.

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children,...props }) {
  return <NextThemesProvider {...props}>{children} </NextThemesProvider>
}
