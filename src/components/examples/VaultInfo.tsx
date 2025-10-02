import { useEffect, useState } from "react";

import type { Vault } from "../types";
import { VaultApi, vaultUtils } from "../utils/vaultApi";

interface VaultInfoProps {
  onOpenVaultPicker: () => void;
  onRefresh?: () => void;
}

export function VaultInfo({ onOpenVaultPicker, onRefresh }: VaultInfoProps) {
  const [currentVault, setCurrentVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentVault();
  }, []);

  const loadCurrentVault = async () => {
    setLoading(true);
    setError(null);

    try {
      const vault = await VaultApi.getCurrentVault();
      setCurrentVault(vault);
    } catch (err: unknown) {
      setError(`Failed to load vault: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVault = async () => {
    try {
      await VaultApi.closeVault();
      setCurrentVault(null);
      onRefresh?.();
    } catch (err: unknown) {
      setError(`Failed to close vault: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRefresh = async () => {
    await loadCurrentVault();
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
        <div className="h-5 w-5 animate-pulse rounded-full bg-gray-300"></div>
        <div className="text-sm text-gray-500">Loading vault...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-red-700">{error}</div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (!currentVault) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 p-3">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
          </svg>
        </div>
        <div className="mb-2 font-medium text-gray-900">No vault selected</div>
        <div className="mb-4 text-sm text-gray-500">
          Select a vault to start working with your notes
        </div>
        <button
          onClick={onOpenVaultPicker}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          Select Vault
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 p-2">
              <svg
                className="h-4 w-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{currentVault.name}</h3>
              <p className="text-sm text-gray-500">
                {vaultUtils.formatVaultPath(currentVault.path)}
              </p>
            </div>
          </div>

          {currentVault.config.description && (
            <p className="mt-2 text-sm text-gray-600">{currentVault.config.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>
                {currentVault.note_count} {currentVault.note_count === 1 ? "note" : "notes"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              <span>{vaultUtils.formatSize(currentVault.total_size)}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Opened {vaultUtils.getRelativeTime(currentVault.last_opened)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Refresh vault info"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <div className="relative">
            <button
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={() => {
                // Toggle dropdown menu
                const dropdown = document.getElementById("vault-menu");
                dropdown?.classList.toggle("hidden");
              }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            <div
              id="vault-menu"
              className="absolute top-full right-0 z-10 mt-1 hidden w-48 rounded-md border border-gray-200 bg-white shadow-lg"
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenVaultPicker();
                    document.getElementById("vault-menu")?.classList.add("hidden");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Switch Vault
                </button>
                <button
                  onClick={() => {
                    handleCloseVault();
                    document.getElementById("vault-menu")?.classList.add("hidden");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Close Vault
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
