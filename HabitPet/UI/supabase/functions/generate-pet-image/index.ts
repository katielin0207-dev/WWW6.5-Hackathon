// Supabase Edge Function: generate-pet-image
// Generates a unique pet image via Replicate (FLUX Schnell) and caches in Storage.
// Called with: POST { dnaId: "12345678", traits: { species, color, eyes, special, element, rarity, personality } }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_BUCKET = "pet-images";

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(traits: {
  species: string; color: string; eyes: string;
  special: string; element: string; rarity: string; personality: string;
}): string {
  const styleGuide = [
    "chibi cute animal character portrait",
    "flat gouache illustration",
    "hand-painted brushstroke texture",
    "warm muted color palette",
    "soft watercolor background",
    "rounded shapes",
    "game avatar art style",
    "no text no watermark",
    "circular composition",
    "cozy storybook illustration",
  ].join(", ");

  const subject = [
    `${traits.color.toLowerCase()} colored ${traits.species.toLowerCase()}`,
    `${traits.eyes.toLowerCase()} eyes`,
    traits.special !== "None" ? `${traits.special.toLowerCase()} feature` : null,
    `${traits.element.toLowerCase()} element aura`,
    traits.rarity === "Legendary" || traits.rarity === "Epic"
      ? `glowing ${traits.rarity.toLowerCase()} aura around it`
      : null,
    `${traits.personality.toLowerCase()} expression`,
  ].filter(Boolean).join(", ");

  return `${styleGuide}, ${subject}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // version marker — remove after confirmed working
  if (new URL(req.url).searchParams.get("ping")) {
    return Response.json({ ok: true, version: "v3" });
  }

  try {
    const { dnaId, traits } = await req.json();
    if (!dnaId || !/^\d{8}$/.test(dnaId)) {
      return Response.json({ error: "Invalid dnaId" }, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const filename = `pet-${dnaId}.webp`;

    // ── 1. Check cache ────────────────────────────────────────────────────────
    const { data: existing } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
    // Try to fetch the cached URL to confirm it actually exists
    const checkResp = await fetch(existing.publicUrl, { method: "HEAD" }).catch(() => null);
    if (checkResp?.ok) {
      return Response.json({ url: existing.publicUrl, cached: true });
    }

    // ── 2. Generate via Replicate (FLUX Schnell) ──────────────────────────────
    // Supports both SILICONFLOW_API_KEY (new) and REPLICATE_API_TOKEN (legacy)
    const replicateToken = Deno.env.get("SILICONFLOW_API_KEY") || Deno.env.get("REPLICATE_API_TOKEN");
    if (!replicateToken) {
      return Response.json({ error: "SILICONFLOW_API_KEY not set" }, { status: 500 });
    }

    const prompt = buildPrompt(traits);

    // Call SiliconFlow (国内，支持微信/支付宝充值)
    // Model: black-forest-labs/FLUX.1-schnell — same quality as Replicate
    const startResp = await fetch(
      "https://api.siliconflow.cn/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Kwai-Kolors/Kolors",
          prompt,
          image_size: "1024x1024",
          num_inference_steps: 20,
          num_images: 1,
          guidance_scale: 5.0,
        }),
      },
    );

    const predictionText = await startResp.text();
    let prediction: Record<string, unknown>;
    try { prediction = JSON.parse(predictionText); } catch { prediction = { raw: predictionText }; }

    if (!startResp.ok) {
      return Response.json({
        error: "siliconflow_error",
        status: startResp.status,
        detail: prediction,
      }, { status: 500 });
    }

    // SiliconFlow returns: { images: [{ url: "..." }] }
    const images = prediction.images as { url: string }[] | undefined;
    const imageUrl = images?.[0]?.url;
    if (!imageUrl) return Response.json({ error: "No image returned", detail: prediction }, { status: 500 });

    // ── 3. Download and store in Supabase Storage ─────────────────────────────
    const imgResp = await fetch(imageUrl);
    const imgBuffer = await imgResp.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, imgBuffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "31536000", // 1 year CDN cache
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Return the temporary Replicate URL as fallback
      return Response.json({ url: imageUrl, cached: false });
    }

    const { data: stored } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
    return Response.json({ url: stored.publicUrl, cached: false, prompt });

  } catch (err) {
    console.error(err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
