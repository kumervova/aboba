const TARGET_HOST = 'https://priblivonis.icu'

Deno.serve(async (req: Request, connInfo: Deno.ServeHandlerInfo): Promise<Response> => {
	try {
		const url = new URL(req.url)
		const targetUrl = new URL(url.pathname + url.search, TARGET_HOST)

		const clientIp =
			req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			(connInfo.remoteAddr as Deno.NetAddr).hostname

		const headers = new Headers(req.headers)

		if (clientIp) {
			const prevXff = headers.get('x-forwarded-for')
			headers.set(
				'x-forwarded-for',
				prevXff ? `${prevXff}, ${clientIp}` : clientIp
			)
			headers.set('ip', clientIp)
		}

		const proxyReq = new Request(targetUrl.toString(), {
			method: req.method,
			headers,
			body:
				req.method !== 'GET' && req.method !== 'HEAD'
					? req.body
					: undefined,
			redirect: 'manual',
		})

		const response = await fetch(proxyReq)

		const respHeaders = new Headers(response.headers)
		respHeaders.set('x-proxy', 'deno')

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: respHeaders,
		})
	} catch (err) {
		return new Response('Proxy error: ' + err.message, { status: 502 })
	}
})
