import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATTERN_DEFINITIONS = [
  { key: "emotional_invalidation", title: "Emotional Invalidation" },
  { key: "benevolent_sexism", title: "Benevolent Sexism" },
  { key: "gender_role_expectation", title: "Gender Role Expectation" },
  { key: "objectification", title: "Objectification" },
  { key: "harassment", title: "Harassment" },
  { key: "public_intimidation", title: "Public Intimidation" },
  { key: "safety_threat", title: "Safety Threat" },
];

const systemPrompt = `You are an expert in recognizing patterns of gender-based discrimination, sexism, and interpersonal boundary violations. You analyze personal experiences shared by users with empathy and nuance.

Your task: Given a user's description of an experience (with optional context), identify which of these specific patterns may be present:
- emotional_invalidation: Dismissing, minimizing, or ignoring someone's feelings
- benevolent_sexism: Attitudes that seem positive but reinforce traditional gender roles
- gender_role_expectation: Pressure to behave in gender-"appropriate" ways
- objectification: Being reduced to physical appearance
- harassment: Repeated or severe unwanted behavior
- public_intimidation: Behavior in public spaces designed to assert dominance
- safety_threat: Situations where someone felt physically or emotionally unsafe

Rules:
- Return a MAXIMUM of 4 patterns, ordered by relevance
- For each pattern, provide a confidence level: "high", "medium", or "low"
- For each pattern, write a 1-2 sentence personalizedExplanation explaining why THIS specific experience relates to the pattern. Reference details from their description.
- Detect whether self-doubt language is present (phrases like "maybe I'm overreacting", "it's probably nothing", "am I crazy")
- Provide a short, warm validationMessage (1-2 sentences) that validates their experience without making legal/clinical claims
- Use language like "may relate to", "possible pattern", "you are not alone"
- NEVER say "this definitely was/wasn't sexism"
- NEVER provide legal or clinical advice
- If the description doesn't clearly relate to any pattern, return an empty patterns array with a gentle validationMessage

You must respond using the analyze_experience tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, contextWhere, contextFeeling, selfDoubt } = await req.json();

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Description is required" }), {
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

    let userMessage = `Here is the experience:\n\n"${description.trim()}"`;
    if (contextWhere) userMessage += `\n\nContext — where it happened: ${contextWhere}`;
    if (contextFeeling) userMessage += `\nHow it felt: ${contextFeeling}`;
    if (selfDoubt) userMessage += `\nDid they doubt themselves: ${selfDoubt}`;

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
              name: "analyze_experience",
              description: "Return the analysis of the user's experience",
              parameters: {
                type: "object",
                properties: {
                  patterns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: {
                          type: "string",
                          enum: PATTERN_DEFINITIONS.map((p) => p.key),
                        },
                        confidence: {
                          type: "string",
                          enum: ["high", "medium", "low"],
                        },
                        personalizedExplanation: { type: "string" },
                      },
                      required: ["key", "confidence", "personalizedExplanation"],
                      additionalProperties: false,
                    },
                  },
                  selfDoubtDetected: { type: "boolean" },
                  validationMessage: { type: "string" },
                },
                required: ["patterns", "selfDoubtDetected", "validationMessage"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_experience" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
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

    // Validate and cap patterns at 4
    if (result.patterns && result.patterns.length > 4) {
      result.patterns = result.patterns.slice(0, 4);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-experience error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
