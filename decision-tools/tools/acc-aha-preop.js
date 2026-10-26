// ACC/AHA perioperative cardiovascular evaluation for non-cardiac surgery, simplified algorithm
// (Eagle 2002 guideline update, as simplified in Am Fam Physician 2004; EE+ 314). Wording as in EE+.
const yesNo = [{ label: 'Yes' }, { label: 'No' }];

module.exports = {
  id: 'acc-aha-preop',
  eeId: 314,
  title: 'Pre-op cardiac evaluation (ACC/AHA 2002 algorithm)',
  subtitle: 'Stepwise cardiac evaluation before non-cardiac surgery',
  question: 'For a patient who needs non-cardiac surgery, what cardiac evaluation is needed first?',
  inputs: [
    { id: 'emergency', type: 'choice', label: 'Is it emergency surgery?', ee: 'EMERGENCY_SURGERY', options: yesNo },
    { id: 'recent', type: 'choice', label: 'Asymptomatic, with coronary revascularization within 5 years, or a recent favorable coronary angiogram or stress test?', ee: 'ASYMPTOMATIC_PATIENT', options: yesNo,
      when: a => a.emergency === 1 },
    { id: 'risk', type: 'choice', label: "Patient's cardiac risk (ACC clinical predictors or the Lee index)", ee: 'CARDIAC_RISK', when: a => a.emergency === 1 && a.recent === 1,
      options: [{ label: 'High risk' }, { label: 'Intermediate risk' }, { label: 'Low risk' }],
      note: 'High: unstable coronary syndrome, decompensated heart failure, significant arrhythmia or valvular disease, or Lee index class III or IV. Intermediate: mild angina, prior MI, compensated or prior heart failure, diabetes or renal insufficiency, or Lee index class II. Low: none of these and Lee index class I.' },
    { id: 'capacity', type: 'choice', label: 'Poor functional capacity (under 4 METs: unable to do light housework, climb a flight of stairs or walk up a hill)?', ee: 'CARDIAC_RISK_FOLLOWUP', options: yesNo,
      when: a => a.emergency === 1 && a.recent === 1 && a.risk !== 0 }
  ],
  footnote: 'High-risk surgery: emergency major operations, particularly in the elderly; aortic and other major vascular surgery, including peripheral vascular surgery; long procedures with large fluid shifts or blood loss.',
  compute(a) {
    if (a.emergency === 0) return { headline: 'To the operating room, with postoperative risk stratification and risk factor management.' };
    if (a.recent === 0) return { level: 1, headline: 'Clear for surgery.' };
    if (a.risk === 0) return { level: 4, headline: 'Consider delay or cancellation of surgery with medical management and risk factor modification; consider coronary angiography.' };
    const intermediate = a.risk === 1, poor = a.capacity === 0;
    if (intermediate && poor) return { level: 3, headline: 'Clear for surgery if undergoing low-risk surgery; otherwise non-invasive testing.' };
    if (intermediate || poor) return { level: 2, headline: 'Non-invasive testing if undergoing high-risk surgery; otherwise clear for surgery.' };
    return { level: 1, headline: 'Clear for surgery.' };
  },
  evidence: {
    reference: 'Eagle KA, Berger PB, Calkins H, et al. ACC/AHA guideline update for perioperative cardiovascular evaluation for noncardiac surgery: executive summary. Circulation. 2002;105(10):1257-1267.',
    comment: 'Consensus guideline, simplified as in "Preoperative evaluation for noncardiac surgery" (Am Fam Physician, April 15, 2004). Later guidelines (2014 ACC/AHA; 2024 AHA/ACC) replaced this algorithm.'
  }
};
