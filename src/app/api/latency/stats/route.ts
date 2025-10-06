import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = searchParams.get("page");
  const perPage = searchParams.get("perPage");
  const threshold = searchParams.get("threshold");
  const senders = searchParams.get("senders");
  const receivers = searchParams.get("receivers");

  let apiUrl = "https://api.vizrat.com/v1/metrics/network/latency/stats";
  const queryParams = new URLSearchParams();

  if (from) queryParams.append("from", from);
  if (to) queryParams.append("to", to);
  if (page) queryParams.append("page", page);
  if (perPage) queryParams.append("perPage", perPage);
  if (threshold) queryParams.append("threshold", threshold);
  if (senders) queryParams.append("senders", senders);
  if (receivers) queryParams.append("receivers", receivers);

  if (queryParams.toString()) {
    apiUrl += `?${queryParams.toString()}`;
  } else {
    apiUrl =
      "https://api.vizrat.com/v1/metrics/network/latency/stats?from=2025-06-28T15%3A22%3A28.766Z&to=2025-06-28T15%3A29%3A54.249Z";
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
