// NCI Breast Cancer Risk Assessment Tool (BCRAT, the Gail model as updated by the NCI). Replaces EE+ 40 (an
// interpolation of the 1989 Gail tables) at Mark Ebell's request (2026-10-27). Port of the BCRA R package
// (version 2.1.2, CRAN): recode.check, relative.risk and absolute.risk, with its constants.
//
// Race codes as in the package: 1 White, 2 African American, 3 Hispanic (US born), 4 Other (American Indian or
// Alaska Native, or unknown; uses White rates), 5 Hispanic (foreign born), 6 Chinese, 7 Japanese, 8 Filipino,
// 9 Hawaiian, 10 Other Pacific Islander, 11 Other Asian.
const L1 = {
  1: [0.00001000, 0.00007600, 0.00026600, 0.00066100, 0.00126500, 0.00186600, 0.00221100, 0.00272100, 0.00334800, 0.00392300, 0.00417800, 0.00443900, 0.00442100, 0.00410900],
  2: [0.00002696, 0.00011295, 0.00031094, 0.00067639, 0.00119444, 0.00187394, 0.00241504, 0.00291112, 0.00310127, 0.00366560, 0.00393132, 0.00408951, 0.00396793, 0.00363712],
  3: [0.0000166, 0.0000741, 0.0002740, 0.0006099, 0.0012225, 0.0019027, 0.0023142, 0.0028357, 0.0031144, 0.0030794, 0.0033344, 0.0035082, 0.0025308, 0.0020414],
  5: [0.0000102, 0.0000531, 0.0001578, 0.0003602, 0.0007617, 0.0011599, 0.0014111, 0.0017245, 0.0020619, 0.0023603, 0.0025575, 0.0028227, 0.0028295, 0.0025868],
  6: [0.000004059636, 0.000045944465, 0.000188279352, 0.000492930493, 0.000913603501, 0.001471537353, 0.001421275482, 0.001970946494, 0.001674745804, 0.001821581075, 0.001834477198, 0.001919911972, 0.002233371071, 0.002247315779],
  7: [0.000000000001, 0.000099483924, 0.000287041681, 0.000545285759, 0.001152211095, 0.001859245108, 0.002606291272, 0.003221751682, 0.004006961859, 0.003521715275, 0.003593038294, 0.003589303081, 0.003538507159, 0.002051572909],
  8: [0.000007500161, 0.000081073945, 0.000227492565, 0.000549786433, 0.001129400541, 0.001813873795, 0.002223665639, 0.002680309266, 0.002891219230, 0.002534421279, 0.002457159409, 0.002286616920, 0.001814802825, 0.001750879130],
  9: [0.000045080582, 0.000098570724, 0.000339970860, 0.000852591429, 0.001668562761, 0.002552703284, 0.003321774046, 0.005373001776, 0.005237808549, 0.005581732512, 0.005677419355, 0.006513409962, 0.003889457523, 0.002949061662],
  10: [0.000000000001, 0.000071525212, 0.000288799028, 0.000602250698, 0.000755579402, 0.000766406354, 0.001893124938, 0.002365580107, 0.002843933070, 0.002920921732, 0.002330395655, 0.002036291235, 0.001482683983, 0.001012248203],
  11: [0.000012355409, 0.000059526456, 0.000184320831, 0.000454677273, 0.000791265338, 0.001048462801, 0.001372467817, 0.001495473711, 0.001646746198, 0.001478363563, 0.001216010125, 0.001067663700, 0.001376104012, 0.000661576644]
};
L1[4] = L1[1];
const L2 = {
  1: [0.00049300, 0.00053100, 0.00062500, 0.00082500, 0.00130700, 0.00218100, 0.00365500, 0.00585200, 0.00943900, 0.01502800, 0.02383900, 0.03883200, 0.06682800, 0.14490800],
  2: [0.00074354, 0.00101698, 0.00145937, 0.00215933, 0.00315077, 0.00448779, 0.00632281, 0.00963037, 0.01471818, 0.02116304, 0.03266035, 0.04564087, 0.06835185, 0.13271262],
  3: [0.0003561, 0.0004038, 0.0005281, 0.0008875, 0.0013987, 0.0020769, 0.0030912, 0.0046960, 0.0076050, 0.0120555, 0.0193805, 0.0288386, 0.0429634, 0.0740349],
  5: [0.0003129, 0.0002908, 0.0003515, 0.0004943, 0.0007807, 0.0012840, 0.0020325, 0.0034533, 0.0058674, 0.0096888, 0.0154429, 0.0254675, 0.0448037, 0.1125678],
  6: [0.000210649076, 0.000192644865, 0.000244435215, 0.000317895949, 0.000473261994, 0.000800271380, 0.001217480226, 0.002099836508, 0.003436889186, 0.006097405623, 0.010664526765, 0.020148678452, 0.037990796590, 0.098333900733],
  7: [0.000173593803, 0.000295805882, 0.000228322534, 0.000363242389, 0.000590633044, 0.001086079485, 0.001859999966, 0.003216600974, 0.004719402141, 0.008535331402, 0.012433511681, 0.020230197885, 0.037725498348, 0.106149118663],
  8: [0.000229120979, 0.000262988494, 0.000314844090, 0.000394471908, 0.000647622610, 0.001170202327, 0.001809380379, 0.002614170568, 0.004483330681, 0.007393665092, 0.012233059675, 0.021127058106, 0.037936954809, 0.085138518334],
  9: [0.000563507269, 0.000369640217, 0.001019912579, 0.001234013911, 0.002098344078, 0.002982934175, 0.005402445702, 0.009591474245, 0.016315472607, 0.020152229069, 0.027354838710, 0.050446998723, 0.072262026612, 0.145844504021],
  10: [0.000465500812, 0.000600466920, 0.000851057138, 0.001478265376, 0.001931486788, 0.003866623959, 0.004924932309, 0.008177071806, 0.008638202890, 0.018974658371, 0.029257567105, 0.038408980974, 0.052869579345, 0.074745721133],
  11: [0.000212632332, 0.000242170741, 0.000301552711, 0.000369053354, 0.000543002943, 0.000893862331, 0.001515172239, 0.002574669551, 0.004324370426, 0.007419621918, 0.013251765130, 0.022291427490, 0.041746550635, 0.087485802065]
};
L2[4] = L2[1];
// Rates for the "average" White or Other woman (SEER and NCHS 1992-96), used for the comparison risk.
const AVG_L1 = [0.00001220, 0.00007410, 0.00022970, 0.00056490, 0.00116450, 0.00195250, 0.00261540, 0.00302790, 0.00367570, 0.00420290, 0.00473080, 0.00494250, 0.00479760, 0.00401060];
const AVG_L2 = [0.00044120, 0.00052540, 0.00067460, 0.00090920, 0.00125340, 0.00195700, 0.00329840, 0.00546220, 0.00910350, 0.01418540, 0.02259350, 0.03611460, 0.06136260, 0.14206630];
const WHITE_BETA = [0.5292641686, 0.0940103059, 0.2186262218, 0.9583027845, -0.2880424830, -0.1908113865];
const ASIAN_BETA = [0.55263612260619, 0.07499257592975, 0.27638268294593, 0.79185633720481, 0, 0];
const BETA = { 1: WHITE_BETA, 2: [0.1822121131, 0.2672530336, 0, 0.4757242578, -0.1119411682, 0], 3: [0.0970783641, 0, 0.2318368334, 0.166685441, 0, 0], 4: WHITE_BETA,
  5: [0.4798624017, 0.2593922322, 0.4669246218, 0.9076679727, 0, 0], 6: ASIAN_BETA, 7: ASIAN_BETA, 8: ASIAN_BETA, 9: ASIAN_BETA, 10: ASIAN_BETA, 11: ASIAN_BETA };
