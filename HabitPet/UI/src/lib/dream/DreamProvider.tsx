import { DreamContext, useDreamStoreValue } from "./store";

export function DreamProvider({ children }: { children: React.ReactNode }) {
  const value = useDreamStoreValue();
  return <DreamContext.Provider value={value}>{children}</DreamContext.Provider>;
}
