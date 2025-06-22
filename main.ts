const TARGET_HOST = "https://voloner.com.ua";

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const targetUrl = new URL(url.pathname + url.search, TARGET_HOST);

  const proxyReq = new Request(targetUrl.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });

  try {
    const response = await fetch(proxyReq);

    const headers = new Headers(response.headers);
    headers.set("x-proxy", "deno-deploy");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    return new Response("Proxy error: " + err.message, { status: 502 });
  }
});

