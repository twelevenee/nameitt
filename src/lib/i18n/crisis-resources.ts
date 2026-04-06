export interface CrisisResource {
  name: string;
  description: string;
  phone?: string;
  textLine?: string;
  url: string;
}

export interface CountryResources {
  countryCode: string;
  countryName: string;
  resources: CrisisResource[];
}

const COUNTRY_RESOURCES: CountryResources[] = [
  {
    countryCode: "US",
    countryName: "United States",
    resources: [
      { name: "National Domestic Violence Hotline", description: "24/7 support for domestic violence", phone: "1-800-799-7233", url: "https://thehotline.org" },
      { name: "Crisis Text Line", description: "Free crisis support via text", textLine: "Text HOME to 741741", url: "https://crisistextline.org" },
      { name: "RAINN", description: "Support for sexual violence", phone: "1-800-656-4673", url: "https://rainn.org" },
    ],
  },
  {
    countryCode: "GB",
    countryName: "United Kingdom",
    resources: [
      { name: "National Domestic Abuse Helpline", description: "24-hour helpline", phone: "0808 2000 247", url: "https://nationaldahelpline.org.uk" },
      { name: "Refuge", description: "Support for women and children against domestic violence", url: "https://refuge.org.uk" },
      { name: "Women's Aid", description: "National charity working to end domestic abuse", url: "https://womensaid.org.uk" },
    ],
  },
  {
    countryCode: "CA",
    countryName: "Canada",
    resources: [
      { name: "Assaulted Women's Helpline", description: "24/7 crisis counselling", phone: "1-866-863-0511", url: "https://awhl.org" },
      { name: "ShelterSafe", description: "Find a safe shelter near you", url: "https://sheltersafe.ca" },
      { name: "Crisis Text Line", description: "Free crisis support via text", textLine: "Text HOME to 686868", url: "https://crisistextline.org" },
    ],
  },
  {
    countryCode: "AU",
    countryName: "Australia",
    resources: [
      { name: "1800RESPECT", description: "National sexual assault, domestic and family violence counselling", phone: "1800 737 732", url: "https://1800respect.org.au" },
      { name: "Lifeline", description: "24-hour crisis support and suicide prevention", phone: "13 11 14", url: "https://lifeline.org.au" },
    ],
  },
  {
    countryCode: "IN",
    countryName: "India",
    resources: [
      { name: "Women Helpline", description: "Government emergency helpline for women", phone: "181", url: "https://ncw.nic.in" },
      { name: "National Commission for Women", description: "Complaints and support services", url: "https://ncw.nic.in" },
    ],
  },
  {
    countryCode: "KR",
    countryName: "South Korea",
    resources: [
      { name: "Korea Women's Hotline", description: "Counselling and support services", phone: "02-2263-6464", url: "https://hotline.or.kr" },
      { name: "Digital Sexual Crime Victim Support Center", description: "Support for digital sexual violence", phone: "02-735-8994", url: "https://d4u.stop.or.kr" },
      { name: "Emergency", description: "Police emergency line", phone: "112", url: "https://police.go.kr" },
    ],
  },
  {
    countryCode: "GLOBAL",
    countryName: "Global / Other",
    resources: [
      { name: "Women Against Violence Europe", description: "European network of women's organizations", url: "https://wave-network.org" },
      { name: "UN Women", description: "Global gender equality resources", url: "https://unwomen.org" },
      { name: "Hot Peach Pages", description: "International directory of abuse hotlines", url: "https://hotpeachpages.net" },
    ],
  },
];

const COUNTRY_KEY = "nameit_country";

const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US",
  "America/Phoenix": "US", "America/Anchorage": "US", "Pacific/Honolulu": "US",
  "Europe/London": "GB",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA", "America/Halifax": "CA",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU", "Australia/Perth": "AU",
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN",
  "Asia/Seoul": "KR",
};

const LANG_COUNTRY_MAP: Record<string, string> = {
  "en-US": "US", "en-GB": "GB", "en-CA": "CA", "en-AU": "AU",
  "ko": "KR", "ko-KR": "KR", "hi": "IN", "hi-IN": "IN",
};

export function detectCountry(): string {
  // Check sessionStorage first
  try {
    const stored = sessionStorage.getItem(COUNTRY_KEY);
    if (stored) return stored;
  } catch {}

  // Try language
  const lang = navigator.language;
  if (LANG_COUNTRY_MAP[lang]) return LANG_COUNTRY_MAP[lang];

  // Try timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_COUNTRY_MAP[tz]) return TIMEZONE_COUNTRY_MAP[tz];
  } catch {}

  return "GLOBAL";
}

export function setCountry(code: string): void {
  try { sessionStorage.setItem(COUNTRY_KEY, code); } catch {}
}

export function getCountry(): string {
  try {
    return sessionStorage.getItem(COUNTRY_KEY) || detectCountry();
  } catch {
    return "GLOBAL";
  }
}

export function getResourcesForCountry(code: string): CrisisResource[] {
  const entry = COUNTRY_RESOURCES.find((c) => c.countryCode === code);
  return entry?.resources ?? COUNTRY_RESOURCES.find((c) => c.countryCode === "GLOBAL")!.resources;
}

export function getPrimaryHelpUrl(code: string): string {
  const resources = getResourcesForCountry(code);
  return resources[0]?.url ?? "https://unwomen.org";
}

export function getAllCountries(): { code: string; name: string }[] {
  return COUNTRY_RESOURCES.map((c) => ({ code: c.countryCode, name: c.countryName }));
}

export { COUNTRY_RESOURCES };
