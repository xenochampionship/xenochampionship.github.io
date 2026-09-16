const corsHeaders = {
    "Access-Control-Allow-Origin": "https://xenochampionship.co.uk",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

function authorized(request, env) {
    const expected = String(env.POST_AUTH_TOKEN || "").trim();
    if (!expected) {
        return false;
    }
    return request.headers.get("Authorization") === "Bearer " + expected;
}

function decodeDataUrl(dataUrl) {
    const match = String(dataUrl || "").match(/^data:(image\/png);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
        throw new Error("imageDataUrl must be a base64 PNG data URL.");
    }
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new File([bytes], "fixture-card.png", { type: match[1] });
}

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }
        if (request.method !== "POST") {
            return jsonResponse({ error: "Use POST." }, 405);
        }
        if (!authorized(request, env)) {
            return jsonResponse({ error: "Unauthorized." }, 401);
        }

        try {
            const body = await request.json();
            const fixture = body && body.fixture;
            const imageFile = decodeDataUrl(body && body.imageDataUrl);
            if (!fixture || typeof fixture !== "object") {
                return jsonResponse({ error: "A fixture object is required." }, 400);
            }
            if (imageFile.size > 8 * 1024 * 1024) {
                return jsonResponse({ error: "The fixture image is too large." }, 413);
            }

            const form = new FormData();
            form.append("payload_json", JSON.stringify({
                content: `${fixture.fixtureId || "Fixture"}: ${fixture.player1 || "TBC"} vs ${fixture.player2 || "TBC"}`
            }));
            form.append("files[0]", imageFile, "fixture-card.png");

            const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
                method: "POST",
                body: form
            });
            if (!discordResponse.ok) {
                return jsonResponse({ error: "Discord rejected the message." }, 502);
            }
            return jsonResponse({ posted: true });
        } catch (error) {
            return jsonResponse({ error: error.message || "Invalid request." }, 400);
        }
    }
};
