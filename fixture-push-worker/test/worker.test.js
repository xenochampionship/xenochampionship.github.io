import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

const env = {
	ALLOWED_ORIGINS: "https://xenochampionship.co.uk",
	NOTIFY_BEARER_TOKEN: "test-token",
	SUBSCRIPTIONS: {
		async put() {},
		async delete() {},
		async list() { return { keys: [], list_complete: true }; },
		async get() { return null; }
	}
};

test("health route returns the worker identity", async () => {
	const response = await worker.fetch(new Request("https://worker.test/health"), env);
	assert.equal(response.status, 200);
	assert.equal((await response.json()).service, "xeno-fixture-push-worker");
});

test("preflight permits the configured site origin", async () => {
	const response = await worker.fetch(new Request("https://worker.test/notify-fixture", {
		method: "OPTIONS",
		headers: { Origin: "https://xenochampionship.co.uk" }
	}), env);
	assert.equal(response.status, 204);
	assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://xenochampionship.co.uk");
});

test("fixture notification requires the worker bearer token", async () => {
	const response = await worker.fetch(new Request("https://worker.test/notify-fixture", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ fixture: {} })
	}), env);
	assert.equal(response.status, 401);
});

test("fixture notification rejects an incomplete result", async () => {
	const response = await worker.fetch(new Request("https://worker.test/notify-fixture", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer test-token"
		},
		body: JSON.stringify({ fixture: { status: "completed", player1: "A", player2: "B", winner: "C" } })
	}), env);
	assert.equal(response.status, 400);
});

test("subscription endpoints must target a supported HTTPS push service", async () => {
	const response = await worker.fetch(new Request("https://worker.test/subscribe", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			subscription: {
				endpoint: "https://example.com/push/test",
				keys: { p256dh: "key", auth: "key" }
			}
		})
	}), env);
	assert.equal(response.status, 400);
});

test("valid push subscriptions can be stored and removed", async () => {
	const stored = new Map();
	const subscriptionEnv = {
		...env,
		SUBSCRIPTIONS: {
			async put(key, value) { stored.set(key, value); },
			async delete(key) { stored.delete(key); }
		}
	};
	const subscription = {
		endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
		keys: { p256dh: "public-key", auth: "auth-key" }
	};
	const subscribeResponse = await worker.fetch(new Request("https://worker.test/subscribe", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ siteId: "xeno-championship", subscription })
	}), subscriptionEnv);
	assert.equal(subscribeResponse.status, 200);
	assert.equal(stored.size, 1);

	const unsubscribeResponse = await worker.fetch(new Request("https://worker.test/unsubscribe", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ endpoint: subscription.endpoint })
	}), subscriptionEnv);
	assert.equal(unsubscribeResponse.status, 200);
	assert.equal(stored.size, 0);
});