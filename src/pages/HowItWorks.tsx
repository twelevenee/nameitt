import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenLine, Lightbulb, Heart, ArrowLeft, ExternalLink } from "lucide-react";
import { PATTERNS } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { FALLBACK_SCRIPTS } from "@/lib/fallback-scripts";
import { SEED_STORIES } from "@/lib/seed-stories";
import { WarmBlobs, FloatingShapes, GentleWave, QuietScene, WarmGlow } from "@/components/Illustrations";
import { getRandomAffirmation } from "@/lib/affirmations";

const RESOURCES = [
  { name: "RAINN", url: "https://rainn.org", desc: "Support for sexual violence" },
  { name: "National Domestic Violence Hotline", url: "https://thehotline.org", desc: "24/7 support" },
  { name: "Crisis Text Line", url: "https://crisistextline.org", desc: "Text HOME to 741741" },
];

const sampleStories = [
  SEED_STORIES.find((s) => s.primary_pattern === "emotional_invalidation")!,
  SEED_STORIES.find((s) => s.primary_pattern === "benevolent_sexism")!,
];

const SectionDivider = () => (
  <div className="py-4">
    <GentleWave className="opacity-30" />
  </div>
);

const HowItWorks = () => {
  useEffect(() => {
    document.title = "How It Works — Name It";
  }, []);

  return (
    <div id="main-content" className="min-h-screen relative overflow-hidden">
      {/* Section 1: What is Name It? */}
      <section
        id="what"
        className="relative py-24 sm:py-32 px-6"
        style={{ background: "var(--gradient-warm)" }}
      >
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <WarmBlobs className="absolute top-[5%] left-[2%] w-[350px] h-[250px] opacity-50" />
          <FloatingShapes className="absolute inset-0 w-full h-full opacity-60" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10 space-y-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Home
          </Link>

          <p className="text-base text-muted-foreground">
            Curious about how it works? Here's everything, step by step.
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight leading-tight">
            Here's what happens when you reflect.
          </h1>

          {/* Flow diagram */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6">
            {[
              { icon: PenLine, label: "Reflect", desc: "Describe what happened in your own words" },
              { icon: Lightbulb, label: "Understand", desc: "See patterns that may relate to your experience" },
              { icon: Heart, label: "You're not alone", desc: "Read how others have navigated similar moments" },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-col items-center gap-2 max-w-[180px]">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden sm:block w-12 h-px bg-border" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Section 2: The Reflection */}
      <section
        id="reflection"
        className="py-24 sm:py-28 px-6"
        style={{ background: "hsl(230 20% 95% / 0.5)" }}
      >
        <div className="max-w-xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            How reflecting works
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            You describe your experience in a safe text box. No one else will ever see what you write — your words are analyzed privately and never stored. You can also tell us where it happened, how it felt, and whether you doubted yourself. All of this is optional.
          </p>

          {/* Stylized mockup */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute -top-4 -right-4 z-0 pointer-events-none opacity-40">
              <WarmGlow size={100} />
            </div>
            <div className="relative z-10 rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)] space-y-4 text-left">
              <div className="rounded-xl bg-background p-4 min-h-[80px] border border-border/50">
                <p className="text-sm text-muted-foreground/50 italic">Tell us what happened…</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["workplace", "confusing", "yes"].map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1.5 rounded-full text-xs bg-secondary text-muted-foreground"
                  >
                    {pill}
                  </span>
                ))}
                <span className="px-3 py-1.5 rounded-full text-xs bg-secondary text-muted-foreground/40">
                  …
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-md mx-auto">
            Your written words are used to understand the patterns, then immediately discarded. We never store what you type.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* Section 3: The Patterns */}
      <section id="patterns" className="py-24 sm:py-28 px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            What are patterns?
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Based on what you share, we identify common patterns of gender-based discrimination. These aren't diagnoses or labels — they're concepts from research that can help you name what happened.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-lg mx-auto">
            {PATTERNS.map((p) => (
              <div
                key={p.key}
                className="rounded-2xl bg-card p-3 sm:p-4 flex flex-col items-center gap-2 shadow-[var(--shadow-card)]"
              >
                <span className="text-primary/70" aria-hidden="true">
                  {PATTERN_ICONS[p.key]}
                </span>
                <p className="text-xs font-medium text-foreground text-center leading-snug">
                  {p.title}
                </p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-md mx-auto">
            Each pattern comes with an explanation, real-world examples, and a personalized note about how it relates to your specific experience.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* Section 4: Stories */}
      <section
        id="stories"
        className="py-24 sm:py-28 px-6"
        style={{ background: "hsl(230 20% 95% / 0.5)" }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            You're not alone
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            After your reflection, you'll see stories from others who experienced similar patterns. Some are based on commonly reported experiences from research. Others are shared anonymously by people who used this tool.
          </p>

          <div className="space-y-3 max-w-lg mx-auto text-left">
            {sampleStories.map((s) => {
              const pat = PATTERNS.find((p) => p.key === s.primary_pattern);
              return (
                <div
                  key={s.title}
                  className="rounded-2xl bg-card p-5 space-y-3 shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.story}</p>
                  <div className="flex items-center gap-2">
                    {pat && (
                      <Badge variant="secondary" className="rounded-full text-[10px] gap-1">
                        <span aria-hidden="true">{PATTERN_ICONS[s.primary_pattern]}</span>
                        {pat.title}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/50">{s.source_note}</p>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground/70">
            You can also{" "}
            <Link to="/stories" className="underline hover:text-foreground transition-colors">
              browse all stories
            </Link>{" "}
            anytime and filter by pattern.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* Section 5: Conversation Scripts */}
      <section id="scripts" className="py-24 sm:py-28 px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Words when you need them
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Sometimes you know something is wrong but don't know what to say. After your reflection, you can generate conversation scripts — gentle, firm, or de-escalating — that you can practice and use in real life.
          </p>

          <div className="grid gap-3 max-w-lg mx-auto text-left">
            {FALLBACK_SCRIPTS.map((script) => (
              <div
                key={script.tone}
                className="rounded-2xl bg-card p-4 space-y-2 shadow-[var(--shadow-card)]"
              >
                <p className="text-xs font-medium text-primary/70 uppercase tracking-wide">
                  {script.tone}
                </p>
                <p className="text-sm text-foreground leading-relaxed italic">
                  "{script.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Section 6: Your Journal */}
      <section
        id="journal"
        className="py-24 sm:py-28 px-6"
        style={{ background: "hsl(230 20% 95% / 0.5)" }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Track how you're feeling
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            If you choose, you can keep a private journal of your reflections. No email, no account — just a passphrase that only you know. Over time, your journal can help you see patterns forming and notice when things are changing.
          </p>

          {/* Stylized timeline */}
          <div className="max-w-[200px] mx-auto space-y-0 relative">
            <div className="absolute left-[14px] top-4 bottom-4 w-px bg-border" aria-hidden="true" />
            {[
              { color: "hsl(140, 30%, 55%)", label: "Feeling safer" },
              { color: "hsl(35, 20%, 60%)", label: "About the same" },
              { color: "hsl(140, 20%, 65%)", label: "A little better" },
              { color: "hsl(5, 40%, 60%)", label: "Need support" },
            ].map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-3 relative z-10">
                <div
                  className="w-7 h-7 rounded-full shrink-0 border-2 border-background"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                <div className="rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-card)] flex-1">
                  <p className="text-xs text-muted-foreground">{entry.label}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-md mx-auto">
            Your journal also includes regular check-ins. If your wellbeing changes over time, we'll gently let you know and share resources.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* Section 7: Sharing */}
      <section id="sharing" className="py-24 sm:py-28 px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Share on your terms
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 text-left max-w-xl mx-auto">
            <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-3 shadow-[var(--shadow-soft)]">
              <p className="text-sm font-medium text-foreground">Share with someone you trust</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can create a private summary of your reflection — patterns, context, and validation — and share a link with a friend, therapist, or advocate. The link expires after 7 days. Your written words are never included.
              </p>
            </div>
            <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-3 shadow-[var(--shadow-soft)]">
              <p className="text-sm font-medium text-foreground">Contribute anonymously</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you choose, your reflection patterns can be contributed to anonymous aggregate data that helps others see they're not alone. You can always say no.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Section 8: What this is NOT */}
      <section
        id="important"
        className="py-24 sm:py-28 px-6"
        style={{ background: "hsl(230 20% 95% / 0.5)" }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Important to know
          </h2>

          <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
            {[
              "This is not legal advice. If you need legal help, contact a local advocate.",
              "This is not a diagnosis. Patterns are educational concepts, not clinical assessments.",
              "This is not a crisis service. If you're in immediate danger, contact emergency services or the resources below.",
              "This is not social media. Your reflections are private. Nothing is public unless you choose.",
            ].map((text, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {RESOURCES.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="font-medium">{r.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Section 9: CTA */}
      <section className="py-28 sm:py-36 px-6 bg-background relative">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <WarmGlow className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" size={200} />
        </div>
        <div className="max-w-md mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Ready to reflect?
          </h2>
          <Button asChild size="lg" className="rounded-full px-8 text-base h-12 shadow-sm">
            <Link to="/reflect">Begin your reflection</Link>
          </Button>
          <p className="text-xs text-muted-foreground/60">
            No account required. Your privacy is respected.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-8 px-6 text-center space-y-3">
        <p className="text-xs text-muted-foreground/40 italic">
          "{getRandomAffirmation()}"
        </p>
        <p className="text-xs text-muted-foreground/50 max-w-md mx-auto leading-relaxed">
          This tool does not provide legal, medical, or clinical advice. It is designed to support personal reflection only.
        </p>
      </footer>
    </div>
  );
};

export default HowItWorks;
