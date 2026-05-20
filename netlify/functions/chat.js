exports.handler = async (event) => {
  const UPSTASH_REST_URL = process.env.UPSTASH_REST_URL;
  const UPSTASH_REST_TOKEN = process.env.UPSTASH_REST_TOKEN;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const upstash = async (path, body) => {
    const res = await fetch(`${UPSTASH_REST_URL}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
  };

  if (event.httpMethod === "GET") {
    const data = await upstash("/lrange/zumami_chat/0/99");
    const messages = (data.result || [])
      .map(s => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean)
      .reverse();
    return { statusCode: 200, headers, body: JSON.stringify(messages) };
  }

  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");
    const msg = {
      sender: (body.sender || "Anonim").slice(0, 20),
      text: (body.text || "").slice(0, 300),
      ts: Date.now()
    };
    await upstash("/lpush/zumami_chat", [JSON.stringify(msg)]);
    await upstash("/ltrim/zumami_chat/0/99");
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers, body: "Method not allowed" };
};
