// AHA PREVENT equations, base model: 10- and 30-year risk of total CVD, ASCVD and heart failure
// (Khan SS et al., Circulation 2024). Replaces EE+ 510 (the 2013 Pooled Cohort Equations) at
// Mark Ebell's request (2026-10-26).
//
// Coefficients from the published base-model equations (as listed in MDCalc's PREVENT review);
// term definitions and input ranges as in the preventr R package (v0.11). Each model is a list of
// coefficients in the order of its keys; risk = 100 / (1 + e^-x).
const CVD10 = ['c', 'age', 'nonhdl', 'hdl', 'sbpLt', 'sbpGe', 'dm', 'smk', 'egfrLt', 'egfrGe', 'bptx', 'statin', 'bptxSbp', 'statinNonhdl', 'ageNonhdl', 'ageHdl', 'ageSbp', 'ageDm', 'ageSmk', 'ageEgfr'];
const HF10 = ['c', 'age', 'sbpLt', 'sbpGe', 'dm', 'smk', 'bmiLt', 'bmiGe', 'egfrLt', 'egfrGe', 'bptx', 'bptxSbp', 'ageSbp', 'ageDm', 'ageSmk', 'ageBmi', 'ageEgfr'];
const with30 = keys => [keys[0], keys[1], 'age2', ...keys.slice(2)];
const MODELS = {
  10: {
    female: {
      cvd: [CVD10, [-3.307728, 0.7939329, 0.0305239, -0.1606857, -0.2394003, 0.360078, 0.8667604, 0.5360739, 0.6045917, 0.0433769, 0.3151672, -0.1477655, -0.0663612, 0.1197879, -0.0819715, 0.0306769, -0.0946348, -0.27057, -0.078715, -0.1637806]],
      ascvd: [CVD10, [-3.819975, 0.719883, 0.1176967, -0.151185, -0.0835358, 0.3592852, 0.8348585, 0.4831078, 0.4864619, 0.0397779, 0.2265309, -0.0592374, -0.0395762, 0.0844423, -0.0567839, 0.0325692, -0.1035985, -0.2417542, -0.0791142, -0.1671492]],
      hf: [HF10, [-4.310409, 0.8998235, -0.4559771, 0.3576505, 1.038346, 0.583916, -0.0072294, 0.2997706, 0.7451638, 0.0557087, 0.3534442, -0.0981511, -0.0946663, -0.3581041, -0.1159453, -0.003878, -0.1884289]]
    },
    male: {
      cvd: [CVD10, [-3.031168, 0.7688528, 0.0736174, -0.0954431, -0.4347345, 0.3362658, 0.7692857, 0.4386871, 0.5378979, 0.0164827, 0.288879, -0.1337349, -0.0475924, 0.150273, -0.0517874, 0.0191169, -0.1049477, -0.2251948, -0.0895067, -0.1543702]],
      ascvd: [CVD10, [-3.500655, 0.7099847, 0.1658663, -0.1144285, -0.2837212, 0.3239977, 0.7189597, 0.3956973, 0.3690075, 0.0203619, 0.2036522, -0.0865581, -0.0322916, 0.114563, -0.0300005, 0.0232747, -0.0927024, -0.2018525, -0.0970527, -0.1217081]],
      hf: [HF10, [-3.946391, 0.8972642, -0.6811466, 0.3634461, 0.923776, 0.5023736, -0.0485841, 0.3726929, 0.6926917, 0.0251827, 0.2980922, -0.0497731, -0.1289201, -0.3040924, -0.1401688, 0.0068126, -0.1797778]]
    }
  },
  30: {
    female: {
      cvd: [with30(CVD10), [-1.318827, 0.5503079, -0.0928369, 0.0409794, -0.1663306, -0.1628654, 0.3299505, 0.6793894, 0.3196112, 0.1857101, 0.0553528, 0.2894, -0.075688, -0.056367, 0.1071019, -0.0751438, 0.0301786, -0.0998776, -0.3206166, -0.1607862, -0.1450788]],
      ascvd: [with30(CVD10), [-1.974074, 0.4669202, -0.0893118, 0.1256901, -0.1542255, -0.0018093, 0.322949, 0.6296707, 0.268292, 0.100106, 0.0499663, 0.1875292, 0.0152476, -0.0276123, 0.0736147, -0.0521962, 0.0316918, -0.1046101, -0.2727793, -0.1530907, -0.1299149]],
      hf: [with30(HF10), [-2.205379, 0.6254374, -0.0983038, -0.3919241, 0.3142295, 0.8330787, 0.3438651, 0.0594874, 0.2525536, 0.2981642, 0.0667159, 0.333921, -0.0893177, -0.0974299, -0.404855, -0.1982991, -0.0035619, -0.1564215]]
    },
    male: {
      cvd: [with30(CVD10), [-1.148204, 0.4627309, -0.0984281, 0.0836088, -0.1029824, -0.2140352, 0.2904325, 0.5331276, 0.2141914, 0.1155556, 0.0603775, 0.232714, -0.0272112, -0.0384488, 0.134192, -0.0511759, 0.0165865, -0.1101437, -0.2585943, -0.1566406, -0.1166776]],
      ascvd: [with30(CVD10), [-1.736444, 0.3994099, -0.0937484, 0.1744643, -0.120203, -0.0665117, 0.2753037, 0.4790257, 0.1782635, -0.0218789, 0.0602553, 0.1421182, 0.0135996, -0.0218265, 0.1013148, -0.0312619, 0.020673, -0.0920935, -0.2159947, -0.1548811, -0.0712547]],
      hf: [with30(HF10), [-1.95751, 0.5681541, -0.1048388, -0.4761564, 0.30324, 0.6840338, 0.2656273, 0.0833107, 0.26999, 0.2541805, 0.0638923, 0.2583631, -0.0391938, -0.1269124, -0.3273572, -0.2043019, -0.0182831, -0.1342618]]
    }
  }
};
const MMOL = 0.02586; // mg/dL to mmol/L for cholesterol

