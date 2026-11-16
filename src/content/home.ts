export const pillars = [
  {
    id: "seo",
    tag: "SEO",
    name: "Search Engine Optimization",
    oneLine: "Rank higher on Google and Bing for the searches that bring revenue.",
    definition:
      "Search Engine Optimization (SEO) is the practice of improving a website's technical health, content and authority so it ranks higher in organic search results on Google and Bing. Good SEO brings a steady stream of visitors who are already looking for what you sell, without paying for every click.",
    goal: "More qualified organic traffic, leads and sales",
    deliverables: [
      { title: "Technical SEO audit and fixes", text: "Crawlability, indexation, site speed, Core Web Vitals, mobile usability, redirects, canonical tags and XML sitemaps." },
      { title: "Keyword and intent research", text: "A keyword map built around buyer intent, search volume and difficulty, mapped page by page." },
      { title: "On-page optimization", text: "Titles, meta descriptions, headings, internal links, image alt text and content upgrades for every priority page." },
      { title: "Content strategy and production", text: "Topic clusters, service pages, blogs and landing pages written by people who understand your category." },
      { title: "Authority and link building", text: "Digital PR, brand mentions and editorial links from relevant, trustworthy publications." },
      { title: "Local SEO", text: "Google Business Profile optimization, local citations, reviews and location pages for map-pack visibility." },
      { title: "E-commerce SEO", text: "Category and product page optimization, faceted navigation control and product schema." },
      { title: "Reporting", text: "Monthly dashboards covering rankings, organic traffic, conversions and the work completed." },
    ],
  },
  {
    id: "aeo",
    tag: "AEO",
    name: "Answer Engine Optimization",
    oneLine: "Become the direct answer in featured snippets, People Also Ask and voice search.",
    definition:
      "Answer Engine Optimization (AEO) is the practice of structuring content so search engines and voice assistants can lift it as a direct answer. It targets featured snippets, People Also Ask boxes, knowledge panels and voice results from Google Assistant, Siri and Alexa, where the user gets an answer without scrolling.",
    goal: "Own the answer box for the questions your customers ask",
    deliverables: [
      { title: "Question and intent mining", text: "We collect the real questions buyers ask from People Also Ask, search data, sales calls and support tickets." },
      { title: "Answer-first content", text: "Each question gets a clear 40 to 60 word answer, followed by depth, examples and next steps." },
      { title: "Schema markup", text: "FAQPage, HowTo, Product, Review, Organization and Breadcrumb schema implemented and validated." },
      { title: "Featured snippet targeting", text: "Paragraph, list and table formats matched to the snippet type Google already shows for each query." },
      { title: "Voice search optimization", text: "Conversational phrasing and local intent coverage for spoken queries." },
      { title: "Knowledge panel and entity setup", text: "Consistent brand facts across your site, Google Business Profile and trusted directories." },
      { title: "FAQ hubs", text: "Structured FAQ sections on service and product pages that support both rankings and conversions." },
      { title: "Snippet tracking", text: "Monitoring of which answer boxes you own, which you lost and which are open to win." },
    ],
  },
  {
    id: "geo",
    tag: "GEO",
    name: "Generative Engine Optimization",
    oneLine: "Get your brand mentioned and cited by ChatGPT, Gemini, Perplexity and Google AI Overviews.",
    definition:
      "Generative Engine Optimization (GEO) is the practice of making a brand visible inside AI-generated answers. It focuses on helping large language models such as ChatGPT, Google Gemini, Perplexity, Microsoft Copilot and Google AI Overviews find, understand, trust and cite your content when they answer a user's question.",
    goal: "Be the brand AI recommends and cites",
    deliverables: [
      { title: "AI visibility audit", text: "We test how AI assistants currently describe your brand and category, and which competitors they cite instead." },
      { title: "Entity optimization", text: "Organization schema, sameAs links and consistent brand facts so models connect every mention back to you." },
      { title: "Citable content", text: "Original data, clear definitions, statistics, expert quotes and comparisons that models prefer to quote." },
      { title: "AI crawler access", text: "robots.txt rules for GPTBot, ClaudeBot, PerplexityBot and Google-Extended, plus an llms.txt brief." },
      { title: "Server-rendered content", text: "Making sure key content is in the HTML, because most AI crawlers do not run JavaScript." },
      { title: "Brand mentions and digital PR", text: "Coverage in the publications, review sites and communities that AI models learn from and retrieve." },
      { title: "Prompt and share-of-voice tracking", text: "Regular checks of a fixed prompt set to see how often and how accurately you are cited." },
      { title: "E-E-A-T signals", text: "Author profiles, credentials, update dates and source citations that establish experience and trust." },
    ],
  },
] as const;

