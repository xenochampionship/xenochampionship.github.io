import webpush from "web-push";

const SITE_ID = "xeno-championship";
const SUBSCRIPTION_PREFIX = "sub:" + SITE_ID + ":";
const VALID_PUSH_HOSTS = [
	"fcm.googleapis.com",
	"web.push.apple.com"
];

function jsonResponse(status, payload, headers = {}) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			...headers
		}
	});
}

function corsHeaders(request, env) {
	const origin = request.headers.get("Origin") || "";
	const allowedOrigins = String(env.ALLOWED_ORIGINS || "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
	const allowedOrigin = allowedOrigins.includes(origin) ? origin : "null";

	return {
		"Access-Control-Allow-Origin": allowedOrigin,
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Max-Age": "86400",
		"Vary": "Origin"
	};
}

function requestError(message, status = 400) {
	const error = new Error(message);
	error.status = status;
	return error;
}

function verifyNotifyAuth(request, env) {
	const expected = String(env.NOTIFY_BEARER_TOKEN || "").trim();
	const header = request.headers.get("Authorization") || "";
	const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
	return Boolean(expected && supplied && supplied === expected);
}

function buildVapid(env, pushClient = webpush) {
	const subject = String(env.VAPID_SUBJECT || "").trim();
	const publicKey = String(env.VAPID_PUBLIC_KEY || "").trim();
	const privateKey = String(env.VAPID_PRIVATE_KEY || "").trim();
	if (!subject || !publicKey || !privateKey) {
		throw requestError("Push delivery is not configured on the Worker.", 503);
	}
	pushClient.setVapidDetails(subject, publicKey, privateKey);
	return publicKey;
}

async function readJson(request) {
	try {
		return await request.json();
	} catch (_error) {
		throw requestError("Request body must be valid JSON.");
	}
}

function validateSubscription(subscription) {
	if (!subscription || typeof subscription !== "object") {
		throw requestError("subscription must be an object.");
	}
	if (typeof subscription.endpoint !== "string" || !subscription.endpoint) {
		throw requestError("subscription.endpoint is required.");
	}
	let endpoint;
	try {
		endpoint = new URL(subscription.endpoint);
	} catch (_error) {
		throw requestError("subscription.endpoint must be a valid URL.");
	}
	const allowedHost = VALID_PUSH_HOSTS.includes(endpoint.hostname)
		|| endpoint.hostname.endsWith(".push.services.mozilla.com")
		|| endpoint.hostname.endsWith(".notify.windows.com");
	if (endpoint.protocol !== "https:" || !allowedHost) {
		throw requestError("subscription.endpoint is not a supported push service.");
	}
	if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
		throw requestError("subscription.keys.p256dh and subscription.keys.auth are required.");
	}
}

async function subscriptionKey(endpoint) {
	const bytes = new TextEncoder().encode(endpoint);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
	return SUBSCRIPTION_PREFIX + hash;
}

async function handleSubscribe(request, env) {
	const body = await readJson(request);
	validateSubscription(body.subscription);
	const key = await subscriptionKey(body.subscription.endpoint);
	await env.SUBSCRIPTIONS.put(key, JSON.stringify({
		subscription: body.subscription,
		createdAt: new Date().toISOString()
	}));
	return { ok: true };
}

async function handleUnsubscribe(request, env) {
	const body = await readJson(request);
	const endpoint = String(body.endpoint || body.subscription?.endpoint || "").trim();
	if (!endpoint) {
		throw requestError("endpoint is required for unsubscribe.");
	}
	const key = await subscriptionKey(endpoint);
	await env.SUBSCRIPTIONS.delete(key);
	return { ok: true };
}

