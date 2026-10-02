# Xeno fixture push Worker

This Worker stores browser push subscriptions in Cloudflare KV and sends a fixture result only when `manager.html` explicitly requests it. The manager verifies that the completed result has already been committed to GitHub before sending.

## Configure and deploy

1. From this directory, run `npm install`.
2. Create a KV namespace with `npx wrangler kv namespace create XENO_FIXTURE_PUSH_SUBSCRIPTIONS` and replace `REPLACE_WITH_KV_NAMESPACE_ID` in `wrangler.jsonc` with the returned ID.
3. Generate VAPID keys with `npx web-push generate-vapid-keys`. Keep the private key secret.
4. Set the Worker secrets using `npx wrangler secret put VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `NOTIFY_BEARER_TOKEN`. Use a `mailto:` subject and a long random bearer token.
5. Deploy with `npm run deploy`.
6. Confirm the deployed URL matches the `fixturePush.workerBaseUrl` in `manager.html` and `fixturePushConfig.workerBaseUrl` in `source/main.js`. If Cloudflare assigns another workers.dev host, update both settings.

The public site only needs the VAPID public key. The notification bearer token is never stored in the repository; the manager prompts an authenticated editor to enter it when sending a result.

## Verify

Run `npm test` for route, authorization, and subscription validation checks. After deployment, open `/health` on the Worker and subscribe from the live site using the result-notification control.