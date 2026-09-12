module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { COUNTERAPI_API_KEY, COUNTERAPI_WORKSPACE } = process.env;

  const workspaceName = COUNTERAPI_WORKSPACE?.trim();

  if (!COUNTERAPI_API_KEY || !workspaceName) {
    return response.status(500).json({ error: "Counter is not configured" });
  }

  try {
    const workspace = encodeURIComponent(workspaceName);
    const counterResponse = await fetch(
      `https://api.counterapi.dev/v2/${workspace}/ranjita-visit/up`,
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
    // CounterAPI V2 returns the accumulated increment total as data.up_count.
    const count = data.data?.up_count ?? data.up_count ?? data.value ?? data.data?.value ?? data.data?.count ?? data.count;

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
