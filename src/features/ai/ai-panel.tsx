"use client";

import { useState } from "react";
import {
  Sparkles,
  Wand2,
  FileText,
  Languages,
  CheckCheck,
  RotateCcw,
  Copy,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { extractTextFromContent } from "@/lib/utils";

interface AIPanelProps {
  documentId: string;
  documentContent: Record<string, unknown> | null;
  onApplyResult?: (text: string) => void;
  onClose: () => void;
}

export function AIPanel({
  documentId,
  documentContent,
  onApplyResult,
  onClose,
}: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const plainText = extractTextFromContent(documentContent);

  async function handleAIAction(action: string) {
    if (!plainText) {
      alert("Document is empty! Add text first to use AI features.");
      return;
    }

    setLoading(true);
    setActiveAction(action);
    setResult(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          content: plainText,
          targetLanguage: action === "translate" ? targetLanguage : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "AI request failed");
      }

      setResult(json.data.result);
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI Action Failed");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-80 h-full border-l-2 border-slate-900 bg-white flex flex-col shadow-[-4px_0px_0px_#0f172a] z-30">
      {/* Header */}
      <div className="p-4 border-b-2 border-slate-900 flex items-center justify-between bg-[#f4f4f0]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center border border-slate-900 shadow-[1px_1px_0px_#5cdb95]">
            <Sparkles size={14} className="text-[#5cdb95]" />
          </div>
          <h2 className="font-bold text-sm font-display text-slate-900">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Action grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Quick Actions
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAIAction("summarize")}
              disabled={loading}
              className="p-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 text-left text-xs font-bold flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#0f172a] disabled:opacity-50 text-slate-900"
            >
              <FileText size={14} className="text-slate-900" />
              Summarize
            </button>

            <button
              onClick={() => handleAIAction("improve")}
              disabled={loading}
              className="p-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 text-left text-xs font-bold flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#0f172a] disabled:opacity-50 text-slate-900"
            >
              <Wand2 size={14} className="text-slate-900" />
              Improve Tone
            </button>

            <button
              onClick={() => handleAIAction("title")}
              disabled={loading}
              className="p-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 text-left text-xs font-bold flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#0f172a] disabled:opacity-50 text-slate-900"
            >
              <Sparkles size={14} className="text-slate-900" />
              Suggest Title
            </button>

            <button
              onClick={() => handleAIAction("grammar")}
              disabled={loading}
              className="p-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 text-left text-xs font-bold flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#0f172a] disabled:opacity-50 text-slate-900"
            >
              <CheckCheck size={14} className="text-slate-900" />
              Fix Grammar
            </button>
          </div>
        </div>

        {/* Translation action */}
        <div className="space-y-2 pt-3 border-t-2 border-slate-200">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Translate Content
          </label>
          <div className="flex gap-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-xl border-2 border-slate-900 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5cdb95]"
            >
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Hindi">Hindi</option>
              <option value="Japanese">Japanese</option>
            </select>
            <button
              onClick={() => handleAIAction("translate")}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1 disabled:opacity-50 shadow-[2px_2px_0px_#5cdb95]"
            >
              <Languages size={14} />
              Translate
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-[#f4f4f0] text-center space-y-2 shadow-[3px_3px_0px_#0f172a]">
            <Loader2 size={20} className="animate-spin text-slate-900 mx-auto" />
            <p className="text-xs text-slate-900 font-bold">
              Generating {activeAction} with Gemini...
            </p>
          </div>
        )}

        {/* Result view */}
        {result && !loading && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                AI Result
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg border border-slate-900 hover:bg-slate-100 text-xs flex items-center gap-1 font-bold"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="p-3 rounded-xl border-2 border-slate-900 bg-[#fbfbf9] text-xs leading-relaxed font-sans whitespace-pre-wrap max-h-60 overflow-y-auto text-slate-900 font-medium shadow-[2px_2px_0px_#0f172a]">
              {result}
            </div>

            {onApplyResult && (
              <button
                onClick={() => onApplyResult(result)}
                className="w-full py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#5cdb95]"
              >
                <RotateCcw size={14} />
                Insert into Document
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