export const comparison = {
  columns: ["SEO", "AEO", "GEO"],
  rows: [
    { label: "What it is", values: ["Ranking web pages in search results", "Being selected as the direct answer", "Being cited inside AI-generated answers"] },
    { label: "Where you appear", values: ["Google and Bing organic listings, map pack", "Featured snippets, People Also Ask, voice assistants", "ChatGPT, Gemini, Perplexity, Copilot, AI Overviews"] },
    { label: "User behaviour", values: ["Scans results and clicks through", "Reads or hears one answer", "Has a conversation and asks follow-ups"] },
    { label: "Key levers", values: ["Technical health, keywords, content, backlinks", "Question-led content, concise answers, schema", "Entity clarity, citable facts, brand mentions, crawl access"] },
    { label: "How success is measured", values: ["Rankings, organic traffic, conversions", "Snippets owned, PAA presence, voice answers", "AI citations, brand mentions, share of voice in prompts"] },
    { label: "Best for", values: ["Long-term demand capture", "Informational and how-to queries", "Research, comparison and recommendation queries"] },
  ],
};

export const process = [
  { step: "01", title: "Audit", text: "We review your site's technical health, content, authority and current visibility across Google and AI assistants. You see exactly where you stand." },
  { step: "02", title: "Strategy", text: "We build one roadmap that covers SEO, AEO and GEO together: keyword map, question map, entity plan and a prioritized backlog." },
  { step: "03", title: "Fix the foundation", text: "Technical issues, schema, site speed, crawl access and on-page gaps are resolved first so every later effort compounds." },
  { step: "04", title: "Create and earn", text: "We publish answer-first content and earn the brand mentions and links that search engines and AI models rely on." },
  { step: "05", title: "Measure and refine", text: "Monthly reporting on rankings, traffic, leads, snippets and AI citations, with the next month's plan agreed in advance." },
];

export const auditIncludes = [
  "Overall score out of 100 with a letter grade",
  "Whole-site crawl of up to 25 pages",
  "Google PageSpeed and Core Web Vitals results",
  "ChatGPT and Perplexity visibility check",
    "A prioritized action plan with plain-English fixes",
  "Branded PDF you can share with your team",
];

export const industries = [
  { name: "D2C and e-commerce", text: "Category, product and comparison visibility across search and AI shopping answers." },
  { name: "FMCG and consumer brands", text: "Brand and recipe, usage and ingredient queries where shoppers start their research." },
  { name: "B2B and SaaS", text: "Solution, alternative and comparison queries that decision makers ask AI assistants." },
  { name: "Healthcare and wellness", text: "Accurate, expert-reviewed answers with the trust signals sensitive topics require." },
  { name: "Real estate", text: "Local and project-level visibility for high-intent location searches." },
  { name: "Education", text: "Course, admission and career queries across search, voice and AI." },
  { name: "Hospitality and travel", text: "Local SEO, reviews and itinerary-style answers that drive direct bookings." },
  { name: "Professional services", text: "Authority building for firms that win business through expertise." },
];

export const reasons = [
  { title: "One team for search and AI", text: "SEO, AEO and GEO share the same foundation. We plan them together so content, schema and PR work once and pay off three times." },
  { title: "Backed by a full-service agency", text: "Sociapa has run digital marketing for brands since 2019. Content, design, development, PR and influencer teams sit under one roof." },
  { title: "Technical depth", text: "Our developers implement fixes directly: schema, rendering, speed and crawl rules. You do not get a document and a goodbye." },
  { title: "Honest reporting", text: "You see the work done, the numbers that moved and the ones that did not, every month. No vanity metrics." },
  { title: "Built for Indian and global markets", text: "English and regional-language search behaviour, local SEO across cities, and international targeting when you expand." },
  { title: "No lock-in surprises", text: "Clear scope, clear deliverables and ownership of every asset we create for you." },
];

