'use client'
import { useEffect, useState } from "react";
import GitHubAnalyzerMacbook from "@/components/githubanalyzewithmacbook";

export default function Analysis() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <GitHubAnalyzerMacbook />;
}