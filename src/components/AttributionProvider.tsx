"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { parseObservedProvenance, type InitialProvenance } from "@/lib/attribution";
const AttributionContext = createContext<InitialProvenance>({ observedSource: "direct_or_unknown", entryPathname: null });
export function AttributionProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<InitialProvenance>({ observedSource: "direct_or_unknown", entryPathname: null });
  useEffect(() => { setValue(parseObservedProvenance({ referrer: document.referrer, href: window.location.href, pathname: window.location.pathname })); }, []);
  return <AttributionContext.Provider value={value}>{children}</AttributionContext.Provider>;
}
export function useAttribution() { return useContext(AttributionContext); }
