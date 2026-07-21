"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  History,
  Clock,
  RotateCcw,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { formatDate, extractTextFromContent } from "@/lib/utils";
import type { DocumentVersionInfo, ApiResponse } from "@/types";

interface VersionTimelineProps {
  documentId: string;
  userRole: string;
  onSelectVersion?: (version: DocumentVersionInfo) => void;
  onClose: () => void;
}

export function VersionTimeline({
  documentId,
  userRole,
  onSelectVersion,
  onClose,
}: VersionTimelineProps) {
  const queryClient = useQueryClient();
  const [newVersionTitle, setNewVersionTitle] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Fetch version history
  const { data: versions, isLoading } = useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: async (): Promise<DocumentVersionInfo[]> => {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      const json: ApiResponse<DocumentVersionInfo[]> = await res.json();
      if (!json.success) throw new Error("Failed to fetch version history");
      return json.data;
    },
  });

  // Create snapshot mutation
  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions", documentId] });
      setNewVersionTitle("");
      setShowCreateForm(false);
    },
  });

  // Restore version mutation
  const restoreMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch(
        `/api/documents/${documentId}/versions/${versionId}/restore`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions", documentId] });
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      alert("Document restored! A new version snapshot record was created.");
    },
  });

  const isOwner = userRole === "OWNER";
  const canEdit = userRole === "OWNER" || userRole === "EDITOR";

  return (
    <div className="w-80 h-full border-l-2 border-slate-900 bg-white flex flex-col shadow-[-4px_0px_0px_#0f172a] z-30">
      {/* Header */}
      <div className="p-4 border-b-2 border-slate-900 flex items-center justify-between bg-[#f4f4f0]">
        <div className="flex items-center gap-2">
          <History size={18} className="text-slate-900" />
          <h2 className="font-bold text-sm font-display text-slate-900">Version History</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900"
        >
          <X size={16} />
        </button>
      </div>

      {/* Save snapshot trigger */}
      {canEdit && (
        <div className="p-3 border-b-2 border-slate-900 bg-white">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2 px-3 rounded-full border-2 border-dashed border-slate-900 hover:bg-slate-50 text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus size={14} />
              Save Manual Snapshot
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={newVersionTitle}
                onChange={(e) => setNewVersionTitle(e.target.value)}
                placeholder="Version label (e.g. Major Revision)..."
                className="w-full px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5cdb95]"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => createMutation.mutate(newVersionTitle || "Manual Snapshot")}
                  disabled={createMutation.isPending}
                  className="flex-1 py-1.5 px-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-1 disabled:opacity-50 shadow-[2px_2px_0px_#5cdb95]"
                >
                  {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="py-1.5 px-3 rounded-full border border-slate-900 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version timeline list */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-slate-900" />
          </div>
        )}

        {!isLoading && versions?.length === 0 && (
          <div className="text-center py-10 text-xs font-medium text-slate-500">
            No saved versions yet. Save a snapshot to track history.
          </div>
        )}

        {versions?.map((version) => {
          const isSelected = selectedVersionId === version.id;
          const snippet = extractTextFromContent(version.content);

          return (
            <div
              key={version.id}
              onClick={() => {
                setSelectedVersionId(version.id);
                onSelectVersion?.(version);
              }}
              className={`p-3 rounded-xl border-2 border-slate-900 text-xs cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#5cdb95]/20 shadow-[3px_3px_0px_#0f172a]"
                  : "bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0f172a]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-slate-900">v{version.version}</span>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Clock size={10} />
                  {formatDate(version.createdAt)}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 line-clamp-1 mb-1 font-display text-sm">
                {version.title}
              </h4>

              {snippet && (
                <p className="text-[11px] text-slate-600 line-clamp-2 italic mb-2">
                  &ldquo;{snippet}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] font-bold text-slate-600">
                <span>By {version.createdByName}</span>

                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Restore to v${version.version} ("${version.title}")?`)) {
                        restoreMutation.mutate(version.id);
                      }
                    }}
                    disabled={restoreMutation.isPending}
                    className="text-slate-900 hover:underline font-extrabold flex items-center gap-1"
                    title="Restore version (creates new version)"
                  >
                    <RotateCcw size={10} />
                    Restore
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
