// USPSTF A and B recommendations that apply to a person (rebuilt from the USPSTF list of A and B
// recommendations, accessed 2026-10-27). Replaces EE+ 291 (recommendations from about 2008) at Mark Ebell's
// request (2026-10-27). Each entry: [grade, recommendation, applies(a)].
const F = a => a.sex === 0, M = a => a.sex === 1, preg = a => F(a) && a.pregnant;
const smoker = a => a.smoking === 1, everSmoked = a => a.smoking > 0, between = (a, lo, hi) => a.age >= lo && a.age <= hi;
const RECS = [
  ['A', 'Cervical cancer screening: cytology every 3 years', a => F(a) && between(a, 21, 29)],
  ['A', 'Cervical cancer screening: cytology every 3 years, high-risk HPV testing every 5 years, or co-testing every 5 years', a => F(a) && between(a, 30, 65)],
  ['A', 'Colorectal cancer screening', a => between(a, 50, 75)],
  ['A', 'Folic acid 0.4 to 0.8 mg (400 to 800 µg) daily to prevent neural tube defects', a => F(a) && (a.couldConceive || a.pregnant)],
  ['A', 'Hepatitis B screening at the first prenatal visit', preg],
  ['A', 'HIV screening', a => between(a, 15, 65) || (a.stiRisk && a.age >= 12)],
  ['A', 'HIV screening (including in labor or at delivery if status is unknown)', preg],
  ['A', 'Hypertension screening with office blood pressure, confirmed outside the clinic before treatment', a => a.age >= 18],
  ['A', 'Ocular prophylaxis for gonococcal ophthalmia neonatorum', a => a.age === 0],
  ['A', 'Preexposure prophylaxis (PrEP) for those at increased risk of HIV', a => a.stiRisk && a.age >= 12],
  ['A', 'Rh(D) blood typing and antibody testing at the first pregnancy visit', preg],
  ['A', 'Syphilis screening early in pregnancy', preg],
  ['A', 'Syphilis screening for those at increased risk', a => a.stiRisk && a.age >= 12 && !a.pregnant],
  ['A', 'Tobacco cessation: ask, advise to quit, and provide behavioral support and FDA-approved medication', a => smoker(a) && a.age >= 18 && !a.pregnant],
  ['A', 'Tobacco cessation in pregnancy: ask, advise to quit, and provide behavioral support', a => smoker(a) && preg(a)],
  ['B', 'Abdominal aortic aneurysm: one-time ultrasound screening', a => M(a) && between(a, 65, 75) && everSmoked(a)],
  ['B', 'Anxiety screening', a => between(a, 8, 64)],
  ['B', 'Low-dose aspirin (81 mg/day) after 12 weeks of gestation to prevent preeclampsia', a => preg(a) && a.preeclampsiaRisk],
  ['B', 'Asymptomatic bacteriuria screening with urine culture', preg],
  ['B', 'BRCA risk assessment with a brief familial risk tool; genetic counseling and, if indicated, testing if positive', a => F(a) && a.brcaHistory],
  ['B', 'Offer breast cancer risk-reducing medication (tamoxifen, raloxifene or an aromatase inhibitor) if the risk of adverse effects is low', a => F(a) && a.age >= 35 && a.breastRisk],
  ['B', 'Breast cancer screening: mammography every 2 years', a => F(a) && between(a, 40, 74)],
  ['B', 'Breastfeeding support (provide or refer)', preg],
  ['B', 'Chlamydia and gonorrhea screening', a => F(a) && a.sexuallyActive && (a.age <= 24 || a.stiRisk)],
  ['B', 'Colorectal cancer screening', a => between(a, 45, 49)],
  ['B', 'Depression screening', a => a.age >= 12],
  ['B', 'Exercise interventions to prevent falls', a => a.age >= 65 && a.fallsRisk],
  ['B', 'Gestational diabetes screening at 24 weeks or later', preg],
  ['B', 'Behavioral counseling on healthy diet and physical activity', a => a.age >= 18 && a.cvdRisk],
  ['B', 'Behavioral counseling for healthy weight gain in pregnancy', preg],
  ['B', 'Hepatitis B screening', a => a.age >= 12 && a.hbvRisk && !a.pregnant],
  ['B', 'Hepatitis C screening', a => between(a, 18, 79)],
  ['B', 'Refer to comprehensive, intensive behavioral interventions for high BMI', a => between(a, 6, 17) && a.childBmi],
  ['B', 'Blood pressure measurement throughout pregnancy (hypertensive disorders of pregnancy)', preg],
  ['B', 'Intimate partner violence screening', a => F(a) && between(a, 15, 49)],
  ['B', 'Latent tuberculosis screening', a => a.age >= 18 && a.tbRisk],
  ['B', 'Lung cancer screening: annual low-dose CT', a => between(a, 50, 80) && a.packYears && (a.smoking === 1 || a.smoking === 2)],
  ['B', 'Osteoporosis screening', a => F(a) && (a.age >= 65 || (a.postmenopausal && a.osteoRisk))],
  ['B', 'Counseling interventions to prevent perinatal depression (provide or refer)', a => preg(a) && a.perinatalRisk],
  ['B', 'Prediabetes and type 2 diabetes screening; refer those with prediabetes to preventive interventions', a => between(a, 35, 70) && a.bmi > 0],
  ['B', 'Fluoride varnish to primary teeth from tooth eruption', a => a.age < 5],
  ['B', 'Oral fluoride supplements from 6 months (water supply low in fluoride)', a => a.age < 5 && a.lowFluoride],
  ['B', 'Repeat Rh(D) antibody testing at 24 to 28 weeks if unsensitized and Rh(D)-negative (unless the father is known to be Rh(D)-negative)', preg],
  ['B', 'Behavioral counseling to prevent sexually transmitted infections', a => a.age >= 12 && a.sexuallyActive && a.stiRisk],
  ['B', 'Counseling to minimize ultraviolet exposure (fair skin, 6 months to 24 years; also parents of young children)', a => a.age <= 24 && a.fairSkin],
  ['B', 'Statin for primary prevention of cardiovascular disease', a => between(a, 40, 75) && a.cvdRisk && a.cvd10],
  ['B', 'Education or brief counseling to prevent starting tobacco use', a => between(a, 5, 17) && a.smoking === 0],
  ['B', 'Unhealthy alcohol use screening, with brief counseling for risky drinking', a => a.age >= 18],
  ['B', 'Unhealthy drug use screening by asking questions', a => a.age >= 18],
  ['B', 'Vision screening at least once for amblyopia or its risk factors', a => between(a, 3, 5)],
  ['B', 'Intensive, multicomponent behavioral interventions for weight loss', a => a.age >= 18 && a.bmi === 2]
];
const adult = a => a.age >= 18;

