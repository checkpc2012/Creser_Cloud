import { NextRequest, NextResponse } from "next/server";
import { getClientHistory } from "@/app/actions/audit-actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const history = await getClientHistory(id);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error in client history route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
