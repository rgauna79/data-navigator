import { useMemo } from "react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { DATE_PRESETS, keyRange, periodsInData, presetRange } from "../utils/dateRanges.js";
import { formatPeriodLabel } from "../utils/reportUtils.js";

// Selector de período rápido para un filtro de fechas: rangos relativos a hoy
// (este mes, el trimestre pasado...) y los meses y años que tiene la columna.
// dates: fechas de la columna (Date o null)
// onSelect({ from, to }) recibe "YYYY-MM-DD"; con "" (todas las fechas) recibe null.
function DatePresetSelect({ dates, onSelect, label, className = "" }) {
  const { t, locale } = useI18n();
  const { months, years } = useMemo(() => periodsInData(dates), [dates]);

  const handleChange = (e) => {
    const value = e.target.value;
    e.target.value = "";
    if (value === "all") onSelect(null);
    else if (value.startsWith("preset:")) onSelect(presetRange(value.slice(7)));
    else if (value) onSelect(keyRange(value));
  };

  return (
    <select defaultValue="" onChange={handleChange} aria-label={label || t("Quick period")} className={className}>
      <option value="">{t("Quick period...")}</option>
      <option value="all">{t("All dates")}</option>
      <optgroup label={t("Relative to today")}>
        {Object.entries(DATE_PRESETS).map(([key, text]) => (
          <option key={key} value={`preset:${key}`}>{t(text)}</option>
        ))}
      </optgroup>
      {months.length > 0 && (
        <optgroup label={t("Months in the data")}>
          {months.slice(0, 36).map((key) => (
            <option key={key} value={key}>{formatPeriodLabel(key, "month", locale, t)}</option>
          ))}
        </optgroup>
      )}
      {years.length > 1 && (
        <optgroup label={t("Years in the data")}>
          {years.map((key) => <option key={key} value={key}>{key}</option>)}
        </optgroup>
      )}
    </select>
  );
}

export default DatePresetSelect;