function buildFixturePayload(body, env) {
	const fixture = body.fixture && typeof body.fixture === "object" ? body.fixture : {};
	const player1 = String(fixture.player1 || "").trim();
	const player2 = String(fixture.player2 || "").trim();
	const winner = String(fixture.winner || "").trim();
	if (fixture.status !== "completed" || !player1 || !player2 || ![player1, player2].includes(winner)) {
		throw requestError("A completed fixture with a listed participant as winner is required.");
	}

	const loser = winner === player1 ? player2 : player1;
	const fixtureId = String(fixture.fixtureId || "Fixture").trim();
	const round = fixture.fixtureId === "Qualifier" && fixture.round != null ? " · Round " + String(fixture.round) : "";
	const baseUrl = String(env.SITE_BASE_URL || "https://xenochampionship.co.uk/").replace(/\/+$/, "") + "/";
	const icon = String(env.SITE_ICON_URL || new URL("source/images/app-icon-192.png", baseUrl).toString());

	return {
		title: winner + " wins their fixture",
		body: winner + " defeated " + loser + " in " + fixtureId + round + ".",
		icon,
		badge: icon,
		data: {
			siteId: SITE_ID,
			url: baseUrl + "#current",
			fixtureId,
			winner
		}
	};
}

async function listSubscriptions(env) {
	const records = [];
	let cursor;
	do {
		const page = await env.SUBSCRIPTIONS.list({ prefix: SUBSCRIPTION_PREFIX, cursor, limit: 1000 });
		for (const key of page.keys || []) {
			const record = await env.SUBSCRIPTIONS.get(key.name, "json");
			if (record && record.subscription) {
				records.push({ key: key.name, subscription: record.subscription });
			}
		}
		cursor = page.list_complete ? undefined : page.cursor;
	} while (cursor);
	return records;
}

export async function handleNotifyFixture(request, env, pushClient = webpush) {
	if (!verifyNotifyAuth(request, env)) {
		throw requestError("Unauthorized.", 401);
	}
	const body = await readJson(request);
	const payload = buildFixturePayload(body, env);
	buildVapid(env, pushClient);
	const records = await listSubscriptions(env);
	let sent = 0;
	let failed = 0;
	let removed = 0;
	const failures = [];

	for (const record of records) {
		try {
			await pushClient.sendNotification(record.subscription, JSON.stringify(payload), { TTL: 86400, urgency: "high" });
			sent += 1;
		} catch (error) {
			failed += 1;
			failures.push({
				statusCode: Number(error?.statusCode || 0),
				message: String(error?.message || "Unknown push provider error.").slice(0, 300)
			});
			if (Number(error?.statusCode || 0) === 404 || Number(error?.statusCode || 0) === 410) {
				await env.SUBSCRIPTIONS.delete(record.key);
				removed += 1;
			}
		}
	}

	const ok = sent > 0 || failed === 0;
	const error = !ok
		? "Push delivery failed for all " + failed + " subscription(s)."
		: undefined;
	return { ok, error, total: records.length, sent, failed, removed, failures };
}

export default {
	async fetch(request, env) {
		const headers = corsHeaders(request, env);
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers });
		}

		const url = new URL(request.url);
		try {
			if (request.method === "GET" && url.pathname === "/health") {
				return jsonResponse(200, { ok: true, service: "xeno-fixture-push-worker" }, headers);
			}
			if (request.method === "GET" && url.pathname === "/vapid-public-key") {
				const publicKey = buildVapid(env);
				return jsonResponse(200, { ok: true, publicKey }, headers);
			}
			if (request.method === "POST" && url.pathname === "/subscribe") {
				return jsonResponse(200, await handleSubscribe(request, env), headers);
			}
			if (request.method === "POST" && url.pathname === "/unsubscribe") {
				return jsonResponse(200, await handleUnsubscribe(request, env), headers);
			}
			if (request.method === "POST" && url.pathname === "/notify-fixture") {
				const result = await handleNotifyFixture(request, env);
				return jsonResponse(result.ok ? 200 : 502, result, headers);
			}
			return jsonResponse(404, { ok: false, error: "Not found." }, headers);
		} catch (error) {
			const status = Number(error?.status || 500);
			return jsonResponse(status, { ok: false, error: error instanceof Error ? error.message : "Unknown error." }, headers);
		}
	}
};