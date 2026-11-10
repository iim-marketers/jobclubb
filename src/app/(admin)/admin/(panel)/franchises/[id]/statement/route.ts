import { isAdmin } from "@/server/admin/session";
import { getFranchise, isApproved } from "@/server/franchises/franchises";
import { statementResponse } from "@/server/franchises/statement";

export async function GET(request: Request, ctx: RouteContext<"/admin/franchises/[id]/statement">) {
  if (!(await isAdmin())) return new Response("Please sign in again.", { status: 401 });
  const { id } = await ctx.params;
  const franchise = await getFranchise(id);
  if (!franchise || !isApproved(franchise)) return new Response("Franchise not found.", { status: 404 });
  return statementResponse(franchise, new URL(request.url).searchParams.get("month"));
}
