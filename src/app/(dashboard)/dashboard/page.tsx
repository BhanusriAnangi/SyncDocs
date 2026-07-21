"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FileText,
  Search,
  MoreVertical,
  Trash2,
  Users,
  Clock,
  Loader2,
} from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";
import type { DocumentSummary } from "@/types";
import type { ApiResponse } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Fetch documents
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<DocumentSummary[]> => {
      const res = await fetch("/api/documents");
      const json: ApiResponse<DocumentSummary[]> = await res.json();
      if (!json.success) throw new Error("Failed to fetch documents");
      return json.data;
    },
  });

  // Create document
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      router.push(`/documents/${data.id}`);
    },
  });

  // Delete document
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setMenuOpen(null);
    },
  });

  const documents = data ?? [];
  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const styles = {
      OWNER: "bg-[#5cdb95] text-slate-900 border-slate-900",
      EDITOR: "bg-[#64b5f6] text-slate-900 border-slate-900",
      VIEWER: "bg-[#ffd54f] text-slate-900 border-slate-900",
    };
    return styles[role as keyof typeof styles] || styles.VIEWER;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-900">
            My Workspace Documents
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Local-first editing with real-time background sync
          </p>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-[4px_4px_0px_#5cdb95] hover:shadow-[2px_2px_0px_#5cdb95] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center gap-2 disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          New Document
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          id="search-documents"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workspace documents..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-900 bg-white text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5cdb95] shadow-[2px_2px_0px_#0f172a]"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border-2 border-slate-900 rounded-2xl p-8 shadow-[6px_6px_0px_#0f172a]">
          <div className="w-14 h-14 rounded-xl bg-[#f4f4f0] border-2 border-slate-900 flex items-center justify-center mb-4 shadow-[2px_2px_0px_#5cdb95]">
            <FileText className="w-7 h-7 text-slate-900" />
          </div>
          <h3 className="text-lg font-bold font-display text-slate-900 mb-1">
            {search ? "No matching documents" : "No documents created yet"}
          </h3>
          <p className="text-slate-600 text-xs font-medium mb-4 max-w-xs">
            {search
              ? "Try adjusting your search terms"
              : "Create your first local-first document to start writing"}
          </p>
          {!search && (
            <button
              onClick={() => createMutation.mutate()}
              className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-[3px_3px_0px_#5cdb95] flex items-center gap-1.5"
            >
              <Plus size={14} />
              Create First Document
            </button>
          )}
        </div>
      )}

      {/* Document grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className="group relative rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[5px_5px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer flex flex-col justify-between"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/documents/${doc.id}`);
              }}
              aria-label={`Open document: ${doc.title}`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold border border-slate-900 shadow-[2px_2px_0px_#5cdb95]">
                    <FileText className="w-5 h-5 text-white" />
                  </div>

                  {/* Options menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === doc.id ? null : doc.id);
                      }}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all"
                      aria-label="Document options"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-700" />
                    </button>
                    {menuOpen === doc.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border-2 border-slate-900 bg-white shadow-[4px_4px_0px_#0f172a] z-20 py-1">
                        {doc.role === "OWNER" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this document?")) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete Document
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">
                  {truncate(doc.title, 40)}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-2">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(doc.updatedAt)}
                  </span>
                  {doc.collaboratorCount > 1 && (
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Users size={12} />
                      {doc.collaboratorCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Role badge */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getRoleBadge(doc.role)}`}
                >
                  {doc.role}
                </span>

                {/* <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                  Open $\rightarrow$
                </span> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
