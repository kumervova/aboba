const TARGET_HOST = 'https://priblivonis.icu'

Deno.serve(
	async (req: Request, connInfo: Deno.ServeHandlerInfo): Promise<Response> => {
		const url = new URL(req.url)
		const targetUrl = new URL(url.pathname + url.search, TARGET_HOST)

		const { hostname: clientIp } = connInfo.remoteAddr as Deno.NetAddr

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
			headers: req.headers,
			body:
				req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
		})

		try {
			const response = await fetch(proxyReq)

			const headers = new Headers(response.headers)
			headers.set('x-proxy', 'deno-deploy')

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			})
		} catch (err) {
			return new Response('Proxy error: ' + err.message, { status: 502 })
		}
	}
)
