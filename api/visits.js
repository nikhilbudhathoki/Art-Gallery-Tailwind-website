module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { COUNTERAPI_API_KEY, COUNTERAPI_WORKSPACE } = process.env;

  if (!COUNTERAPI_API_KEY || !COUNTERAPI_WORKSPACE) {
    return response.status(500).json({ error: "Counter is not configured" });
  }

  try {
    const workspace = encodeURIComponent(COUNTERAPI_WORKSPACE);
    const counterResponse = await fetch(
      `https://api.counterapi.dev/v2/${workspace}/gallery-visits/up`,
      { headers: { Authorization: `Bearer ${COUNTERAPI_API_KEY}` } },
    );

    if (!counterResponse.ok) {
      const details = await counterResponse.text();
      console.error("CounterAPI rejected the request:", counterResponse.status, details);
      return response.status(502).json({
        error: "CounterAPI rejected the request",
        counterApiStatus: counterResponse.status,
      });
    }

    const data = await counterResponse.json();
    const count = data.value ?? data.data?.value ?? data.data ?? data.count;

    if (!Number.isFinite(Number(count))) {
      throw new Error("CounterAPI returned an invalid count");
    }

    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({ count: Number(count) });
  } catch (error) {
    console.error("CounterAPI error:", error);
    return response.status(502).json({ error: "Could not update visit count" });
  }
};
