"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Share2,
  History,
  Sparkles,
  Wifi,
  WifiOff,
  UserCheck,
  ShieldAlert,
  Loader2,
  Check,
  UserPlus,
  Trash2,
} from "lucide-react";
import { DocumentEditor } from "@/components/editor/document-editor";
import { VersionTimeline } from "@/features/versions/version-timeline";
import { AIPanel } from "@/features/ai/ai-panel";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSyncEngine } from "@/hooks/use-sync-engine";
import { saveDocumentLocally, getLocalDocument } from "@/sync/queue";
import type { DocumentDetail, ApiResponse } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default function DocumentPage({ params }: PageProps) {
  const { id: documentId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const isOnline = useOnlineStatus();
  const { status: syncStatus, pendingCount } = useSyncEngine();

  const [activePanel, setActivePanel] = useState<"version" | "ai" | "share" | null>(null);
  const [localTitle, setLocalTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Fetch document details
  const { data: document, isLoading, error } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async (): Promise<DocumentDetail> => {
      const cached = await getLocalDocument(documentId);

      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/documents/${documentId}`);
          const json: ApiResponse<DocumentDetail> = await res.json();
          if (json.success) {
            await saveDocumentLocally({
              id: json.data.id,
              title: json.data.title,
              content: json.data.content,
              ownerId: json.data.ownerId,
              userRole: json.data.userRole,
              lastModified: Date.now(),
              lastSynced: json.data.lastSyncedAt ? new Date(json.data.lastSyncedAt).getTime() : null,
              isNew: false,
            });
            return json.data;
          }
        } catch {
          // Fallback to local cache
        }
      }

      if (cached) {
        return {
          id: cached.id,
          title: cached.title,
          content: cached.content,
          yjsState: null,
          ownerId: cached.ownerId,
          owner: { id: cached.ownerId, name: "Owner", email: "", avatarUrl: null, createdAt: new Date() },
          isDeleted: false,
          lastSyncedAt: cached.lastSynced ? new Date(cached.lastSynced) : null,
          createdAt: new Date(),
          updatedAt: new Date(cached.lastModified),
          collaborators: [],
          userRole: (cached.userRole as DocumentDetail["userRole"]) || "EDITOR",
        };
      }

      throw new Error("Document not found");
    },
  });

  useEffect(() => {
    if (document) {
      setLocalTitle(document.title);
    }
  }, [document]);

  // Document update handler
  const handleContentUpdate = useCallback(
    async (content: Record<string, unknown>) => {
      if (!document) return;
      if (document.userRole === "VIEWER") return;

      await saveDocumentLocally({
        id: document.id,
        title: localTitle || document.title,
        content,
        ownerId: document.ownerId,
        userRole: document.userRole,
        lastModified: Date.now(),
        lastSynced: null,
        isNew: false,
      });
    },
    [document, localTitle]
  );

  // Title update handler
  async function handleTitleChange(newTitle: string) {
    setLocalTitle(newTitle);
    if (!document || document.userRole === "VIEWER") return;

    await saveDocumentLocally({
      id: document.id,
      title: newTitle,
      content: document.content,
      ownerId: document.ownerId,
      userRole: document.userRole,
      lastModified: Date.now(),
      lastSynced: null,
      isNew: false,
    });
  }

  // Invite collaborator mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      setInviteEmail("");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    },
  });

  // Remove collaborator mutation
  const removeCollabMutation = useMutation({
    mutationFn: async (collabId: string) => {
      const res = await fetch(
        `/api/documents/${documentId}/collaborators?collaboratorId=${collabId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbf9]">
        <Loader2 size={32} className="animate-spin text-slate-900" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fbfbf9] text-center">
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-8 shadow-[6px_6px_0px_#0f172a] max-w-md space-y-4">
          <ShieldAlert size={48} className="text-red-600 mx-auto" />
          <h2 className="text-xl font-bold font-display text-slate-900">Document Unavailable</h2>
          <p className="text-slate-600 text-xs font-medium">
            The requested document could not be found or you do not have permission to view it.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-[3px_3px_0px_#5cdb95] flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  const isReadOnly = document.userRole === "VIEWER";

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9] text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b-2 border-slate-900 bg-white/95 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-100 transition-all shadow-[2px_2px_0px_#0f172a]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Editable document title */}
            <input
              type="text"
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={isReadOnly}
              placeholder="Untitled Document"
              className="font-bold text-base bg-transparent border-b-2 border-transparent hover:border-slate-900 focus:border-slate-900 focus:outline-none px-1.5 py-0.5 rounded transition-all truncate max-w-md font-display"
            />

            {/* Role badge */}
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                document.userRole === "OWNER"
                  ? "bg-[#5cdb95] text-slate-900 border-slate-900"
                  : document.userRole === "EDITOR"
                  ? "bg-[#64b5f6] text-slate-900 border-slate-900"
                  : "bg-[#ffd54f] text-slate-900 border-slate-900"
              }`}
            >
              {document.userRole}
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Sync status badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${
                isOnline ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi size={13} className="text-emerald-600" />
                  <span>{pendingCount > 0 ? `Syncing (${pendingCount})` : "Synced"}</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} className="text-amber-600" />
                  <span>Offline (Saved locally)</span>
                </>
              )}
            </div>

            {/* Share / Collaborators button */}
            {document.userRole === "OWNER" && (
              <button
                onClick={() => setActivePanel(activePanel === "share" ? null : "share")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-slate-900 transition-all flex items-center gap-1.5 ${
                  activePanel === "share"
                    ? "bg-slate-900 text-white shadow-[2px_2px_0px_#5cdb95]"
                    : "bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#0f172a]"
                }`}
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Collaborators</span>
              </button>
            )}

            {/* Version History Toggle */}
            <button
              onClick={() => setActivePanel(activePanel === "version" ? null : "version")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-slate-900 transition-all flex items-center gap-1.5 ${
                activePanel === "version"
                  ? "bg-slate-900 text-white shadow-[2px_2px_0px_#5cdb95]"
                  : "bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#0f172a]"
              }`}
              title="Version History"
            >
              <History size={14} />
              <span className="hidden md:inline">History</span>
            </button>

            {/* AI Assistant Toggle */}
            {/* <button
              onClick={() => setActivePanel(activePanel === "ai" ? null : "ai")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-slate-900 transition-all flex items-center gap-1.5 ${
                activePanel === "ai"
                  ? "bg-slate-900 text-white shadow-[2px_2px_0px_#5cdb95]"
                  : "bg-white hover:bg-slate-100 shadow-[2px_2px_0px_#0f172a]"
              }`}
              title="AI Assistant"
            >
              <Sparkles size={14} />
              <span className="hidden md:inline">AI Assistant</span>
            </button> */}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
          {isReadOnly && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border-2 border-slate-900 text-amber-900 text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#0f172a]">
              <UserCheck size={16} />
              You are viewing this document in Read-Only mode. Viewers cannot edit or push updates.
            </div>
          )}

          <DocumentEditor
            initialContent={document.content}
            onUpdate={handleContentUpdate}
            readOnly={isReadOnly}
            className="rounded-2xl border-2 border-slate-900 bg-white shadow-[6px_6px_0px_#0f172a] overflow-hidden"
          />
        </div>

        {/* Share Modal Popover */}
        {activePanel === "share" && (
          <div className="absolute top-3 right-4 w-96 rounded-2xl border-2 border-slate-900 bg-white shadow-[6px_6px_0px_#0f172a] p-5 z-50 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5">
              <h3 className="font-bold text-sm flex items-center gap-2 font-display text-slate-900">
                <Share2 size={16} className="text-slate-900" />
                Manage Collaborators
              </h3>
              <button
                onClick={() => setActivePanel(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            {/* Invite Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900">
                Invite Collaborator by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="flex-1 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5cdb95]"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "EDITOR" | "VIEWER")}
                  className="px-2 py-1.5 rounded-xl border-2 border-slate-900 bg-white text-xs font-bold"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending || !inviteEmail}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1 shadow-[2px_2px_0px_#5cdb95]"
                >
                  {inviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                </button>
              </div>
              {inviteSuccess && (
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <Check size={12} /> Collaborator invited successfully!
                </p>
              )}
            </div>

            {/* Collaborator List */}
            <div className="space-y-2 pt-2 border-t-2 border-slate-200">
              <label className="text-xs font-bold text-slate-900">
                Active Collaborators ({document.collaborators.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {document.collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border-2 border-slate-900 bg-[#f4f4f0] text-xs font-medium"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{collab.userName}</p>
                      <p className="text-[10px] text-slate-500">{collab.userEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-900">
                        {collab.role}
                      </span>
                      {collab.role !== "OWNER" && (
                        <button
                          onClick={() => removeCollabMutation.mutate(collab.id)}
                          className="text-red-600 hover:opacity-80 p-1"
                          title="Remove collaborator"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Version Timeline Panel */}
        {activePanel === "version" && (
          <VersionTimeline
            documentId={document.id}
            userRole={document.userRole}
            onClose={() => setActivePanel(null)}
          />
        )}

        {/* AI Assistant Panel */}
        {activePanel === "ai" && (
          <AIPanel
            documentId={document.id}
            documentContent={document.content}
            onClose={() => setActivePanel(null)}
          />
        )}
      </div>
    </div>
  );
}