export const plans = [
  {
    name: "SEO Foundation",
    fit: "For brands that need to fix the basics and start ranking.",
    points: ["Full technical and on-page audit", "Keyword and intent mapping", "On-page optimization of priority pages", "Monthly content and reporting"],
  },
  {
    name: "SEO + AEO Growth",
    fit: "For brands ready to own answer boxes as well as rankings.",
    points: ["Everything in SEO Foundation", "Question research and answer-first content", "Full schema implementation", "Featured snippet and PAA tracking", "Authority and link building"],
    featured: true,
  },
  {
    name: "Search + AI Visibility",
    fit: "For brands that want to lead across Google and AI assistants.",
    points: ["Everything in SEO + AEO Growth", "AI visibility audit and prompt tracking", "Entity and llms.txt setup", "Digital PR for brand mentions", "Dedicated strategist"],
  },
];

export const faqs = [
  {
    q: "What is the difference between SEO, AEO and GEO?",
    a: "SEO helps your pages rank in search results. AEO structures your content so search engines and voice assistants use it as the direct answer. GEO makes your brand visible and citable inside AI-generated answers from tools such as ChatGPT, Gemini and Perplexity. They build on the same foundation and work best together.",
  },
  {
    q: "Do I still need SEO if people are using AI search?",
    a: "Yes. AI assistants and Google AI Overviews retrieve and cite pages that are crawlable, well structured and trusted, which are the same things SEO improves. A strong SEO foundation is the starting point for AEO and GEO, not a replacement for them.",
  },
  {
    q: "How long does SEO take to show results?",
    a: "Most sites see early movement in 2 to 3 months and meaningful growth in 4 to 6 months, depending on competition, the current state of the site and how quickly fixes are implemented. Technical fixes and featured snippets can show results sooner.",
  },
  {
    q: "How do you measure GEO results?",
    a: "We track a fixed set of prompts across major AI assistants and record whether your brand is mentioned, how accurately it is described, which sources are cited and how you compare with competitors. We also monitor referral traffic from AI tools and branded search demand.",
  },
  {
    q: "What does the free audit report check?",
    a: "The free audit crawls up to 25 pages of your site and runs more than 40 checks across technical SEO, on-page SEO, AEO, GEO, Google page speed and AI visibility. It asks ChatGPT and Perplexity real buyer questions about your category to see whether your brand is mentioned. You get a score out of 100, a score for each area and a prioritized fix list as a PDF.",
  },
  {
    q: "Is the free audit the same as a full SEO audit?",
    a: "No. The free audit is automated and covers up to 25 pages, homepage speed and a handful of AI questions. A full audit by our team covers your entire site, backlink profile, keyword gaps, competitors and AI visibility across many more questions and engines, with a tailored roadmap.",
  },
  {
    q: "What is llms.txt and do I need it?",
    a: "llms.txt is a plain text file at the root of your website that gives AI systems a short, clean summary of your brand and your most important pages. It is an emerging convention rather than a formal standard, it is quick to add, and we include it in every GEO setup.",
  },
  {
    q: "Should I allow AI crawlers like GPTBot on my website?",
    a: "If you want your brand to appear in AI answers, yes. Blocking crawlers such as GPTBot, ClaudeBot or PerplexityBot in robots.txt stops those systems from reading and citing your pages. We help you decide what to allow based on your content and business model.",
  },
  {
    q: "How much do SEO, AEO and GEO services cost?",
    a: "Pricing depends on the size of your site, your competition and the scope of work. We share a custom quote after a free audit and a short discovery call, so you only pay for what will move your numbers.",
  },
  {
    q: "Who is behind SEO AEO GEO Services?",
    a: "SEO AEO GEO Services is the dedicated search and AI visibility vertical of Sociapa, a digital marketing agency founded in 2019 and based in Noida, India.",
  },
];
