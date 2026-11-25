import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { handleAssistantRequest } from "@/lib/assistant/assistantHandler";

// Public, same-origin Milano Execution Copilot. All size, origin and
// configuration guards run in handleAssistantRequest before the paid provider
// call; the provider client is created only for a request that passed them.
export async function POST(req: NextRequest) {
  return handleAssistantRequest(req, {
    env: process.env,
    createMessage: (request) => new Anthropic().messages.create(request),
  });
}
