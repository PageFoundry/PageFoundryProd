// Minimal-Typ fuer createPortal (das Projekt hat keine @types/react-dom; bisher einzige
// Nutzung: Gespraechsfenster der Anrufliste, src/components/sales/CallsView.tsx).
declare module "react-dom" {
  import type { ReactNode, ReactPortal } from "react";
  export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null): ReactPortal;
}