const terms = a => {
  const age = (a.age - 55) / 10, nonhdl = (a.tc - a.hdl) * MMOL - 3.5, hdl = (a.hdl * MMOL - 1.3) / 0.3;
  const sbpGe = (Math.max(a.sbp, 110) - 130) / 20, bmiGe = (Math.max(a.bmi, 30) - 30) / 5, egfrLt = (Math.min(a.egfr, 60) - 60) / -15;
  const dm = +a.dm, smk = +a.smoker, bptx = +a.bptx, statin = +a.statin;
  return {
    c: 1, age, age2: age * age, nonhdl, hdl, sbpLt: (Math.min(a.sbp, 110) - 110) / 20, sbpGe, dm, smk,
    bmiLt: (Math.min(a.bmi, 30) - 25) / 5, bmiGe, egfrLt, egfrGe: (Math.max(a.egfr, 60) - 90) / -15, bptx, statin,
    bptxSbp: bptx * sbpGe, statinNonhdl: statin * nonhdl, ageNonhdl: age * nonhdl, ageHdl: age * hdl, ageSbp: age * sbpGe,
    ageDm: age * dm, ageSmk: age * smk, ageBmi: age * bmiGe, ageEgfr: age * egfrLt
  };
};
const risk = (t, [keys, coef]) => 100 / (1 + Math.exp(-keys.reduce((x, k, i) => x + coef[i] * t[k], 0)));
// Risk for each outcome over 10 and 30 years (exported for checking).
const risks = a => {
  const t = terms(a), sex = a.sex === 0 ? 'male' : 'female', out = {};
  for (const years of [10, 30]) for (const [k, m] of Object.entries(MODELS[years][sex])) out[`${k}${years}`] = risk(t, m);
  return out;
};
const ASCVD_BANDS = [[3, 1, 'Low (under 3%)'], [5, 2, 'Borderline (3% to under 5%)'], [10, 3, 'Intermediate (5% to under 10%)'], [Infinity, 4, 'High (10% or more)']];

