"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Era } from "@/lib/types";

interface EraContextValue {
  selectedEra: Era | null;
  setSelectedEra: (era: Era | null) => void;
}

const EraContext = createContext<EraContextValue>({
  selectedEra: null,
  setSelectedEra: () => {},
});

export function EraProvider({ children }: { children: ReactNode }) {
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  return (
    <EraContext.Provider value={{ selectedEra, setSelectedEra }}>
      {children}
    </EraContext.Provider>
  );
}

export function useEra() {
  return useContext(EraContext);
}
