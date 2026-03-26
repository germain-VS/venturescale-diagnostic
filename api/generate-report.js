export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { answers } = req.body;

  if (!answers) {
    return res.status(400).json({ error: 'No answers provided' });
  }

  const prompt = `Analyse this founder's business and generate their Founder Dependency diagnostic report.

BUSINESS WEBSITE: ${answers.website || 'Not provided'}
FOUNDER NAME: ${answers.leadName}

DIAGNOSTIC ANSWERS:
- Sales pipeline management: ${answers.q3 || 'Not answered'}
- Main lead sources: ${answers.leadsources || 'Not answered'}
- Sales team in place: ${answers.q5 || 'Not answered'}
- Process documentation: ${answers.processdocs || 'Not answered'}
- Pipeline loss visibility: ${answers.q7 || 'Not answered'}
- Customer journey visibility: ${answers.q8 || 'Not answered'}
- Board reporting confidence: ${answers['q9_confidence'] || 'Not answered'}
- Typical client LTV: ${answers['q9_ltv'] || 'Not answered'}

AVAILABLE GAPS TO SELECT FROM (pick the 3 most relevant based on answers):
1. No Repeatable Sales Process
2. Underpowered Sales Enablement
3. Underutilised or Wrong Tech Stack
4. Manual Revenue Operations
5. Poor Data Architecture
6. No Board-Ready Commercial Intelligence
7. Founder-to-Team Authority Gap
8. No Systematic Lead Generation
9. Undiagnosed Conversion Breakdown
10. Weak Social and Market Authority

Generate a personalised report. Reference their specific answers and business context throughout. Be direct, specific, and operator-level in your analysis. Never be generic.`;

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
        max_tokens: 1000,
        system: `You are VentureScale's AI diagnostic engine. You analyse founder-led businesses and identify their Founder Dependency gaps. You write in a confident, direct, operator tone - never generic, never preachy. You always personalise your analysis to the specific business based on the information provided.

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no preamble):
{
  "businessSnapshot": "2-3 sentences describing this specific business based on website and answers",
  "dependencyRating": "High|Medium|Low",
  "dependencyRatingExplanation": "2-3 sentences explaining the rating specific to this business",
  "gaps": [
    {"title": "Gap title from the provided list", "body": "2-3 sentence personalised explanation referencing their specific situation"},
    {"title": "Gap title from the provided list", "body": "2-3 sentence personalised explanation"},
    {"title": "Gap title from the provided list", "body": "2-3 sentence personalised explanation"}
  ],
  "costEstimate": "2-3 sentences estimating revenue leakage using their LTV band. Be specific and directional. Reference their LTV."
}`,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'API error' });
    }

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const report = JSON.parse(clean);

    return res.status(200).json({ report });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
}