const ASIAN_AR = [0.47519806426735, 0.50316401683903];
const ONE_AR = { 1: [0.5788413, 0.5788413], 2: [0.72949880, 0.74397137], 3: [0.749294788397, 0.778215491668], 4: [0.5788413, 0.5788413], 5: [0.428864989813, 0.450352338746],
  6: ASIAN_AR, 7: ASIAN_AR, 8: ASIAN_AR, 9: ASIAN_AR, 10: ASIAN_AR, 11: ASIAN_AR };

const RACES = [[1, 'White'], [2, 'Black or African American'], [3, 'Hispanic or Latina, born in the US'], [5, 'Hispanic or Latina, born outside the US'], [6, 'Chinese'], [7, 'Japanese'],
  [8, 'Filipina'], [9, 'Native Hawaiian'], [10, 'Other Pacific Islander'], [11, 'Other Asian'], [4, 'American Indian or Alaska Native, or unknown']];

// Relative-risk categories, recoded by race as in recode.check.
function categories(a, race) {
  let nb = a.biopsies === 0 ? 0 : a.biopsies === 1 ? 1 : a.biopsies === 2 ? 2 : 0; // 3 = unknown
  const rHyp = nb === 0 ? 1 : [0.93, 1.82, 1][a.hyperplasia];
  let am = [0, 1, 2, 0][a.menarche]; // 14 or older, 12 to 13, under 12, unknown
  let af = [3, 2, 1, 0, 2, 0][a.firstBirth]; // 30 or older, 25 to 29, 20 to 24, under 20, no births, unknown
  let nr = [0, 1, 2, 0][a.relatives];
  if (race === 2) { af = 0; if (am === 2) am = 1; }
  if (race === 3 || race === 5) {
    if (nb === 2) nb = 1;
    if (a.firstBirth !== 4 && af === 2) af = 1;
    if (af === 3) af = 2;
    if (nr === 2) nr = 1;
  }
  if (race === 3) am = 0;
  if (race >= 6 && nr === 2) nr = 1;
  return { nb, am, af, nr, rHyp };
}

