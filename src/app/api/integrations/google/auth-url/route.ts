import { NextResponse } from "next/server";
import { generateAuthUrl } from "@/lib/email/gmail";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET() {
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = generateAuthUrl();
        return NextResponse.json({ url });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to generate auth URL" },
            { status: 500 }
        );
    }
}
