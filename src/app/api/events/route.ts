import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let apiUrl = "https://api.vizrat.com/v1/events";

  if (from && to) {
    // const fromISO = new Date(from).toISOString();
    // const toISO = new Date(to).toISOString();
    apiUrl = `https://api.vizrat.com/v1/events?from=${from}&to=${to}`;
  } else {
    apiUrl = `https://api.vizrat.com/v1/events?from=2025-06-28T15:22:28.766Z&to=2025-06-28T15:29:54.249Z`;
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from external API: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from external API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(JSON.stringify({ error: "Failed to fetch data", details: errorMessage }), { status: 500 });
  }
}
