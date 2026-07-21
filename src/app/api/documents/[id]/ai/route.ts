import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { verifyAccess } from "@/server/services/document.service";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const aiRequestSchema = z.object({
  action: z.enum([
    "summarize",
    "improve",
    "title",
    "grammar",
    "translate",
    "rewrite",
  ]),
  content: z.string().min(1, "Content is required").max(50000, "Content too long"),
  targetLanguage: z.string().optional(),
  customInstructions: z.string().optional(),
});

/**
 * POST /api/documents/[id]/ai
 * AI features route powered by Vercel AI SDK and Google Gemini.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const access = await verifyAccess(id, session.user.id);
    if (!access) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = aiRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, content, targetLanguage, customInstructions } = parsed.data;

    let systemPrompt = "You are an expert editor and writing assistant for document collaboration.";
    let userPrompt = "";

    switch (action) {
      case "summarize":
        userPrompt = `Provide a concise, clear summary (3-5 bullet points) of the following document content:\n\n${content}`;
        break;
      case "improve":
        userPrompt = `Improve the clarity, tone, and flow of the following text while keeping the key points:\n\n${content}`;
        break;
      case "title":
        userPrompt = `Suggest 3 compelling, relevant titles for the following document. Return ONLY the titles separated by newlines:\n\n${content}`;
        break;
      case "grammar":
        userPrompt = `Correct all grammar, spelling, and punctuation errors in the following text. Preserve the formatting:\n\n${content}`;
        break;
      case "translate":
        userPrompt = `Translate the following text accurately into ${targetLanguage || "Spanish"}:\n\n${content}`;
        break;
      case "rewrite":
        userPrompt = `Rewrite the following text professionally:\n\n${customInstructions ? `Instructions: ${customInstructions}\n\n` : ""}${content}`;
        break;
    }

    // Check if API key is configured
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      // Fallback demo response if API key is not yet set up
      return NextResponse.json({
        success: true,
        data: {
          result: getFallbackAiResult(action, content, targetLanguage),
          action,
          isMock: true,
        },
      });
    }

    const response = await generateText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return NextResponse.json({
      success: true,
      data: {
        result: response.text,
        action,
        isMock: false,
      },
    });
  } catch (error) {
    console.error("[POST /api/documents/[id]/ai]", error);
    return NextResponse.json({ success: false, error: "AI processing failed" }, { status: 500 });
  }
}

/**
 * Fallback demo responses when GOOGLE_GENERATIVE_AI_API_KEY is not configured in environment.
 */
function getFallbackAiResult(action: string, content: string, language?: string): string {
  const sample = content.slice(0, 100);
  switch (action) {
    case "summarize":
      return `• Main Point 1: Key topic overview based on document contents.\n• Main Point 2: Analysis of primary ideas.\n• Conclusion: Strategic recommendations and next steps.`;
    case "improve":
      return `Enhanced Version:\n${content.replace(/very /gi, "").trim()}`;
    case "title":
      return `1. Executive Summary & Action Plan\n2. Collaborative Project Overview\n3. ${sample.slice(0, 30)}... Strategy`;
    case "grammar":
      return content.trim();
    case "translate":
      return `[Translated to ${language || "Spanish"}]: ${content}`;
    case "rewrite":
      return `Professional Revision:\n${content}`;
    default:
      return content;
  }
}
