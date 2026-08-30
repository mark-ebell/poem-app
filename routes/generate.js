const express = require('express');
const { requireAuth } = require('../auth');

const router = express.Router();

const POEM_SYSTEM_PROMPT = `I am a physician who summarizes research studies for other primary care physicians. Our summaries are called POEMs (Patient Oriented Evidence that Matters) and we have written over 8000 in the past 25 years. Help write the first draft of a new POEM about the attached study. The POEM must have exactly the following structure and length, using these exact field labels, one per line, in this order:

Title: No more than 18 words summarizing the main message of the study. Include the primary outcome's NNT (number needed to treat) if relevant. For example, here is a made up title: "Baloxavir reduces hospitalization or unexpected ED visit more than placebo (NNT = 220)"

Reference: The citation for the study in AMA format.

Clinical question: One sentence that presents the clinical question the study is trying to answer.

Allocation: If it is a randomized trial, was allocation either "Concealed", "Unconcealed", or "Uncertain". Acceptable methods of concealment include Web response systems and central randomization and allocation services.

Funding: Which of the following funding sources best describes this study: "Industry", "Government", "Foundation", "Industry + Foundation", "Industry + Government", "Self-funded or unfunded", "Government + Foundation", or "Government + Foundation + Industry".

Study design: Which of the following study designs best describes this study: "Meta-analysis (randomized controlled trials)", "Meta-analysis (cohort or case-control)", "Meta-analysis (diagnostic)", "Meta-analysis (other)", "Network meta-analysis", "Randomized controlled trial (double-blinded)", "Randomized controlled trial (outcome assessor-blinded)", "Randomized controlled trial (nonblinded)", "Non-randomized controlled trial", "Cross-over trial (randomized)", "Cross-over trial (non-randomized)", "Decision rule (validation)", "Decision rule (development only)", "Diagnostic test evaluation", "Cost-effectiveness analysis", "Decision-analysis", "Descriptive", "Cost analysis", "Ecologic", "Case series", "Time series", "Qualitative", "Practice guideline", "Cohort (prospective)", "Cohort (retrospective)", "Case-Control", "Cross-sectional", or "Other".

Population and setting: Which of the following best describes where the study was performed: "Inpatient (ICU only)", "Inpatient (any location)", "Inpatient (ward only)", "Inpatient (any location) with outpatient follow-up", "Emergency department", "Outpatient (any)", "Outpatient (primary care)", "Outpatient (specialty)", "Nursing home/extended care facility", "Rehab unit", "Various (meta-analysis)", "Various (guideline)", "Uncertain", or "Population-based".

Age group: What was the age group of participants? Classify as "Adults", "Children", or "Both adults and children". Persons 16 years and older can count as adults.

Synopsis: Summarize the study, its design, and the primary results in one or two paragraphs that are about 150 to 300 words in length. The focus should be on patient-oriented outcomes such as mortality, morbidity, symptoms, pain, or function, in other words, outcomes that a patient experiences directly. We are not interested in disease-oriented or surrogate outcomes like blood pressure, blood sugar, flow rates, and the like. When the primary outcome is a composite, tell us which of the individual components were significantly improved. Where appropriate present results as absolute risk increase or reduction and number needed to treat or number needed to harm. The format for summarizing a comparison should be of the form of a parenthetical placed toward the end of the relevant sentence, for example: "(12% vs 7%, p < 0.001, NNT = 20)". Make sure to identify any key flaws, biases, or limitations in the study. If industry funded, note if use of a placebo was appropriate or if the comparator was appropriate. If a result is reported as a change in a numerical symptom or disease score or scale, provide the range of the scale and the MCID (minimal clinically important difference).

Bottom-Line: In 1 to 4 sentences summarize the main take-home message of the study. Include the key NNT if one was reported in the Synopsis.

PubMed ID: Provide the 8-digit PubMed ID (PMID) for the article.

Do not show any bracketed internal background source-tracking tags. Output plain text only, with each field label followed by a colon and its content, nothing else before or after.`;

router.post('/', requireAuth, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'The server is not configured with an Anthropic API key. Ask the app administrator to set ANTHROPIC_API_KEY.' });
  }
  const text = (req.body && req.body.text) || '';
  if (!text.trim()) {
    return res.status(400).json({ error: 'No article text was provided.' });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        system: POEM_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Here is the full text of the research article:\n\n${text}` }]
      })
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('Anthropic API error', resp.status, errBody);
      return res.status(502).json({ error: `Anthropic API error (${resp.status}). Check the server logs for details.` });
    }

    const data = await resp.json();
    const draft = data.content.map(block => block.text || '').join('').trim();
    res.json({ draft });
  } catch (err) {
    console.error('Generate request failed', err);
    res.status(502).json({ error: 'Could not reach the Anthropic API.' });
  }
});

module.exports = router;
