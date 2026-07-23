"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HtmlLangSync() {
  const pathname = usePathname();

  useEffect(() => {
    const isEnglish = pathname === "/en" || pathname.startsWith("/posts/en");
    document.documentElement.lang = isEnglish ? "en" : "pt-BR";
  }, [pathname]);

  return null;
}
