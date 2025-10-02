import { useEffect, useState } from "react";

import type { CreateVaultRequest, RecentVault, Vault, VaultInfo } from "../types";
import { VaultApi, vaultUtils } from "../utils/vaultApi";

interface VaultPickerProps {
  onVaultSelected: (vault: Vault) => void;
  onClose: () => void;
}

export function VaultPicker({ onVaultSelected, onClose }: VaultPickerProps) {
  const [vaultsInfo, setVaultsInfo] = useState<VaultInfo[]>([]);
  const [_recentVaults, setRecentVaults] = useState<RecentVault[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create vault form state
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultPath, setNewVaultPath] = useState("");
  const [newVaultDescription, setNewVaultDescription] = useState("");

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    setLoading(true);
    setError(null);

    try {
      const [vaultsData, recentData] = await Promise.all([
        VaultApi.getVaultsInfo(),
        VaultApi.getRecentVaults(),
      ]);

      setVaultsInfo(vaultUtils.sortVaultsByLastOpened(vaultsData));
      setRecentVaults(recentData);
    } catch (err: unknown) {
      setError(`Failed to load vaults: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVault = async (vaultPath: string) => {
    setLoading(true);
    setError(null);

    try {
      const vault = await VaultApi.openVault(vaultPath);
      onVaultSelected(vault);
    } catch (err: unknown) {
      setError(`Failed to open vault: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selectedPath = await VaultApi.selectFolder();
      if (selectedPath) {
        // Check if it's already a vault
        const isExistingVault = await VaultApi.isVault(selectedPath);

        if (isExistingVault) {
          // Open existing vault
          await handleOpenVault(selectedPath);
        } else {
          // Set up for creating new vault
          setNewVaultPath(selectedPath);
          setNewVaultName(vaultUtils.generateVaultName(selectedPath));
          setShowCreateForm(true);
        }
      }
    } catch (err: unknown) {
      setError(`Failed to select folder: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateVault = async () => {
    if (!newVaultName.trim() || !newVaultPath.trim()) {
      setError("Vault name and path are required");
      return;
    }

    if (!vaultUtils.isValidVaultName(newVaultName)) {
      setError("Invalid vault name. Please avoid special characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateVaultRequest = {
        path: newVaultPath,
        name: newVaultName.trim(),
        description: newVaultDescription.trim() || undefined,
      };

      const vault = await VaultApi.createVault(request);
      onVaultSelected(vault);
    } catch (err: unknown) {
      setError(`Failed to create vault: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewVaultName("");
    setNewVaultPath("");
    setNewVaultDescription("");
    setError(null);
  };

  const filteredVaults = vaultUtils.filterVaults(vaultsInfo, searchQuery);

  if (showCreateForm) {
    return (
      <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold">Create New Vault</h2>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vault Name</label>
              <input
                type="text"
                value={newVaultName}
                onChange={e => setNewVaultName(e.target.value)}
                placeholder="My Knowledge Base"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 ring-blue-500 focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={vaultUtils.formatVaultPath(newVaultPath)}
                readOnly
                className="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                value={newVaultDescription}
                onChange={e => setNewVaultDescription(e.target.value)}
                placeholder="Brief description of this vault..."
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 ring-blue-500 focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCancelCreate}
              disabled={loading}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateVault}
              disabled={loading || !newVaultName.trim()}
              className="flex-1 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Vault"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="mx-4 h-[80vh] w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-bold">Select Vault</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="border-b px-6 py-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search vaults..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 ring-blue-500 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-red-800 underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading vaults...</div>
              </div>
            )}

            {!loading && (
              <>
                {/* Quick Actions */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleSelectFolder}
                    className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-left hover:border-blue-400 hover:bg-blue-50"
                  >
                    <div className="rounded-full bg-blue-100 p-2">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Open Folder</div>
                      <div className="text-sm text-gray-500">Select an existing folder</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setNewVaultPath("");
                      setNewVaultName("");
                      setShowCreateForm(true);
                    }}
                    className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-left hover:border-green-400 hover:bg-green-50"
                  >
                    <div className="rounded-full bg-green-100 p-2">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Create New</div>
                      <div className="text-sm text-gray-500">Set up a new vault</div>
                    </div>
                  </button>
                </div>

                {/* Recent Vaults */}
                {filteredVaults.length > 0 ? (
                  <div>
                    <h3 className="mb-3 font-medium text-gray-900">
                      {searchQuery ? "Search Results" : "Recent Vaults"}
                    </h3>
                    <div className="space-y-2">
                      {filteredVaults.map(vault => (
                        <div
                          key={vault.id}
                          className={`group flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:border-blue-300 hover:bg-blue-50 ${
                            vault.is_current ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          }`}
                          onClick={() => handleOpenVault(vault.path)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">{vault.name}</div>
                              {vault.is_current && (
                                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vaultUtils.formatVaultPath(vault.path)}
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              {vaultUtils.getVaultSummary(vault)} •{" "}
                              {vaultUtils.getRelativeTime(vault.last_opened)}
                            </div>
                          </div>
                          <svg
                            className="h-5 w-5 text-gray-400 group-hover:text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 p-3">
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
                    <div className="text-gray-500">
                      {searchQuery ? "No vaults found matching your search" : "No vaults found"}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      {searchQuery
                        ? "Try a different search term"
                        : "Create a new vault or open an existing folder"}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
