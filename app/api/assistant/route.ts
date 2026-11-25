import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { handleAssistantRequest } from "@/lib/assistant/assistantHandler";
import { defaultRequestLimiterDeps, enforcePublicRequestLimit } from "@/lib/security/publicRequestLimit";

// Public, same-origin Milano Execution Copilot. All size, origin and
// configuration guards run in handleAssistantRequest before the paid provider
// call; the provider client is created only for a request that passed them.
export async function POST(req: NextRequest) {
  return handleAssistantRequest(req, {
    env: process.env,
    limit: async (request) =>
      enforcePublicRequestLimit(request, { client: "assistant", global: "assistant_global" }, await defaultRequestLimiterDeps()),
    // One counted request = at most one paid call: the SDK's automatic retries are off.
    createMessage: (request) => new Anthropic({ maxRetries: 0 }).messages.create(request),
  });
}
