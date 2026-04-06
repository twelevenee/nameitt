export interface ResearchStat {
  patternKey: string;
  stat: string;
  source: string;
  sourceUrl: string;
}

export const RESEARCH_STATS: ResearchStat[] = [
  {
    patternKey: "emotional_invalidation",
    stat: "71% of women in a 2021 study reported having their workplace concerns dismissed as 'too emotional'",
    source: "McKinsey Women in the Workplace Report",
    sourceUrl: "https://womenintheworkplace.com",
  },
  {
    patternKey: "benevolent_sexism",
    stat: "Research shows benevolent sexism is often unrecognized because it feels 'positive', yet it correlates with reduced career ambition in women",
    source: "Psychology of Women Quarterly",
    sourceUrl: "https://journals.sagepub.com/home/pwq",
  },
  {
    patternKey: "gender_role_expectation",
    stat: "Women globally spend 3x more hours on unpaid domestic and care work than men",
    source: "UN Women",
    sourceUrl: "https://unwomen.org",
  },
  {
    patternKey: "objectification",
    stat: "81% of women have experienced some form of sexual harassment, including verbal harassment about their appearance",
    source: "National Sexual Violence Resource Center",
    sourceUrl: "https://nsvrc.org",
  },
  {
    patternKey: "harassment",
    stat: "Only 1 in 4 workplace harassment incidents are formally reported",
    source: "EEOC Select Task Force",
    sourceUrl: "https://eeoc.gov",
  },
  {
    patternKey: "public_intimidation",
    stat: "65% of women have experienced street harassment, with 23% being physically touched by a stranger",
    source: "Stop Street Harassment",
    sourceUrl: "https://stopstreetharassment.org",
  },
  {
    patternKey: "safety_threat",
    stat: "On average, it takes a survivor 7 attempts to leave an abusive relationship before leaving for good",
    source: "National Domestic Violence Hotline",
    sourceUrl: "https://thehotline.org",
  },
];

export function getResearchStat(patternKey: string): ResearchStat | undefined {
  return RESEARCH_STATS.find((s) => s.patternKey === patternKey);
}
