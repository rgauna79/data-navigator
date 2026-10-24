// Datos de ejemplo para probar la app sin un archivo propio: un año de
// ventas con fechas, regiones, productos, unidades e importes. Se generan
// con una semilla fija para que el ejemplo sea siempre igual.

const random = (seed) => () => {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const CONTENT = {
  en: {
    fileName: "sample-sales.csv",
    headers: ["Date", "Region", "Product", "Units", "Amount"],
    regions: ["North", "South", "East", "West"],
    products: ["Pencils", "Notebooks", "Backpacks", "Rulers", "Scissors", "Glue"],
    separator: ",",
    date: (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
    amount: (n) => n.toFixed(2),
  },
  es: {
    fileName: "ventas-ejemplo.csv",
    headers: ["Fecha", "Región", "Producto", "Unidades", "Importe"],
    regions: ["Norte", "Sur", "Este", "Oeste"],
    products: ["Lápices", "Cuadernos", "Mochilas", "Reglas", "Tijeras", "Pegamento"],
    separator: ";",
    date: (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
    // Formato español: punto de miles y coma decimal
    amount: (n) => n.toLocaleString("es-ES", { useGrouping: "always", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  },
};

const PRICES = [1.5, 3.2, 24.9, 2.1, 4.75, 2.6];
const PRODUCT_WEIGHTS = [6, 5, 3, 3, 2, 1];

/** Filas del ejemplo (primera fila = encabezados) en el idioma indicado. */
export const sampleRows = (lang = "en", count = 300) => {
  const c = CONTENT[lang] || CONTENT.en;
  const next = random(2024);
  const totalWeight = PRODUCT_WEIGHTS.reduce((a, b) => a + b, 0);
  const pickProduct = () => {
    let r = next() * totalWeight;
    return PRODUCT_WEIGHTS.findIndex((w) => (r -= w) < 0);
  };
  const rows = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(2024, 0, 1 + Math.floor(next() * 366));
    const product = pickProduct();
    const region = Math.floor(next() * c.regions.length);
    // Más ventas a fin de año y en la región norte
    const units = Math.round((5 + next() * 60) * (1 + date.getMonth() / 12) * (region === 0 ? 1.3 : 1));
    rows.push([c.date(date), c.regions[region], c.products[product], String(units), c.amount(units * PRICES[product])]);
  }
  return [c.headers, ...rows];
};

const csvCell = (value, separator) =>
  value.includes(separator) || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;

/** Archivo CSV de ejemplo, listo para abrir en el lector. */
export const sampleFile = (lang = "en") => {
  const c = CONTENT[lang] || CONTENT.en;
  const text = sampleRows(lang)
    .map((row) => row.map((v) => csvCell(v, c.separator)).join(c.separator))
    .join("\n");
  return new File([text], c.fileName, { type: "text/csv" });
};
