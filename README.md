# Name It

> *"It wasn't nothing."*

**Name It** is a privacy-first web application that helps people navigating gender-based harm find language for experiences they struggle to articulate. When someone is told they are overreacting — when something feels wrong but cannot be named — the tool guides them through a structured reflection, identifies the psychological and social patterns at play, and connects them to a community of anonymous shared experiences.

The project sits at the intersection of **human-computer interaction**, **computational social science**, and **trauma-informed design**. It is built not just as a product, but as a research artifact: a system for surfacing, categorizing, and aggregating lived experiences of subtle discrimination at scale.

---

## Motivation

Subtle gender-based harm — emotional invalidation, benevolent sexism, microaggressions — is systematically underreported because victims frequently doubt the validity of their own experience. Existing digital tools in this space are either clinical (requiring formal diagnoses) or purely informational (blog posts, awareness campaigns). There is a gap for interactive, reflective, data-generating tools that meet people in the moment of uncertainty and help them make sense of what happened.

Name It was designed to fill that gap.

---

## Features

### Conversational Reflection Interface

The reflection experience is built as a chat-style conversational UI rather than a traditional form. Users describe their experience in free text; the interface responds with empathy, asks contextual follow-up questions (where it happened, how it felt, whether they doubted themselves), and performs pattern analysis — all without storing the raw narrative text.

The conversation flow is a deterministic state machine with ~20 discrete steps, managing safety checks, branching logic, and emotional pacing.

### Pattern Detection Engine

A custom weighted keyword analysis engine classifies free-text narratives against a curated taxonomy of **seven gender-harm patterns**:

| Pattern | Description |
|---|---|
| Emotional Invalidation | Dismissal or minimization of emotional responses |
| Benevolent Sexism | Superficially positive attitudes that reinforce subordination |
| Gender Role Expectation | Pressure to conform to gendered behavioral norms |
| Objectification | Reduction to physical appearance; denial of personhood |
| Harassment | Persistent, unwanted behavior creating a hostile environment |
| Public Intimidation | Dominance assertion in public spaces |
| Safety Threat | Situations involving physical or psychological coercion |

Each pattern is defined by a weighted keyword lexicon (weights range from 0.5 for generic terms to 2.0 for highly specific phrases), optional context boosts (e.g., harassment scores higher in workplace contexts), and a minimum confidence threshold. Results are returned at three confidence levels: **strong match**, **possible match**, and **worth considering** — language chosen deliberately to avoid over-pathologizing ambiguous experiences.

The engine also detects **self-doubt language** ("maybe I'm overreacting", "probably nothing", "am I crazy") as a first-class signal, surfacing a validation message when present.

### Privacy by Design

- Raw narrative text is **never persisted**. After analysis, the description field is replaced with a redacted placeholder.
- No account or email is required anywhere in the application.
- The private journal is protected by a **passphrase-only authentication** scheme (bcrypt hash stored in the database, no recovery mechanism).
- Shareable reflection summaries are ephemeral: links expire after 7 days and never include the user's written words.

### Community Stories and Aggregate Patterns

Users may optionally contribute their reflection to an anonymous community pool. Contributed patterns are aggregated and displayed on a public Patterns dashboard, which tracks:

- Most frequently identified patterns across all shared experiences
- Percentage of reflections involving self-doubt
- Most common contexts (workplace, public space, relationship, etc.)

This creates a **participatory data collection layer** — every reflection that is shared enriches a community dataset that helps others feel less alone and provides researchers with naturalistic data about how people describe these experiences.

### Conversation Scripts

After pattern detection, users can request response scripts — suggested language for addressing the situation with the other person. Scripts are offered in three tones (Gentle but firm, Direct and clear, De-escalation focused) and are grounded in the specific patterns identified.

### Personal Journal

A private, longitudinal journal lets users track their reflections and emotional check-ins over time. The journal surfaces patterns across reflections and visualizes how the user's sense of safety has changed — designed to support awareness without creating clinical pressure.

### Safety Infrastructure

