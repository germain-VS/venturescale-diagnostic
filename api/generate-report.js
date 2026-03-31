export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { answers } = req.body;
  if (!answers) return res.status(400).json({ error: 'No answers provided' });

  const systemPrompt = `You are VentureScale's commercial intelligence engine. VentureScale is a GTM and Revenue Operations consultancy that designs and builds the systems, processes and data architecture that growth-stage businesses need to scale.

Before generating any section of the report, you must search the web for the company using their URL and company name. Search Crunchbase, LinkedIn, Dealroom, Companies House, G2, BuiltWith and any relevant press coverage to find: funding stage and amount, founding date, team size, recent news, tech stack signals, and any other relevant commercial context. Combine this with the website content and the diagnostic answers to generate a report that feels impressively specific and accurate.

If specific data points cannot be found — funding amount, team size, founding date, revenue figures — do not mention them or acknowledge their absence. Simply omit them and write naturally around what is available. The report should never expose gaps in the data it was able to find. A reader should never know what you could not find — only what you did.

Your job is to generate a Commercial Growth Report for a specific company. The report must feel genuinely personalised — not generic. Every section should reference the company by name and reflect what you know about their specific business, stage, and situation.

The tone is confident, direct, and operator-level. You are writing for a founder or senior commercial leader. Never be preachy, never be generic, never soften important truths — but always frame challenges as natural and fixable, never as failures or mistakes.

Critical rules:
- Never assume the founder or their team has done anything wrong — frame all gaps as natural consequences of moving fast at early stage
- Never use the phrase it is clear that or it is evident that — show do not tell
- Never use em dashes
- Never open a section with a generic observation — always lead with something specific to this company
- Reference their actual answers throughout — not in a robotic way but naturally woven into the narrative
- Use you and your not the company — speak directly to the reader
- Write in short paragraphs — never more than 4 sentences per paragraph
- Always validate what the business has achieved before identifying any gaps
- Frame all gaps as natural consequences of moving fast at early stage — never as failures

Return ONLY valid JSON with no markdown, no backticks, no preamble. Use this exact structure:

{
  "companyOverview": "2-3 sentences. Who they are, what they do, their business model, stage and size. Drawn from the website crawl and web search. Specific and accurate. Never generic.",

  "icpProfile": {
    "accountProfile": "The type of company they sell to — industry, size, geography. Inferred from website and web search.",
    "buyerTitle": "The specific job title or function of their primary buyer.",
    "triggerMoment": "The specific moment or pain that makes a prospect ready to buy.",
    "dealComplexity": "Single or multi-stakeholder, approximate sales cycle length."
  },

  "criticalTransition": "3-4 sentences. Start by validating what they have achieved — proven product, early traction, investor backing or commercial momentum. Then acknowledge that the next stage requires a different infrastructure without implying anything was built wrong. Reference their specific stage and situation. End with why building the right infrastructure now matters for their specific business.",

  "maturityRating": "Foundational|Developing|Optimised",

  "maturityRatingExplanation": "1-2 sentences explaining why they received this rating. Reference their specific answers. Forward-looking — what this stage means for where they are headed, not a criticism of where they are.",

  "scores": {
    "commercialFoundation": 0,
    "systemsCrmData": 0,
    "automationAiReadiness": 0
  },

  "areaAnalyses": {
    "commercialFoundation": "3-4 sentences. A personalised analysis of their Commercial Foundation score. Reference their specific Area 1 answers — sales process maturity, ICP definition, knowledge documentation. Name the specific consequence of any gaps for a company at their stage. Frame positively — acknowledge what is working before identifying what needs to change.",
    "systemsCrmData": "3-4 sentences. A personalised analysis of their Systems, CRM and Data score. Reference their specific Area 2 answers — CRM setup and optimisation, board reporting confidence, forecast reliability. Connect data gaps directly to investor and board consequences. Frame positively.",
    "automationAiReadiness": "3-4 sentences. A personalised analysis of their Automation and AI Readiness score. Reference their specific Area 3 answers — manual task volume, tech stack integration, data quality. Connect data quality directly to AI readiness. Frame positively — what becomes possible when this is fixed."
  },

  "keyTakeaways": "3-4 sentences. Synthesise the three area analyses into one coherent narrative — what is the common thread across all three scores? Reference the company by name. Be specific about the commercial and strategic consequence of the overall picture. End with a single forward-looking sentence that creates natural desire for the next step without explicitly selling. Never mention VentureScale services by name in this section."
}`;

  const userPrompt = `Generate a Commercial Growth Report for the following company.

COMPANY WEBSITE: ${answers.website || 'Not provided'}

DIAGNOSTIC ANSWERS:

Area 1 — Commercial Foundation
Q1 (How would a new sales hire learn your sales process today?): ${answers.q1 || 'Not answered'}
Q2 (How clearly defined is your ICP across your commercial team?): ${answers.q2 || 'Not answered'}
Q3 (Where does your product knowledge and competitive positioning live?): ${answers.q3 || 'Not answered'}

Area 2 — Systems, CRM & Data
Q4 (Is your CRM set up and optimised for your unique sales process?): ${answers.q4 || 'Not answered'}
Q5 (If your board asked for pipeline coverage, CAC and conversion rates — how would you respond?): ${answers.q5 || 'Not answered'}
Q6 (How reliable is your revenue forecast?): ${answers.q6 || 'Not answered'}

Area 3 — Automation & AI Readiness
Q7 (How much of your team's time is spent on manual tasks?): ${answers.q7 || 'Not answered'}
Q8 (How connected and integrated is your tech stack?): ${answers.q8 || 'Not answered'}
Q9 (How would you describe the quality and consistency of data your team captures?): ${answers.q9 || 'Not answered'}

RAW SCORES (each answer scored 1-4, three questions per area):
Area 1 raw score: ${answers.score1 || 0} / 12
Area 2 raw score: ${answers.score2 || 0} / 12
Area 3 raw score: ${answers.score3 || 0} / 12
Total: ${(answers.score1 || 0) + (answers.score2 || 0) + (answers.score3 || 0)} / 36

Calculate display scores as (raw score / 12) x 10 rounded to one decimal place for each area.

Maturity rating logic:
- Total 9-18: Foundational
- Total 19-27: Developing
- Total 28-36: Optimised

Use the website and web search to generate the company overview and ICP sections accurately. Use the answers and scores to generate everything else. Make every section feel specific to this company — never generic.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        tools: [{
          type: "web_search_20250305",
          name: "web_search"
        }],
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'API error' });
    }

    const data = await response.json();
    const textContent = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const clean = textContent.replace(/```json|```/g, '').trim();
    const report = JSON.parse(clean);

    return res.status(200).json({ report });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
}
