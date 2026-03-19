import { NextRequest, NextResponse } from "next/server";
import { getCardMovements } from "@/app/actions/movement-actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const legacyId = searchParams.get("legacyId") || undefined;

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const movements = await getCardMovements(id, legacyId);
    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error in card movements route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