A safety interstitial detects crisis-related language in real time and surfaces localized crisis resources before proceeding with reflection. The application integrates country-specific helplines and emergency contacts via a geolocation-aware resource system.

### Internationalization

Full i18n support via a React context-based language system, with a language switcher UI. All user-facing strings, including patterns, prompts, and affirmations, are externalized and translation-ready.

---

## Technical Architecture

```
src/
├── pages/              # Route-level components (Landing, Reflect, Results, Patterns, Journal, Stories…)
├── components/         # Shared UI components (Companion, ConversationBubble, TypingIndicator…)
├── lib/
│   ├── patterns.ts     # Pattern taxonomy + weighted keyword analysis engine
│   ├── story-matching.ts    # Semantic matching of experiences to community stories
│   ├── research-stats.ts    # Research citation layer
│   ├── fallback-scripts.ts  # Response script templates
│   ├── journal-auth.ts      # Passphrase-based session management
│   └── i18n/           # Internationalization (strings, crisis resources)
├── contexts/           # React context providers (LangContext)
└── integrations/
    └── supabase/       # Database client + TypeScript schema types
```

**Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui (Radix UI primitives) |
| Routing | React Router v6 |
| Data fetching | TanStack React Query |
| Backend / Database | Supabase (PostgreSQL) |
| Charts | Recharts |
| Testing | Vitest, Testing Library |

**Database schema** (Supabase / PostgreSQL):

- `experiences` — anonymized reflection metadata (context, feelings, self-doubt flag; raw text redacted)
- `analyses` — detected patterns and self-doubt signal per experience
- `journal_users` — passphrase-hash-only user records
- `checkins` — longitudinal emotional check-in log
- `scripts` — generated conversation scripts per experience
- `stories` — community-contributed composite narratives
- `shared_summaries` — ephemeral share link payloads (TTL: 7 days)

---

## Research Dimensions

This project was developed with several open research questions in mind:

1. **Pattern validity**: Do the weighted keyword patterns reliably surface the constructs they target (emotional invalidation, objectification, etc.)? How does performance compare to human annotation?

2. **Self-doubt as a signal**: Self-doubt language ("maybe I'm overreacting") is treated here as a first-class feature. Does its presence correlate with specific harm types or contexts? Can it serve as a proxy for gaslight experiences?

3. **Participatory data collection**: Can a tool designed for personal reflection also function as an ethical, consent-grounded pipeline for naturalistic data about everyday discrimination?

4. **Trauma-informed UX**: What design choices — pacing, language, affirmations, safety interstitials — meaningfully reduce harm in emotionally loaded digital interactions?

5. **Language and naming**: How does having a name for an experience change how someone processes or acts on it? (c.f. Pennebaker's expressive writing paradigm.)

---

## Getting Started

**Requirements:** Node.js 18+, npm

```sh
# Clone the repository
git clone <repo-url>
cd nameitt

# Install dependencies
npm install

# Start the development server
npm run dev
```

```sh
# Run tests
npm test

# Build for production
npm run build
```

A Supabase project is required for full functionality. Configure your environment with the Supabase URL and anon key.

---

## Design Philosophy

> *The text you write here is used to identify patterns but is not permanently stored.*

Three principles shaped every design decision:

**Validation over diagnosis.** The tool does not tell users what happened to them or whether it was "serious enough." It reflects back patterns, offers language, and affirms that their experience is real — regardless of how it is categorized.

**Contribution without extraction.** Sharing is optional, anonymous, and meaningful. Users who contribute help build a collective dataset that others can find themselves in. Data is not sold or shared externally.

**Safety as infrastructure.** Crisis resources, safety checks, and escalation detection are not afterthoughts — they are load-bearing parts of the architecture.

---

## Acknowledgments

Pattern definitions and example narratives draw on publicly available research in gender studies, social psychology, and discrimination literature, including work on benevolent sexism (Glick & Fiske), emotional labor (Hochschild), and the psychology of self-doubt in discrimination experiences (Crocker & Major).
