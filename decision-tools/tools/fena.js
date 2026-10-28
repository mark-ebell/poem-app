// Fractional excretion of sodium in acute renal failure (Espinel 1976; EE+ 103).
const fena = a => [a.us, a.ps, a.uc, a.pc].every(v => typeof v === 'number') ? (a.us * a.pc) / (a.uc * a.ps) : NaN;
const HIGH = [
  ['Hypertension, hemolytic anemia, thrombocytopenia, recent procedure, atherosclerosis', 'Vascular cause. Microvascular: TTP, hemolytic uremic syndrome, HELLP syndrome, atheroembolic disease. Consider biopsy. Macrovascular: renal artery occlusion, abdominal aortic disease. Consider surgery.'],
  ['Hypertension, proteinuria, hematuria, RBC casts, dysmorphic RBCs', 'Glomerular. Consider biopsy, work-up for systemic disease.'],
  ['Toxin, rash, eosinophilia, urine eosinophils', 'Interstitial nephritis. Eliminate toxins, consider corticosteroids and biopsy.'],
  ['Ischemia, toxins, coarse brown granular casts', 'Acute tubular necrosis. Supportive care, reverse ischemia, eliminate toxins, maintain euvolemia.'],
  ['Suggestive history and examination, anuria, elevated post-void residual', 'Postrenal ARF. Specific treatment of underlying cause, i.e. BPH or obstruction.']
];
module.exports = {
  id: 'fena',
  eeId: 103,
  title: 'Acute renal failure diagnosis (FENa)',
  subtitle: 'Fractional excretion of sodium',
  question: 'For a patient with acute renal failure, does the fractional excretion of sodium suggest a prerenal or an intrinsic or postrenal cause?',
  inputs: [
    { id: 'us', type: 'number', label: 'Urine sodium', unit: 'mmol/L', min: 1, max: 300, ee: 'EDIT_US' },
    { id: 'ps', type: 'number', label: 'Plasma sodium', unit: 'mmol/L', min: 100, max: 180, ee: 'EDIT_PS' },
    { id: 'uc', type: 'number', label: 'Urine creatinine', min: 0.1, max: 30000, step: 0.1, ee: 'EDIT_UC', note: 'Any unit, as long as urine and plasma creatinine use the same one.' },
    { id: 'pc', type: 'number', label: 'Plasma creatinine', min: 0.1, max: 3000, step: 0.1, ee: 'EDIT_PC' },
    { id: 'uo', type: 'number', label: 'Urine osmolality (optional)', unit: 'mOsm/kg', min: 50, max: 1500, optional: true, ee: 'EDIT_UO' },
    { id: 'high', type: 'choice', label: 'Further evaluation (FENa above 1%): which findings are present?', ee: 'RADIO_HighFENa', when: a => fena(a) > 0.01,
      options: HIGH.map(([label]) => ({ label })) }
  ],
  footnote: 'FENa = (urine Na × plasma creatinine) ÷ (plasma Na × urine creatinine) × 100.',
  compute(a) {
    const f = fena(a), lines = [];
    const fe = `Fractional excretion of sodium ${Math.round(f * 10000) / 100}%`;
    if (f <= 0.01) {
      if (a.uo !== undefined && a.uo !== null) lines.push(a.uo > 500 ? 'Urine osmolality > 500 confirms this.' : "However, urine osmolality doesn't confirm. Note: FENa is more accurate.");
      lines.push('Remember: pigment and contrast nephropathy can cause FENa < 1%.');
      lines.push('Patients with chronic renal insufficiency or taking diuretics may have prerenal azotemia and an FENa > 1%.');
      lines.push({ label: 'Further evaluation (FENa ≤ 1%, probable prerenal ARF)', value: '1. Identify and eliminate offending agents (ACEI, NSAID). 2. If true intravascular depletion, treat underlying cause and hydrate to euvolemia. 3. If relative intravascular depletion, treat underlying cause.' });
      return { level: 2, headline: `${fe}, suggesting prerenal azotemia or acute glomerulonephritis`, lines };
    }
    if (a.uo !== undefined && a.uo !== null) lines.push(a.uo < 350 ? 'Urine osmolality < 350 confirms this.' : "However, urine osmolality doesn't confirm. Note: FENa is more accurate.");
    lines.push('Patients with chronic renal insufficiency or taking diuretics may have prerenal azotemia and an FENa > 1%.');
    lines.push({ label: 'Further evaluation', value: HIGH[a.high || 0][1] });
    return { level: 3, headline: `${fe}, suggesting tubular injury (ischemia, toxins), acute interstitial nephritis, or postrenal azotemia`, lines };
  }
};
