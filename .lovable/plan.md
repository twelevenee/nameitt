

# Name It — Implementation Plan

## App Structure

**Pages & Routes:**
- `/` — Landing page
- `/reflect` — Experience input form
- `/results` — Pattern results & reflection
- `/patterns` — Anonymous public stats dashboard

---

## Page-by-Page UI

### 1. Landing Page (`/`)
- Soft gradient background (muted lavender/warm neutrals)
- Centered layout with headline: *"Was I too sensitive, or was something wrong?"*
- Subheadline beneath it
- Primary CTA button → navigates to `/reflect`
- Secondary text link → navigates to `/patterns`
- Footer privacy disclaimer: *"This tool does not provide legal, medical, or clinical advice."*

### 2. Experience Input Page (`/reflect`)
- Step-like calm layout with generous spacing
- Large textarea: *"Tell us what happened"*
- Three optional selectors (pill/chip style for easy tapping):
  - **Where:** workplace, school, public space, relationship, family, online, other
  - **How it felt:** confusing, uncomfortable, humiliating, unsafe, angry, not sure
  - **Self-doubt:** yes, no, not sure
- Submit button at bottom
- On submit: client-side pattern analysis runs, experience saved to Supabase, navigate to `/results`

### 3. Results Page (`/results`)
- Section: *"Possible patterns related to your experience"*
- 2–4 pattern cards displayed as soft, rounded cards with:
  - Icon + title (e.g. "Emotional Invalidation")
  - Plain-language explanation
  - *"Why this may relate"* contextual sentence
- Self-doubt detection banner (if detected): gentle message in a soft callout box
- Reflection section:
  - *"Did any of these resonate?"* — yes / somewhat / not really (pill buttons)
  - *"Would you like to anonymously contribute this experience?"* — yes / no
- Both responses saved to Supabase
- A "Start over" link back to `/reflect`

### 4. Anonymous Stats Dashboard (`/patterns`)
- Three summary stat cards:
  - Most common reported pattern
  - % of experiences with self-doubt language
  - Most common context (location)
- Simple bar or donut charts using Recharts
- Note: *"Based on anonymous, voluntarily shared experiences"*
- No personal data displayed

---

## Supabase Schema

**Table: `experiences`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | auto-generated |
| description | text | the user's story |
| context_where | text (nullable) | workplace, school, etc. |
| context_feeling | text (nullable) | confusing, uncomfortable, etc. |
| self_doubt | text (nullable) | yes / no / not sure |
| created_at | timestamptz | default now() |
| contributed | boolean | default false — did user opt in to share |

**Table: `analyses`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | auto-generated |
| experience_id | uuid (FK → experiences) | |
| detected_patterns | jsonb | array of pattern keys matched |
| self_doubt_detected | boolean | |
| created_at | timestamptz | default now() |

**Table: `user_feedback`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | auto-generated |
| experience_id | uuid (FK → experiences) | |
| resonated | text | yes / somewhat / not really |
| created_at | timestamptz | default now() |

All tables anonymous — no user_id columns. RLS policies allow anonymous inserts and read-only access to aggregated contributed data for the dashboard.

---

## Result-Card Pattern Matching Logic

A client-side keyword/phrase matching engine (no AI API needed):

**Pattern definitions** — each pattern has:
- `key`, `title`, `explanation`, `whyRelates` template
- `keywords`: array of trigger phrases

**Example patterns:**
- **Emotional Invalidation** — keywords: "overreacting", "too sensitive", "calm down", "dramatic"
- **Benevolent Sexism** — keywords: "compliment", "meant well", "just being nice", "protective"
- **Gender Role Expectation** — keywords: "should", "supposed to", "real woman", "not ladylike", "housework"
- **Objectification** — keywords: "body", "looked at", "appearance", "commented on looks"
- **Harassment** — keywords: "followed", "wouldn't stop", "touched", "catcall", "persistent"
- **Public Intimidation** — keywords: "street", "yelled", "scared", "threatened", "alone"
- **Safety Threat** — keywords: "afraid", "unsafe", "couldn't leave", "trapped", "stalked"

**Self-doubt detection** — scan for: "maybe I'm", "probably nothing", "I might be", "am I crazy", "was I wrong", "too sensitive", "overreacting"

Top 2–4 matching patterns shown (sorted by keyword hit count). Context selectors boost relevance (e.g., "public space" boosts public intimidation).

---

## Design System
- Soft, warm color palette: muted rose, lavender accents, warm grays
- Clean sans-serif typography with generous line height
- Rounded corners, soft shadows
- Mobile-first responsive layout
- Calm, breathing whitespace throughout

---

## Sample Seed Data
Pre-insert ~10 sample contributed experiences with analyses to populate the dashboard on first load.

