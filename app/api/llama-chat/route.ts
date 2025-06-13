import { NextRequest, NextResponse } from "next/server";
import { getRetriever } from "@/lib/llamaindex";
import type { BaseRetriever, NodeWithScore, BaseNode } from "llamaindex";

type NodeWithText = {
  getText?: () => string | Promise<string>;
  text?: string;
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 10000; // 10 seconds

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await withTimeout(operation(), REQUEST_TIMEOUT);
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  throw lastError;
}

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  let retriever: BaseRetriever;
  try {
    retriever = await getRetriever();
    if (!retriever) {
      throw new Error("Failed to initialize Llama retriever");
    }
  } catch (err) {
    console.error("Failed to initialize retriever:", err);
    return NextResponse.json(
      {
        error: "Failed to initialize Llama service. Please try again later.",
        details: "Service initialization error",
      },
      { status: 503 }
    );
  }

  try {
    const formattedPrompt = `Based on the following question, provide a very short and concise answer using only Proweaver's official policies and guidelines as context: ${prompt}`;
    
    const docs = await retryOperation(async () => {
      try {
        return await retriever.retrieve(formattedPrompt);
      } catch (error) {
        if (error instanceof Error && error.message.includes("UND_ERR_SOCKET")) {
          throw new Error("Connection error");
        }
        throw error;
      }
    });
    
    if (!docs || docs.length === 0) {
      return NextResponse.json({ 
        response: "No relevant policy found in Proweaver's documents."
      });
    }

    // Process only the first 3 most relevant documents to reduce processing time
    const relevantDocs = docs.slice(0, 3);
    const snippets = await Promise.all(
      relevantDocs.map(async (doc: NodeWithScore<any>) => {
        try {
          const node = doc.node as unknown as NodeWithText;
          if (typeof node.getText === "function") {
            const val = node.getText();
            return typeof val === "string" ? val : await val;
          }
          return node.text || "";
        } catch (error) {
          console.error("Error processing document:", error);
          return "";
        }
      })
    );

    const responseText = snippets.filter(Boolean).join("\n\n") || 
      "No relevant policy found in Proweaver's documents.";
      
    return NextResponse.json({ response: responseText });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    
    if (err instanceof Error) {
      if (err.message === 'Request timeout') {
        return NextResponse.json(
          {
            error: "Request timed out. Please try again.",
            details: "The request took too long to complete.",
          },
          { status: 504 }
        );
      }
      
      if (err.message.includes("UND_ERR_SOCKET") || err.message === "Connection error") {
        return NextResponse.json(
          {
            error: "Connection to Llama service was interrupted. Please try again.",
            details: "The connection was closed unexpectedly. This might be due to network issues.",
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: "Failed to get response from Llama service. Please try again later.",
        details: errorMessage,
      },
      { status: 503 }
    );
  }
}
