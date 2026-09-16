# Xeno fixture card worker

This optional Cloudflare Worker receives one generated fixture card from `manager.html` and posts it to one Discord webhook. The browser never receives the Discord webhook URL.

## Deploy

From `xenochampionship.github.io/fixture-card-worker`:

```text
npx wrangler login
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler secret put POST_AUTH_TOKEN
npx wrangler deploy
```

Use a long random value for `POST_AUTH_TOKEN`. Keep both secret values out of Git and out of `manager.html`.

## Connect the manager

After deployment, copy the Worker URL into `manager.html` at `WEBEDITOR_CONFIG.fixtureCards.postEndpoint`. Put the same `POST_AUTH_TOKEN` value in `WEBEDITOR_CONFIG.fixtureCards.authToken`, or leave it blank and add the token through a safer deployment-specific configuration mechanism before publishing the manager. The current placeholder is intentionally empty:

```js
fixtureCards: {
    postEndpoint: "",
    authToken: ""
}
```

The worker only accepts one `fixture` and one PNG data URL per request. The manager disables posting until an image has been generated for the selected fixture, so posting remains an explicit one-at-a-time action.

## Discord setup

1. Create or choose the Discord channel.
2. Open the channel's Integrations settings and create a webhook.
3. Store the webhook URL with `npx wrangler secret put DISCORD_WEBHOOK_URL`.
4. Restrict the Worker route or Worker URL as appropriate for the site.
5. Test with a selected fixture in the manager: `Generate Image`, then `Post to Discord`.

The public site does not call this Worker. Fixture images are generated locally in the manager and are not added to `fixtures.json` or committed to GitHub.
