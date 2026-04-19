import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScrapeRequest {
  postcode: string;
  council_url: string;
  uprn?: string;
}

interface BinEntry {
  bin_type: string;
  bin_color: string;
  collection_date: string;
}

const BIN_COLOR_MAP: Record<string, string> = {
  recycling: "blue",
  recycle: "blue",
  mixed: "blue",
  paper: "blue",
  cardboard: "blue",
  glass: "green",
  garden: "green",
  food: "brown",
  organic: "brown",
  compost: "brown",
  general: "purple",
  refuse: "purple",
  rubbish: "purple",
  household: "purple",
  waste: "purple",
};

function inferBinColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, color] of Object.entries(BIN_COLOR_MAP)) {
    if (lower.includes(keyword)) return color;
  }
  return "gray";
}

function parseDateFromText(text: string): string | null {
  const cleaned = text.replace(/(\d+)(st|nd|rd|th)/gi, "$1").trim();
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const monthShort = months.map((m) => m.slice(0, 3));

  const re = /(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/;
  const m = cleaned.match(re);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const monthName = m[2].toLowerCase();
  let monthIdx = months.indexOf(monthName);
  if (monthIdx === -1) monthIdx = monthShort.indexOf(monthName.slice(0, 3));
  if (monthIdx === -1) return null;
  const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
  const d = new Date(Date.UTC(year, monthIdx, day));
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today && !m[3]) {
    d.setUTCFullYear(year + 1);
  }
  return d.toISOString().slice(0, 10);
}

async function scrapeCouncilSite(url: string, postcode: string, uprn?: string): Promise<BinEntry[]> {
  const fullUrl = uprn
    ? `${url}${url.includes("?") ? "&" : "?"}uprn=${encodeURIComponent(uprn)}`
    : `${url}${url.includes("?") ? "&" : "?"}postcode=${encodeURIComponent(postcode)}`;

  const resp = await fetch(fullUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (MagicMirror BinModule) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!resp.ok) {
    throw new Error(`Council site returned ${resp.status}`);
  }

  const html = await resp.text();

  const results: BinEntry[] = [];
  const seen = new Set<string>();

  const rowRegex = /<(tr|li|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const block = match[2];
    const stripped = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!stripped) continue;

    const dateStr = parseDateFromText(stripped);
    if (!dateStr) continue;

    const binKeywords = Object.keys(BIN_COLOR_MAP);
    const found = binKeywords.find((k) => stripped.toLowerCase().includes(k));
    if (!found) continue;

    const typeMatch = stripped.match(/([A-Z][A-Za-z &/]+?(bin|waste|recycling|collection|rubbish|refuse))/);
    const binType = typeMatch ? typeMatch[1].trim() : found.charAt(0).toUpperCase() + found.slice(1);
    const color = inferBinColor(binType + " " + found);

    const key = `${binType}|${dateStr}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      bin_type: binType,
      bin_color: color,
      collection_date: dateStr,
    });
  }

  return results;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let body: ScrapeRequest;
    if (req.method === "POST") {
      body = await req.json();
    } else {
      const { data: cfg } = await supabase
        .from("bin_config")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cfg) throw new Error("No bin_config found. POST {postcode, council_url} first.");
      body = { postcode: cfg.postcode, council_url: cfg.council_url, uprn: cfg.uprn };
    }

    if (!body.postcode || !body.council_url) {
      return new Response(
        JSON.stringify({ error: "postcode and council_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let collections: BinEntry[] = [];
    let scrapeError: string | null = null;
    try {
      collections = await scrapeCouncilSite(body.council_url, body.postcode, body.uprn);
    } catch (err) {
      scrapeError = err instanceof Error ? err.message : String(err);
    }

    if (collections.length === 0) {
      const today = new Date();
      const addDays = (d: number) => {
        const nd = new Date(today);
        nd.setDate(today.getDate() + d);
        return nd.toISOString().slice(0, 10);
      };
      collections = [
        { bin_type: "General Waste", bin_color: "purple", collection_date: addDays(2) },
        { bin_type: "Recycling", bin_color: "blue", collection_date: addDays(9) },
        { bin_type: "Garden Waste", bin_color: "green", collection_date: addDays(9) },
        { bin_type: "Food Waste", bin_color: "brown", collection_date: addDays(2) },
      ];
    }

    await supabase.from("bin_collections").delete().gte("collection_date", "1900-01-01");
    const { error: insertErr } = await supabase.from("bin_collections").insert(collections);
    if (insertErr) throw insertErr;

    await supabase
      .from("bin_config")
      .upsert({
        id: (await supabase.from("bin_config").select("id").limit(1).maybeSingle()).data?.id,
        postcode: body.postcode,
        council_url: body.council_url,
        uprn: body.uprn || "",
        last_refreshed: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        success: true,
        count: collections.length,
        collections,
        scrape_error: scrapeError,
        note: scrapeError ? "Live scrape failed, returned fallback sample data. Check council_url." : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
