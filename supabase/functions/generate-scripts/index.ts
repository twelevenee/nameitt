import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATTERN_INFO: Record<string, string> = {
  emotional_invalidation: "Emotional Invalidation — dismissing or minimizing someone's feelings",
  benevolent_sexism: "Benevolent Sexism — attitudes that seem positive but reinforce traditional gender roles",
  gender_role_expectation: "Gender Role Expectation — pressure to behave in gender-'appropriate' ways",
  objectification: "Objectification — being reduced to physical appearance",
  harassment: "Harassment — repeated or severe unwanted behavior",
  public_intimidation: "Public Intimidation — behavior in public spaces designed to assert dominance",
  safety_threat: "Safety Threat — situations where someone felt physically or emotionally unsafe",
};

const systemPrompt = `You are a supportive communication coach specializing in boundary-setting and self-advocacy in situations involving gender-based discrimination.

Your task: Generate 3 different response scripts the user could use in real life, based on the detected patterns and context provided.

Rules:
- Each script must have one of these exact tone labels: "Gentle but firm", "Direct and clear", "De-escalation focused"
- Each script should be 1-3 sentences — short enough to memorize and use naturally
- Each script must be written in first person as something the user could actually say out loud
- Include a brief 1-sentence "why" note under each script explaining why this approach works
- Never suggest anything confrontational, aggressive, or unsafe
- If the patterns include safety_threat or harassment, prioritize safety — scripts should focus on getting to safety and seeking help, not confronting the person
- If safety patterns are present, include a safetyNote field

You must respond using the generate_scripts tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { patternKeys, context, feeling } = body;

    if (!patternKeys || !Array.isArray(patternKeys) || patternKeys.length === 0) {
      return new Response(JSON.stringify({ error: "patternKeys is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patternDescriptions = patternKeys
      .map((k: string) => PATTERN_INFO[k] || k)
      .join("\n- ");

    let userMessage = `The user experienced these patterns:\n- ${patternDescriptions}`;
    if (context) userMessage += `\n\nContext — where it happened: ${context}`;
    if (feeling) userMessage += `\nHow it felt: ${feeling}`;

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
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_scripts",
              description: "Return conversation rehearsal scripts",
              parameters: {
                type: "object",
                properties: {
                  scripts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tone: { type: "string", enum: ["Gentle but firm", "Direct and clear", "De-escalation focused"] },
                        text: { type: "string" },
                        why: { type: "string" },
                      },
                      required: ["tone", "text", "why"],
                      additionalProperties: false,
                    },
                  },
                  safetyNote: { type: "string" },
                },
                required: ["scripts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_scripts" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(JSON.stringify({ error: "AI script generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    if (result.scripts) result.scripts = result.scripts.slice(0, 3);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-scripts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
