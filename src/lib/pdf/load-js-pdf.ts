// ── Chargement du constructeur jsPDF, compatible navigateur (ESM) + Node (CJS) ──
// jsPDF v4 exporte différemment selon l'environnement :
//   - Node (CJS) : export nommé `jsPDF` (ou default.default)
//   - Navigateur : export par défaut = constructeur
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsPdfDoc = any;

type JsPdfConstructor = new (opts: object) => JsPdfDoc;

/** Charge le constructeur jsPDF (compatible navigateur ESM + Node CJS) */
export async function loadJsPDF(): Promise<JsPdfConstructor> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("jspdf");
  return (mod.jsPDF || mod.default?.default || mod.default) as JsPdfConstructor;
}
