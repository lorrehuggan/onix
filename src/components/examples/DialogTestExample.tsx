import { useState } from "react";

import { VaultApi } from "../utils/vaultApi";

export function DialogTestExample() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const testDialogs = async () => {
    setLoading(true);
    setResult("");
    try {
      const testResult = await VaultApi.testDialogFunctionality();
      setResult(testResult);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const selectFolder = async () => {
    setLoading(true);
    try {
      const folder = await VaultApi.selectFolder();
      setSelectedFolder(folder);
      if (folder) {
        setResult(`✅ Folder selected: ${folder}`);
      } else {
        setResult("❌ No folder selected (user cancelled)");
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-bold text-gray-800">Dialog Test Example</h2>

      <div className="space-y-4">
        <div>
          <button
            onClick={testDialogs}
            disabled={loading}
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test All Dialogs"}
          </button>
          <p className="mt-1 text-sm text-gray-600">
            Tests message dialog, confirmation dialog, and folder picker
          </p>
        </div>

        <div>
          <button
            onClick={selectFolder}
            disabled={loading}
            className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Selecting..." : "Select Folder Only"}
          </button>
          <p className="mt-1 text-sm text-gray-600">Opens the folder picker dialog directly</p>
        </div>

        {selectedFolder && (
          <div className="rounded bg-gray-100 p-3">
            <p className="text-sm font-semibold text-gray-700">Last Selected Folder:</p>
            <p className="text-sm break-all text-gray-600">{selectedFolder}</p>
          </div>
        )}

        {result && (
          <div
            className={`rounded p-3 ${
              result.includes("Error")
                ? "border border-red-300 bg-red-100"
                : "border border-green-300 bg-green-100"
            }`}
          >
            <p
              className={`text-sm ${result.includes("Error") ? "text-red-700" : "text-green-700"}`}
            >
              {result}
            </p>
          </div>
        )}

        <div className="border-t pt-3 text-xs text-gray-500">
          <p>
            <strong>What this demonstrates:</strong>
          </p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>Native system dialog integration</li>
            <li>Folder picker functionality</li>
            <li>Message and confirmation dialogs</li>
            <li>Error handling for dialog operations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
