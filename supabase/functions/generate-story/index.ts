import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATTERN_INFO: Record<string, string> = {
  emotional_invalidation: "Emotional Invalidation",
  benevolent_sexism: "Benevolent Sexism",
  gender_role_expectation: "Gender Role Expectation",
  objectification: "Objectification",
  harassment: "Harassment",
  public_intimidation: "Public Intimidation",
  safety_threat: "Safety Threat",
};

const systemPrompt = `You are a compassionate writer who creates brief anonymous narratives from reflection data about experiences with gender-based discrimination and subtle boundary violations.

Your task: Write a brief anonymous narrative (3-5 sentences) in third person that captures the emotional essence of the experience. Also create a short evocative title.

Rules:
- Write in warm, empathetic third person ("They noticed...", "She felt...")
- Never invent specific identifying details like names, places, workplaces, or physical descriptions
- Capture the emotional truth of what happened and how it felt
- Reference the patterns present naturally, without naming them technically
- End with something affirming — what the person recognized by reflecting on the experience
- Keep it intimate and real, like a journal entry, not clinical
- The title should be 3-5 words, evocative and gentle

You must respond using the generate_story tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { patternKeys, context, feeling, selfDoubtDetected, validationMessage } = body;

    if (!patternKeys || !Array.isArray(patternKeys) || patternKeys.length === 0) {
      return new Response(JSON.stringify({ error: "patternKeys is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patternNames = patternKeys.map((k: string) => PATTERN_INFO[k] || k).join(", ");
    let userMessage = `Patterns detected: ${patternNames}`;
    if (context) userMessage += `\nContext: ${context}`;
    if (feeling) userMessage += `\nFeelings: ${feeling}`;
    if (selfDoubtDetected) userMessage += `\nThe person experienced self-doubt about their reaction.`;
    if (validationMessage) userMessage += `\nValidation: ${validationMessage}`;

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
        tools: [{
          type: "function",
          function: {
            name: "generate_story",
            description: "Return the anonymous story narrative",
            parameters: {
              type: "object",
              properties: {
                story: { type: "string" },
                title: { type: "string" },
                primaryPattern: { type: "string", enum: Object.keys(PATTERN_INFO) },
              },
              required: ["story", "title", "primaryPattern"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_story" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(JSON.stringify({ error: "Story generation failed" }), {
        status: status === 429 ? 429 : status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-story error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
