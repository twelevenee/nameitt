import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SEED_STORIES } from "@/lib/seed-stories";
import { useToast } from "@/hooks/use-toast";

const AdminSeed = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    try {
      // Check if seed stories already exist
      const { data: existing } = await supabase
        .from("stories")
        .select("id")
        .eq("story_type", "seed")
        .limit(1);

      if (existing && existing.length > 0) {
        toast({ title: "Seed stories already exist in the database." });
        setDone(true);
        return;
      }

      // We need a dummy experience_id for seed stories
      const { data: expData, error: expErr } = await supabase
        .from("experiences")
        .insert({
          description: "[seed story placeholder]",
          contributed: true,
        })
        .select("id")
        .single();

      if (expErr) throw expErr;

      const rows = SEED_STORIES.map((s) => ({
        experience_id: expData.id,
        title: s.title,
        story: s.story,
        primary_pattern: s.primary_pattern,
        secondary_pattern: s.secondary_pattern,
        context: s.context,
        feeling: s.feeling,
        contains_sensitive_content: s.contains_sensitive_content,
        sensitive_content_type: s.sensitive_content_type,
        story_type: s.story_type,
        source_note: s.source_note,
      }));

      // Insert in batches of 10
      for (let i = 0; i < rows.length; i += 10) {
        const batch = rows.slice(i, i + 10);
        const { error } = await supabase.from("stories").insert(batch as any);
        if (error) throw error;
      }

      toast({ title: `Seeded ${rows.length} composite narratives.` });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to seed stories.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Seed Database</h1>
        <p className="text-sm text-muted-foreground">
          Insert 50 composite narratives based on research patterns. This only needs to be done once.
        </p>
        {done ? (
          <p className="text-sm text-primary">Done! Stories have been seeded.</p>
        ) : (
          <Button onClick={handleSeed} disabled={loading} className="rounded-full">
            {loading ? "Seeding…" : "Seed composite narratives"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminSeed;
