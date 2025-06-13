import { LlamaCloudIndex } from "llamaindex";

// --- LlamaCloudIndex Setup ---
const llamaApiKey = process.env.LLAMA_CLOUD_API_KEY;
if (!llamaApiKey) {
  throw new Error("LLAMA_CLOUD_API_KEY is not set in the environment");
}

// Optional: Use a singleton retriever for best performance
let retrieverInstance: ReturnType<LlamaCloudIndex["asRetriever"]> | null = null;

export function getRetriever() {
  if (!retrieverInstance) {
    const index = new LlamaCloudIndex({
      name: "Alvin",
      projectName: "Default",
      organizationId: "c2031b56-4c79-42a9-82a1-36186df133cb",
      apiKey: llamaApiKey,
    });
    retrieverInstance = index.asRetriever({
      similarityTopK: 5,
    });
  }
  return retrieverInstance;
}
