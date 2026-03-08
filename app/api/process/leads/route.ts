import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const filePath = join(process.cwd(), "docs", "processus-leads.md");
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading markdown file:", error);
    return NextResponse.json(
      { error: "Failed to read markdown file" },
      { status: 500 }
    );
  }
}
