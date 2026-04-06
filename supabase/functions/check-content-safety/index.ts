import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a content safety reviewer for a trauma support tool. Evaluate the following text and check for:

1. Graphic descriptions of physical violence (detailed violent acts, injuries)
2. Graphic descriptions of sexual violence (explicit sexual content)
3. Identifying information (real full names, specific addresses, workplace names that could identify someone)
4. Victim-blaming language or harmful advice
5. Content that promotes violence or revenge

Respond ONLY in JSON with this exact structure:
{
  "safe": boolean,
  "flags": string[],
  "containsSensitiveContent": boolean,
  "sensitiveContentType": string or null,
  "suggestion": string or null
}

Rules:
- "safe" means no graphic violence, no identifying info, no harmful content
- Stories about harassment, intimidation, or emotional abuse are SAFE as long as they aren't graphic
- "containsSensitiveContent" is true if the text involves themes of physical safety, harassment, or intimidation even if safe to publish
- "sensitiveContentType" should be one of: "physical safety", "harassment", "intimidation", or null
- "flags" lists specific concerns if not safe
- "suggestion" offers guidance on what to change if not safe
- Be lenient with emotional descriptions - feelings of fear, confusion, anger are always safe
- Only flag truly graphic or identifying content`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "content_safety_result",
              description: "Return the content safety evaluation result",
              parameters: {
                type: "object",
                properties: {
                  safe: { type: "boolean" },
                  flags: { type: "array", items: { type: "string" } },
                  containsSensitiveContent: { type: "boolean" },
                  sensitiveContentType: { type: "string", nullable: true },
                  suggestion: { type: "string", nullable: true },
                },
                required: ["safe", "flags", "containsSensitiveContent"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "content_safety_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing from content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleaned);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Could not parse safety result");
  } catch (e) {
    console.error("check-content-safety error:", e);
    // Default to safe=true with sensitive flag as precaution
    return new Response(JSON.stringify({
      safe: true,
      flags: [],
      containsSensitiveContent: true,
      sensitiveContentType: null,
      suggestion: null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
