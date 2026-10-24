import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBroom, faClone, faFont, faMagnifyingGlass, faSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useExcelContext } from "../../context/ExcelContext.jsx";
import { useI18n } from "../../i18n/I18nContext.jsx";
import {
  blankRows, duplicateRows, fillBlankChanges, replaceChanges, textVariants, unifyTextChanges,
} from "../../utils/cleanup.js";

const FIELD =
  "w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500";
const ACTION =
  "text-sm font-bold px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
const SECONDARY =
  "text-sm font-bold px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

function Section({ icon, title, children }) {
  return (
    <section className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
        <FontAwesomeIcon icon={icon} className="text-blue-500 text-xs" /> {title}
      </h3>
      {children}
    </section>
  );
}

// Limpieza de datos en un clic: filas duplicadas, textos escritos distinto,
// buscar y reemplazar y celdas vacías. Cada acción es un solo paso que se
// puede deshacer con "Deshacer edición".
// initial: { section, col } abre el diálogo enfocado en una columna (desde una conclusión)
function CleanupDialog({ rows, headers, columnTypes, initial = {}, onClose }) {
  const { t, tn, fmtNumber } = useI18n();
  const { applyChanges } = useExcelContext();
  const textColumns = useMemo(
    () => headers.map((_, i) => i).filter((i) => (columnTypes[i]?.type || "text") === "text"),
    [headers, columnTypes]
  );

  const [variantCol, setVariantCol] = useState(
    initial.section === "variants" ? initial.col : textColumns[0] ?? ""
  );
  const [replace, setReplace] = useState({ col: "all", find: "", value: "", whole: false });
  const [blankCol, setBlankCol] = useState(initial.section === "blanks" ? initial.col : 0);
  const [fillValue, setFillValue] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const duplicates = useMemo(() => duplicateRows(rows), [rows]);
  const variants = useMemo(
    () => (variantCol === "" ? [] : textVariants(rows, Number(variantCol))),
    [rows, variantCol]
  );
  const variantChanges = useMemo(
    () => (variantCol === "" ? [] : unifyTextChanges(rows, Number(variantCol))),
    [rows, variantCol]
  );
  const replacements = useMemo(() => {
    const cols = replace.col === "all" ? headers.map((_, i) => i) : [Number(replace.col)];
    return cols.flatMap((col) => replaceChanges(rows, col, replace.find, replace.value, { whole: replace.whole }));
  }, [rows, headers, replace]);
  const blanks = useMemo(() => blankRows(rows, Number(blankCol)), [rows, blankCol]);

  const done = (message) => toast.success(`${message} ${t("Use Undo edit to revert it.")}`);

  const removeDuplicates = () => {
    applyChanges([], duplicates);
    done(tn("{count} duplicate row removed.", "{count} duplicate rows removed.", duplicates.length));
  };
  const unifyVariants = () => {
    applyChanges(variantChanges);
    done(tn("{count} cell unified.", "{count} cells unified.", variantChanges.length));
  };
  const runReplace = () => {
    applyChanges(replacements);
    done(tn("{count} cell replaced.", "{count} cells replaced.", replacements.length));
  };
  const fillBlanks = () => {
    const changes = fillBlankChanges(rows, Number(blankCol), fillValue);
    applyChanges(changes);
    done(tn("{count} empty cell filled.", "{count} empty cells filled.", changes.length));
  };
  const deleteBlankRows = () => {
    applyChanges([], blanks);
    done(tn("{count} row removed.", "{count} rows removed.", blanks.length));
  };

  const columnOptions = (indexes) =>
    indexes.map((i) => (
      <option key={i} value={i}>{headers[i]}</option>
    ));

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex justify-center items-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="cleanup-title"
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 id="cleanup-title" className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
            <FontAwesomeIcon icon={faBroom} className="text-blue-500" /> {t("Clean data")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("Close")}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("Changes apply to the open file only. Each action can be undone with Undo edit.")}
          </p>

          {/* Filas duplicadas */}
          <Section icon={faClone} title={t("Duplicate rows")}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {duplicates.length
                  ? tn(
                      "{count} row is an exact copy of another one.",
                      "{count} rows are exact copies of others.",
                      duplicates.length
                    )
                  : t("No duplicate rows.")}
              </p>
              <button onClick={removeDuplicates} disabled={!duplicates.length} className={SECONDARY}>
                {t("Remove duplicates")}
              </button>
            </div>
          </Section>

          {/* Textos escritos distinto */}
          <Section icon={faFont} title={t("Unify text")}>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("Values that only differ in capitals, accents or spaces become the most common spelling.")}
            </p>
            {textColumns.length === 0 ? (
              <p className="text-sm text-gray-500">{t("This sheet has no text columns.")}</p>
            ) : (
              <>
                <select
                  aria-label={t("Column to unify")}
                  value={variantCol}
                  onChange={(e) => setVariantCol(e.target.value)}
                  className={FIELD}
                >
                  {columnOptions(textColumns)}
                </select>
                {variants.length ? (
                  <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                    {variants.slice(0, 8).map(({ variants: list, target }) => (
                      <li key={target} className="text-gray-600 dark:text-gray-300 truncate">
                        <span className="text-gray-400">{list.map(([v]) => `“${v}”`).join(", ")}</span>
                        {" → "}
                        <strong className="text-gray-900 dark:text-white">{target}</strong>
                      </li>
                    ))}
                    {variants.length > 8 && (
                      <li className="text-xs text-gray-400">{t("and {count} more", { count: fmtNumber(variants.length - 8) })}</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("Every value is written the same way.")}</p>
                )}
                <div className="flex justify-end">
                  <button onClick={unifyVariants} disabled={!variantChanges.length} className={ACTION}>
                    {variantChanges.length
                      ? tn("Unify {count} cell", "Unify {count} cells", variantChanges.length)
                      : t("Unify")}
                  </button>
                </div>
              </>
            )}
          </Section>

          {/* Buscar y reemplazar */}
          <Section icon={faMagnifyingGlass} title={t("Find & replace")}>
            <select
              aria-label={t("Column to search")}
              value={replace.col}
              onChange={(e) => setReplace((r) => ({ ...r, col: e.target.value }))}
              className={FIELD}
            >
              <option value="all">{t("All columns")}</option>
              {columnOptions(headers.map((_, i) => i))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder={t("Find")}
                aria-label={t("Find")}
                value={replace.find}
                onChange={(e) => setReplace((r) => ({ ...r, find: e.target.value }))}
                className={FIELD}
              />
              <input
                placeholder={t("Replace with")}
                aria-label={t("Replace with")}
                value={replace.value}
                onChange={(e) => setReplace((r) => ({ ...r, value: e.target.value }))}
                className={FIELD}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replace.whole}
                  onChange={(e) => setReplace((r) => ({ ...r, whole: e.target.checked }))}
                  className="w-4 h-4 rounded-sm border-gray-300 text-blue-600"
                />
                {t("Whole cell only")}
              </label>
              <button onClick={runReplace} disabled={!replacements.length} className={ACTION}>
                {replace.find
                  ? tn("Replace {count} cell", "Replace {count} cells", replacements.length)
                  : t("Replace")}
              </button>
            </div>
          </Section>

          {/* Celdas vacías */}
          <Section icon={faSquare} title={t("Empty cells")}>
            <select
              aria-label={t("Column with empty cells")}
              value={blankCol}
              onChange={(e) => setBlankCol(e.target.value)}
              className={FIELD}
            >
              {columnOptions(headers.map((_, i) => i))}
            </select>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {blanks.length
                ? tn("{count} row has this cell empty.", "{count} rows have this cell empty.", blanks.length)
                : t("No empty cells in this column.")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                placeholder={t("Fill with...")}
                aria-label={t("Fill with")}
                value={fillValue}
                onChange={(e) => setFillValue(e.target.value)}
                className={`${FIELD} flex-1 min-w-32`}
              />
              <button onClick={fillBlanks} disabled={!blanks.length || fillValue.trim() === ""} className={ACTION}>
                {t("Fill")}
              </button>
              <button onClick={deleteBlankRows} disabled={!blanks.length} className={SECONDARY}>
                {t("Delete these rows")}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

export default CleanupDialog;
