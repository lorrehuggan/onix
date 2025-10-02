import { useState } from "react";

import type { CreateNoteRequest, Note, NoteInfo } from "../types/files";
import { FileApi, fileUtils } from "../utils/fileApi";

export function FileOperationsExample() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [notesList, setNotesList] = useState<NoteInfo[]>([]);
  const [directoryPath, setDirectoryPath] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadNote = async (filePath: string) => {
    if (!filePath.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const note = await FileApi.readNote(filePath);
      setCurrentNote(note);
    } catch (err: unknown) {
      setError(`Failed to load note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote) return;

    setLoading(true);
    setError(null);

    try {
      await FileApi.writeNote(currentNote.path, currentNote.content);
      // Refresh the note to get updated metadata
      const refreshedNote = await FileApi.readNote(currentNote.path);
      setCurrentNote(refreshedNote);
    } catch (err: unknown) {
      setError(`Failed to save note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !directoryPath.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const fileName = fileUtils.titleToFileName(newNoteTitle);
      const filePath = `${directoryPath}/${fileName}.md`;

      const request: CreateNoteRequest = {
        path: filePath,
        title: newNoteTitle,
      };

      const note = await FileApi.createNote(request);
      setCurrentNote(note);
      setNewNoteTitle("");

      // Refresh the directory listing
      if (directoryPath) {
        handleListNotes();
      }
    } catch (err: unknown) {
      setError(`Failed to create note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (filePath: string) => {
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) return;

    setLoading(true);
    setError(null);

    try {
      await FileApi.deleteNote(filePath);

      // Clear current note if it was deleted
      if (currentNote?.path === filePath) {
        setCurrentNote(null);
      }

      // Refresh the directory listing
      if (directoryPath) {
        handleListNotes();
      }
    } catch (err: unknown) {
      setError(`Failed to delete note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListNotes = async () => {
    if (!directoryPath.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const notes = await FileApi.listNotes(directoryPath);
      setNotesList(notes);
    } catch (err: unknown) {
      setError(`Failed to list notes: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">File Operations Example</h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 rounded border border-blue-400 bg-blue-100 px-4 py-3 text-blue-700">
          Loading...
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Directory and File Listing */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Directory Operations</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Directory Path:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={directoryPath}
                onChange={e => setDirectoryPath(e.target.value)}
                placeholder="/path/to/notes"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
              />
              <button
                onClick={handleListNotes}
                disabled={loading || !directoryPath.trim()}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                List Notes
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Notes ({notesList.length})</h3>
            <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
              {notesList.map(note => (
                <div
                  key={note.path}
                  className="flex items-center justify-between border-b p-3 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{note.title}</div>
                    <div className="text-sm text-gray-500">
                      {fileUtils.formatFileSize(note.size)} •{" "}
                      {fileUtils.formatTimestamp(note.modified_at)}
                    </div>
                    <div className="text-xs text-gray-400">{note.path}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadNote(note.path)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.path)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {notesList.length === 0 && directoryPath && (
                <div className="p-3 text-center text-gray-500">No markdown files found</div>
              )}
            </div>
          </div>

          {/* Create Note */}
          <div className="space-y-2">
            <h3 className="font-medium">Create New Note</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                placeholder="Note title"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
              />
              <button
                onClick={handleCreateNote}
                disabled={loading || !newNoteTitle.trim() || !directoryPath.trim()}
                className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Note Editor */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Note Editor</h2>

          {currentNote ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{currentNote.title}</h3>
                  <div className="text-sm text-gray-500">{currentNote.path}</div>
                </div>
                <button
                  onClick={handleSaveNote}
                  disabled={loading}
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  Save
                </button>
              </div>

              <textarea
                value={currentNote.content}
                onChange={e => setCurrentNote({ ...currentNote, content: e.target.value })}
                rows={16}
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                placeholder="Write your markdown content here..."
              />

              <div className="space-y-1 text-sm text-gray-500">
                <div>Size: {fileUtils.formatFileSize(currentNote.size)}</div>
                {currentNote.modified_at && (
                  <div>Modified: {fileUtils.formatTimestamp(currentNote.modified_at)}</div>
                )}
                {currentNote.created_at && (
                  <div>Created: {fileUtils.formatTimestamp(currentNote.created_at)}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-md bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="mb-2 text-lg font-medium">No note loaded</div>
                <div className="text-sm">Load a note from the list or create a new one</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
