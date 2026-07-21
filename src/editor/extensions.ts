import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

/**
 * Create the lowlight instance for syntax highlighting.
 */
const lowlight = createLowlight(common);

/**
 * Returns the full set of Tiptap extensions for the document editor.
 *
 * Architecture decision: Extensions are configured centrally here so
 * every editor instance (main editor, version preview, etc.) uses
 * the same schema. Mismatched schemas across clients could corrupt
 * Yjs CRDT state during collaboration.
 */
export function getEditorExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false, // Replaced by CodeBlockLowlight
      link: false,      // Configured explicitly below
      underline: false, // Configured explicitly below
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: "rounded-lg max-w-full",
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    Placeholder.configure({
      placeholder: "Start writing... (use '/' for commands)",
    }),
    Typography,
    Highlight.configure({
      multicolor: true,
    }),
    Color,
    TextStyle,
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ];
}
