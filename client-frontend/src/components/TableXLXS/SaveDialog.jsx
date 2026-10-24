import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faXmark, faFloppyDisk, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { saveData } from "../../api/data.js";

// Diálogo para guardar la hoja con un nombre. Si ya existe un archivo con
// ese nombre, el servidor responde 409 y se pide confirmación para sobrescribirlo.
function SaveDialog({ defaultName, fileData, onClose, onSaved }) {
  const [name, setName] = useState(defaultName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const save = async (overwrite) => {
    const sheetName = name.trim();
    if (!sheetName) {
      setError("Please enter a name.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await saveData({ sheetName, fileData, overwrite });
      onSaved(sheetName);
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmOverwrite(true);
      } else {
        setError(err.response?.data?.message || "Error saving. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Guarda con el primer nombre libre: "Ventas (2)", "Ventas (3)"...
  const saveAsCopy = async () => {
    const base = name.trim();
    setIsSaving(true);
    setError("");
    try {
      for (let n = 2; n < 100; n++) {
        const copyName = `${base} (${n})`;
        try {
          await saveData({ sheetName: copyName, fileData, overwrite: false });
          onSaved(copyName);
          return;
        } catch (err) {
          if (err.response?.status !== 409) throw err;
        }
      }
      setError("Could not find a free name. Please choose another name.");
    } catch (err) {
      setError(err.response?.data?.message || "Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save(false);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
      <div
        role="dialog"
        aria-labelledby="save-dialog-title"
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 id="save-dialog-title" className="text-lg font-black text-gray-900 dark:text-white">
            Save sheet
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <label htmlFor="saveName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            id="saveName"
            autoFocus
            value={name}
            maxLength={200}
            onChange={(e) => {
              setName(e.target.value);
              setConfirmOverwrite(false);
            }}
            className="w-full text-sm font-bold bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />

          {confirmOverwrite && (
            <div className="flex gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 px-3 py-2 rounded-lg">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
              <span>
                A saved file named <strong>{name.trim()}</strong> already exists. Replace it, save a
                copy with a new name, or choose another name.
              </span>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {confirmOverwrite ? (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={saveAsCopy}
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
                >
                  Save as copy
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => save(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
                >
                  {isSaving && <FontAwesomeIcon icon={faSpinner} spin />}
                  Replace
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
              >
                <FontAwesomeIcon icon={isSaving ? faSpinner : faFloppyDisk} spin={isSaving} />
                Save
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default SaveDialog;