module.exports = {
  id: 'prevent',
  eeId: 510,
  title: 'Cardiovascular risk (AHA PREVENT equations)',
  subtitle: '10- and 30-year risk of total cardiovascular disease, ASCVD and heart failure',
  question: 'For an adult aged 30 to 79 without cardiovascular disease, what is the risk of a heart attack, stroke or heart failure over the next 10 and 30 years?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 30, max: 79, step: 1 },
    { id: 'sex', type: 'choice', label: 'Sex', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'tc', type: 'number', label: 'Total cholesterol', unit: 'mg/dL', min: 130, max: 320, step: 1 },
    { id: 'hdl', type: 'number', label: 'HDL cholesterol', unit: 'mg/dL', min: 20, max: 100, step: 1 },
    { id: 'sbp', type: 'number', label: 'Systolic BP', unit: 'mm Hg', min: 90, max: 180, step: 1 },
    { id: 'bmi', type: 'number', label: 'BMI', unit: 'kg/m²', min: 18.5, max: 39.9, step: 0.1, note: 'Used only for heart failure risk.' },
    { id: 'egfr', type: 'number', label: 'eGFR', unit: 'mL/min/1.73 m²', min: 15, max: 140, step: 1 },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dm', type: 'check', label: 'Diabetes' },
    { id: 'smoker', type: 'check', label: 'Current smoker' },
    { id: 'bptx', type: 'check', label: 'Taking antihypertensive medication' },
    { id: 'statin', type: 'check', label: 'Taking a statin' }
  ],
  footnote: 'The equations were developed for ages 30 to 79 without known cardiovascular disease, total cholesterol 130 to 320 mg/dL, HDL 20 to 100 mg/dL, systolic BP 90 to 180 mm Hg, BMI 18.5 to 39.9 kg/m² and eGFR 15 to 140. Total CVD includes ASCVD (heart attack and stroke) and heart failure.',
  compute(a) {
    const r = risks(a), fmt = p => `${p.toFixed(1)}%`, long = a.age <= 59;
    const [, level, label] = ASCVD_BANDS.find(([max]) => r.ascvd10 < max);
    const rows = [['Total cardiovascular disease', 'cvd'], ['ASCVD (heart attack or stroke)', 'ascvd'], ['Heart failure', 'hf']]
      .map(([name, k]) => [name, fmt(r[`${k}10`]), long ? fmt(r[`${k}30`]) : '—']);
    return {
      level,
      headline: `10-year ASCVD risk: ${fmt(r.ascvd10)}`,
      lines: [`ASCVD risk category: ${label}`],
      table: { head: ['Risk of', '10 years', '30 years'], rows },
      note: long ? '30-year risk may be overestimated, because the models use age as the time scale.' : '30-year risk is given only for ages 30 to 59.'
    };
  },
  risks,
  evidence: {
    reference: 'Khan SS, Matsushita K, Sang Y, et al. Development and validation of the American Heart Association\'s PREVENT equations. Circulation. 2024;149(6):430-449.',
    pmid: '37947085',
    population: 'Derived in about 3.3 million US adults aged 30 to 79 without cardiovascular disease, from population-based and clinical data sets.',
    validation: 'Externally validated in about 3.3 million further US adults, with better calibration than the Pooled Cohort Equations.',
    prevalence: null, developed: null, validated: null,
    comment: 'ASCVD risk categories for lipid-lowering decisions (2026 ACC/AHA dyslipidemia guideline): low under 3%, borderline 3% to under 5%, intermediate 5% to under 10%, high 10% or more. Replaces the 2013 Pooled Cohort Equations (EE+ 510).'
  }
};
