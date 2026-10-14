"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { legacyHashPath } from "@/lib/legacyHash";

// Old links like aikid.in/#parties were shared before the site had pages.
export default function LegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const path = legacyHashPath(window.location.hash);
    if (path) router.replace(path);
  }, [router]);
  return null;
}