module.exports = {
  id: 'uspstf-ab',
  eeId: 291,
  title: 'USPSTF A and B recommendations for a person',
  subtitle: 'Current USPSTF preventive services by age, sex and risk',
  question: 'Which current USPSTF A and B recommendations apply to this person?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years (0 for a newborn)', min: 0, max: 110, step: 1 },
    { id: 'sex', type: 'choice', label: 'Sex', options: [{ label: 'Female' }, { label: 'Male' }] },
    { id: 'smoking', type: 'choice', label: 'Smoking', options: [{ label: 'Never smoked' }, { label: 'Current smoker' }, { label: 'Former smoker, quit within the past 15 years' }, { label: 'Former smoker, quit 15 or more years ago' }] },
    { id: 'packYears', type: 'check', label: '20 or more pack-years of smoking', when: a => a.smoking > 0 && a.age >= 50 },
    { id: 'bmi', type: 'choice', label: 'BMI', when: adult, options: [{ label: 'Under 25' }, { label: '25 to 29.9 (overweight)' }, { label: '30 or more (obesity)' }] },
    { id: 'childBmi', type: 'check', label: 'BMI at or above the 95th percentile for age and sex', when: a => a.age >= 6 && a.age <= 17 },
    { type: 'heading', id: 'pregHead', label: 'Pregnancy and reproduction', when: a => a.sex === 0 && a.age >= 12 && a.age <= 55 },
    { id: 'pregnant', type: 'check', label: 'Pregnant', when: a => a.sex === 0 && a.age >= 12 && a.age <= 55 },
    { id: 'couldConceive', type: 'check', label: 'Planning or able to become pregnant', when: a => a.sex === 0 && a.age >= 12 && a.age <= 55 && !a.pregnant },
    { id: 'preeclampsiaRisk', type: 'check', label: 'High risk for preeclampsia', when: a => a.sex === 0 && a.pregnant },
    { id: 'perinatalRisk', type: 'check', label: 'Increased risk of perinatal depression', when: a => a.sex === 0 && a.pregnant },
    { type: 'heading', id: 'riskHead', label: 'Risk factors (check all that apply)', when: a => a.age >= 1 },
    { id: 'sexuallyActive', type: 'check', label: 'Sexually active', when: a => a.age >= 12 },
    { id: 'stiRisk', type: 'check', label: 'Increased risk for sexually transmitted infections or HIV', when: a => a.age >= 12 },
    { id: 'cvdRisk', type: 'check', label: 'Cardiovascular risk factor (dyslipidemia, diabetes, hypertension or smoking)', when: adult },
    { id: 'cvd10', type: 'check', label: '10-year cardiovascular risk 10% or more', when: a => a.age >= 40 && a.age <= 75 },
    { id: 'hbvRisk', type: 'check', label: 'Increased risk for hepatitis B', when: a => a.age >= 12 },
    { id: 'tbRisk', type: 'check', label: 'Increased risk for latent tuberculosis', when: adult },
    { id: 'brcaHistory', type: 'check', label: 'Personal or family history of breast, ovarian, tubal or peritoneal cancer, or ancestry linked to BRCA1/2 mutations', when: a => a.sex === 0 && a.age >= 18 },
    { id: 'breastRisk', type: 'check', label: 'Increased risk for breast cancer', when: a => a.sex === 0 && a.age >= 35 },
    { id: 'postmenopausal', type: 'check', label: 'Postmenopausal', when: a => a.sex === 0 && a.age >= 40 && a.age < 65 },
    { id: 'osteoRisk', type: 'check', label: 'At least one risk factor for osteoporosis', when: a => a.sex === 0 && a.age < 65 && a.postmenopausal },
    { id: 'fallsRisk', type: 'check', label: 'Increased risk for falls', when: a => a.age >= 65 },
    { id: 'fairSkin', type: 'check', label: 'Fair skin type', when: a => a.age <= 24 },
    { id: 'lowFluoride', type: 'check', label: 'Water supply low in fluoride', when: a => a.age < 5 }
  ],
  footnote: 'From the USPSTF list of A and B recommendations (checked October 2026). Recommendations change; see uspreventiveservicestaskforce.org for the full statements, intervals and definitions of increased risk.',
  compute(a) {
    const rows = RECS.filter(([, , applies]) => applies(a)).map(([grade, text]) => [text, grade]);
    return rows.length ? { headline: `${rows.length} USPSTF A or B recommendation${rows.length === 1 ? '' : 's'} apply`, table: { head: ['Recommendation', 'Grade'], rows } }
      : { headline: 'No USPSTF A or B recommendations apply to these answers' };
  },
  evidence: {
    reference: 'US Preventive Services Task Force. A and B recommendations. https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics/uspstf-a-and-b-recommendations (accessed October 27, 2026).',
    pmid: null,
    population: 'Asymptomatic people in primary care, as defined in each recommendation.',
    validation: 'Each recommendation is based on a systematic evidence review by the USPSTF.',
    prevalence: null, developed: null, validated: null,
    comment: 'Replaces EE+ 291, which listed recommendations from about 2008.'
  }
};
