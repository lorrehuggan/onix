import { useEffect, useState } from "react";

import type { CreateVaultRequest, Vault, VaultInfo } from "../types";
import { VaultApi, vaultUtils } from "../utils/vaultApi";
import { VaultInfo as VaultInfoComponent } from "./VaultInfo";
import { VaultPicker } from "./VaultPicker";

export function VaultManagementExample() {
  const [currentVault, setCurrentVault] = useState<Vault | null>(null);
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [vaultsInfo, setVaultsInfo] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo state for vault operations
  const [demoVaultName, setDemoVaultName] = useState("My Demo Vault");
  const [demoVaultPath, setDemoVaultPath] = useState("/tmp/demo-vault");
  const [demoVaultDescription, setDemoVaultDescription] = useState("A demo vault for testing");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [vault, vaults] = await Promise.all([
        VaultApi.getCurrentVault(),
        VaultApi.getVaultsInfo(),
      ]);

      setCurrentVault(vault);
      setVaultsInfo(vaults);
    } catch (err: unknown) {
      setError(`Failed to load vault data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVaultSelected = (vault: Vault) => {
    setCurrentVault(vault);
    setShowVaultPicker(false);
    loadVaultsInfo();
  };

  const loadVaultsInfo = async () => {
    try {
      const vaults = await VaultApi.getVaultsInfo();
      setVaultsInfo(vaults);
    } catch (err: unknown) {
      console.error("Failed to load vaults info:", err);
    }
  };

  const handleCreateDemoVault = async () => {
    if (!demoVaultName.trim() || !demoVaultPath.trim()) {
      setError("Vault name and path are required");
      return;
    }

    if (!vaultUtils.isValidVaultName(demoVaultName)) {
      setError("Invalid vault name. Please avoid special characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateVaultRequest = {
        path: demoVaultPath,
        name: demoVaultName.trim(),
        description: demoVaultDescription.trim() || undefined,
      };

      const vault = await VaultApi.createVault(request);
      setCurrentVault(vault);
      await loadVaultsInfo();
    } catch (err: unknown) {
      setError(`Failed to create vault: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDemoVault = async (vaultPath: string) => {
    setLoading(true);
    setError(null);

    try {
      const vault = await VaultApi.openVault(vaultPath);
      setCurrentVault(vault);
      await loadVaultsInfo();
    } catch (err: unknown) {
      setError(`Failed to open vault: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVault = async () => {
    try {
      await VaultApi.closeVault();
      setCurrentVault(null);
      await loadVaultsInfo();
    } catch (err: unknown) {
      setError(`Failed to close vault: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCheckIsVault = async (path: string) => {
    try {
      const isVault = await VaultApi.isVault(path);
      alert(`Path "${path}" ${isVault ? "is" : "is not"} a vault`);
    } catch (err: unknown) {
      setError(`Failed to check vault: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Vault Management Example</h1>

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
        <div className="mb-4 rounded border border-blue-400 bg-blue-100 px-4 py-3 text-blue-700">
          Loading...
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Vault Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Vault</h2>
          <VaultInfoComponent
            onOpenVaultPicker={() => setShowVaultPicker(true)}
            onRefresh={loadInitialData}
          />
        </div>

        {/* Vault Operations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vault Operations</h2>

          {/* Quick Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setShowVaultPicker(true)}
              disabled={loading}
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Open Vault Picker
            </button>

            {currentVault && (
              <button
                onClick={handleCloseVault}
                disabled={loading}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Close Current Vault
              </button>
            )}
          </div>

          {/* Demo Vault Creation */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-3 font-medium">Create Demo Vault</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vault Name</label>
                <input
                  type="text"
                  value={demoVaultName}
                  onChange={e => setDemoVaultName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 ring-blue-500 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Path</label>
                <input
                  type="text"
                  value={demoVaultPath}
                  onChange={e => setDemoVaultPath(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 ring-blue-500 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={demoVaultDescription}
                  onChange={e => setDemoVaultDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 ring-blue-500 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleCreateDemoVault}
                disabled={loading || !demoVaultName.trim() || !demoVaultPath.trim()}
                className="w-full rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              >
                Create Demo Vault
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vaults List */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Vaults ({vaultsInfo.length})</h2>
          <button
            onClick={loadVaultsInfo}
            disabled={loading}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {vaultsInfo.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vaultsInfo.map(vault => (
              <div
                key={vault.id}
                className={`rounded-lg border p-4 ${
                  vault.is_current ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{vault.name}</h3>
                      {vault.is_current && (
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {vaultUtils.formatVaultPath(vault.path)}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-gray-400">
                      <div>{vaultUtils.getVaultSummary(vault)}</div>
                      <div>Opened {vaultUtils.getRelativeTime(vault.last_opened)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {!vault.is_current && (
                    <button
                      onClick={() => handleOpenDemoVault(vault.path)}
                      disabled={loading}
                      className="flex-1 rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      Open
                    </button>
                  )}
                  <button
                    onClick={() => handleCheckIsVault(vault.path)}
                    disabled={loading}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Check
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
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
            <div className="text-gray-500">No vaults found</div>
            <div className="mt-2 text-sm text-gray-400">Create a new vault to get started</div>
          </div>
        )}
      </div>

      {/* API Status */}
      <div className="mt-8 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-3 font-medium text-gray-900">Vault API Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <div className="font-medium text-gray-700">Current Vault</div>
            <div className="text-gray-500">{currentVault ? "✓ Loaded" : "✗ None"}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Total Vaults</div>
            <div className="text-gray-500">{vaultsInfo.length}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Loading</div>
            <div className="text-gray-500">{loading ? "✓ Active" : "✗ Idle"}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Last Error</div>
            <div className="text-gray-500">{error ? "✓ Present" : "✗ None"}</div>
          </div>
        </div>

        {currentVault && (
          <div className="mt-4 rounded border border-gray-200 bg-white p-3">
            <div className="font-mono text-xs text-gray-600">
              <div>
                <span className="font-semibold">ID:</span> {currentVault.id}
              </div>
              <div>
                <span className="font-semibold">Name:</span> {currentVault.name}
              </div>
              <div>
                <span className="font-semibold">Path:</span> {currentVault.path}
              </div>
              <div>
                <span className="font-semibold">Notes:</span> {currentVault.note_count}
              </div>
              <div>
                <span className="font-semibold">Size:</span>{" "}
                {vaultUtils.formatSize(currentVault.total_size)}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{" "}
                {vaultUtils.formatTimestamp(currentVault.created_at)}
              </div>
              <div>
                <span className="font-semibold">Modified:</span>{" "}
                {vaultUtils.formatTimestamp(currentVault.last_opened)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vault Picker Modal */}
      {showVaultPicker && (
        <VaultPicker
          onVaultSelected={handleVaultSelected}
          onClose={() => setShowVaultPicker(false)}
        />
      )}
    </div>
  );
}
