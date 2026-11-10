import { getCurrentFranchise } from "@/server/franchises/current";
import { statementResponse } from "@/server/franchises/statement";

export async function GET(request: Request) {
  const franchise = await getCurrentFranchise();
  if (!franchise) return new Response("Please sign in again.", { status: 401 });
  return statementResponse(franchise, new URL(request.url).searchParams.get("month"));
}