// Absolute risk (%) from age t1 to t2, as in absolute.risk (whole-year ages).
function absRisk(race, t1, t2, rr1, rr2, average) {
  const l1 = average && (race === 1 || race === 4) ? AVG_L1 : L1[race], l2 = average && (race === 1 || race === 4) ? AVG_L2 : L2[race];
  let risk = 0, cum = 0;
  for (let age = t1; age < t2; age++) {
    const k = Math.floor((age - 20) / 5), oneArRr = average ? 1 : age < 50 ? ONE_AR[race][0] * rr1 : ONE_AR[race][1] * rr2;
    const lam = l1[k] * oneArRr + l2[k];
    risk += (oneArRr * l1[k] / lam) * Math.exp(-cum) * (1 - Math.exp(-lam));
    cum += lam;
  }
  return 100 * risk;
}

function bcrat(a) {
  const race = RACES[a.race][0], b = BETA[race], c = categories(a, race);
  const lp1 = c.nb * b[0] + c.am * b[1] + c.af * b[2] + c.nr * b[3] + c.af * c.nr * b[5] + Math.log(c.rHyp), lp2 = lp1 + c.nb * b[4];
  const rr1 = Math.exp(lp1), rr2 = Math.exp(lp2);
  return { five: absRisk(race, a.age, a.age + 5, rr1, rr2), life: absRisk(race, a.age, 90, rr1, rr2),
    avgFive: absRisk(race, a.age, a.age + 5, 1, 1, true), avgLife: absRisk(race, a.age, 90, 1, 1, true) };
}

module.exports = {
  id: 'bcrat',
  eeId: 40,
  title: 'Breast cancer risk (NCI BCRAT / Gail model)',
  subtitle: '5-year and lifetime risk of invasive breast cancer',
  question: 'For a woman 35 to 85 without a history of breast cancer, DCIS or LCIS, what is her risk of invasive breast cancer over the next 5 years and to age 90?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 35, max: 85, step: 1 },
    { id: 'race', type: 'choice', label: 'Race or ethnicity', options: RACES.map(([, label]) => ({ label })) },
    { id: 'menarche', type: 'choice', label: 'Age at first menstrual period', options: [{ label: '14 or older' }, { label: '12 to 13' }, { label: '7 to 11' }, { label: 'Unknown' }] },
    { id: 'firstBirth', type: 'choice', label: 'Age at first live birth', options: [{ label: '30 or older' }, { label: '25 to 29' }, { label: '20 to 24' }, { label: 'Under 20' }, { label: 'No births' }, { label: 'Unknown' }] },
    { id: 'relatives', type: 'choice', label: 'First-degree relatives (mother, sisters, daughters) with breast cancer', options: [{ label: 'None' }, { label: '1' }, { label: '2 or more' }, { label: 'Unknown' }] },
    { id: 'biopsies', type: 'choice', label: 'Breast biopsies (with a benign result)', options: [{ label: 'None' }, { label: '1' }, { label: '2 or more' }, { label: 'Unknown' }] },
    { id: 'hyperplasia', type: 'choice', label: 'Atypical hyperplasia on any biopsy', when: a => a.biopsies === 1 || a.biopsies === 2, options: [{ label: 'No' }, { label: 'Yes' }, { label: 'Unknown' }] }
  ],
  footnote: 'Not for women with a history of breast cancer, DCIS or LCIS, chest radiation for Hodgkin lymphoma, or a BRCA1 or BRCA2 mutation (or a syndrome linked to breast cancer). A 5-year risk of 1.67% or more is the threshold used in prevention trials. "Average" compares a woman of the same age and race or ethnicity with no risk factors.',
  compute(a) {
    const r = bcrat(a), pct = v => `${v.toFixed(1)}%`;
    return { level: r.five >= 1.67 ? 3 : 1, headline: `5-year risk of invasive breast cancer: ${pct(r.five)}`,
      table: { head: ['Risk', 'This woman', 'Average woman'], rows: [['5-year', pct(r.five), pct(r.avgFive)], ['Lifetime (to age 90)', pct(r.life), pct(r.avgLife)]] } };
  },
  bcrat,
  evidence: {
    reference: 'Gail MH, Brinton LA, Byar DP, et al. Projecting individualized probabilities of developing breast cancer for white females who are being examined annually. J Natl Cancer Inst. 1989;81(24):1879-1886. Updated by the NCI for African American (Gail 2007), Asian and Pacific Islander (Matsuno 2011) and Hispanic (Banegas 2016) women.',
    pmid: '2593165',
    population: 'Derived in the Breast Cancer Detection Demonstration Project (white women), with race-specific models from the CARE, Asian American and San Francisco Bay Area Breast Cancer studies, and SEER incidence and NCHS mortality rates.',
    validation: 'Well calibrated in US white women (expected to observed ratio about 1.0 in the NSABP Breast Cancer Prevention Trial; Costantino 1999), with modest discrimination (concordance about 0.6).',
    prevalence: null, developed: null, validated: null,
    comment: 'Calculation as in the NCI Breast Cancer Risk Assessment Tool and the BCRA R package (version 2.1.2). Replaces EE+ 40, which interpolated the 1989 Gail tables.'
  }
};
