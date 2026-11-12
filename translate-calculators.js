// Machine translation of the diagnostic calculators' names (presentations, diseases, tests and
// findings, result levels, and the Differential Diagnosis items and diagnoses) with Claude.
//
//   npm run translate-calculators -- it        (needs ANTHROPIC_API_KEY)
//
// Writes calculator-i18n/<lang>.json, { "English name": "translation" }, which
// routes/calculator.js and routes/site-search.js use to show the names in the reader's
// language (the English name stays the value, so links and look-ups are unchanged). Only
// names not yet in the file are sent, so after the spreadsheets are updated, run it again
// and commit the file. To correct a translation, edit the file by hand: it is kept.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { calculatorStrings, translationFile } = require('./calculator-i18n');

const MODEL = 'claude-opus-5-5';
const LANGUAGES = { it: 'Italian' };
const BATCH = 150; // names per request
const PARALLEL = 4;

const SCHEMA = {
  type: 'object',
  properties: {
    translations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'integer' }, text: { type: 'string' } },
        required: ['id', 'text'],
        additionalProperties: false
      }
    }
  },
  required: ['translations'],
  additionalProperties: false
};

const system = language => `You translate the labels of a diagnostic calculator for physicians from English into ${language}.
The labels are clinical presentations ("Chest pain suspected"), target diseases ("acute coronary syndrome"), diagnostic tests and clinical findings with their thresholds ("Troponin T > 0.01 ng/ml", "Murphy's sign"), result levels ("0 - 180 U/L", "Normal") and differential diagnoses.
- Use the terminology ${language} physicians use in clinical practice and in the medical literature, and the abbreviations they use (in Italian, for example: ECG, TC for CT, RM for MRI, PCR for CRP, BPCO for COPD, IMA for acute MI, TVP for DVT, EP for PE). Keep an English abbreviation that ${language} physicians also use as is.
- Keep numbers, units, thresholds, symbols (>, <=, ±, /, →), drug names, eponyms and named scores or criteria exactly as they are; translate only the words around them.
- Keep the label's style: as short as the original, and lower case where the original starts in lower case.
- A label with nothing to translate (only numbers, units or a proper name) is returned unchanged.
- Translate each label on its own; never add explanations.
Return every id you are given, with its translation.`;

async function translateBatch(client, language, batch) {
  const user = batch.map((s, i) => `${i}\t${s}`).join('\n');
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: system(language),
    messages: [{ role: 'user', content: `Translate these labels (id, tab, English label):\n${user}` }]
  });
  const message = await stream.finalMessage();
  if (message.stop_reason !== 'end_turn') throw new Error(`stopped: ${message.stop_reason}`);
  const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const out = {};
  for (const { id, text: tr } of JSON.parse(text).translations) {
    if (Number.isInteger(id) && batch[id] !== undefined && tr.trim()) out[batch[id]] = tr.trim();
  }
  return { out, usage: message.usage };
}

async function main() {
  const lang = process.argv[2] || 'it';
  if (!LANGUAGES[lang]) throw new Error(`No language ${lang}; known: ${Object.keys(LANGUAGES).join(', ')}`);
  const file = translationFile(lang);
  let done = {};
  try { done = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first run */ }
  const todo = calculatorStrings().filter(s => !(s in done));
  console.log(`${Object.keys(done).length} names already translated, ${todo.length} to do.`);
  if (!todo.length) return;
  const client = new Anthropic();
  const batches = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
  const save = () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const sorted = Object.fromEntries(Object.entries(done).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(file, JSON.stringify(sorted, null, 1) + '\n');
  };
  let next = 0, tokensIn = 0, tokensOut = 0, failed = 0;
  async function worker() {
    while (next < batches.length) {
      const n = next++;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { out, usage } = await translateBatch(client, LANGUAGES[lang], batches[n]);
          Object.assign(done, out);
          tokensIn += usage.input_tokens; tokensOut += usage.output_tokens;
          const missing = batches[n].length - Object.keys(out).length;
          console.log(`batch ${n + 1}/${batches.length}: ${Object.keys(out).length} translated${missing ? `, ${missing} missing (run again)` : ''}`);
          save();
          break;
        } catch (err) {
          console.log(`batch ${n + 1}: ${err.message}${attempt < 3 ? ', retrying' : ', skipped (run again)'}`);
          if (attempt === 3) failed++;
        }
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  save();
  console.log(`${Object.keys(done).length} names in ${path.relative(__dirname, file)}; tokens in ${tokensIn}, out ${tokensOut}${failed ? `; ${failed} batches failed` : ''}.`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
