"use client";

import { ToastContainer } from "react-toastify";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function AppToasts() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // avoid hydration mismatch

  return <ToastContainer theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}
