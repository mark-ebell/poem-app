"""The 10 algorithm images whose chapters had no algorithm, drawn as app algorithms (2026-11)."""
from alg import alg, write
C = 'Drawn from the figure image; the chapter had no algorithm. 2026-11.'
OTHER = 'Search for other pathogens, complications, other sites of infection, or other diagnoses.'

write('eee0841', [alg('eee0841-1', 'Management of ventilator-associated pneumonia', [
    ('Clinical suspicion of ventilator-associated pneumonia. Obtain lower respiratory tract cultures. Potential for multidrug-resistant (MDR) pathogens (see Table 2)?', [('No', 2), ('Yes', 3)]),
    ('Focused antibiotic therapy: ceftriaxone, levofloxacin, moxifloxacin, ampicillin/sulbactam, or ertapenem.', [('', 4)]),
    ('Broad-spectrum antibiotic therapy: antipseudomonal cephalosporin, carbapenem, or beta-lactam/beta-lactamase inhibitor, plus a fluoroquinolone or aminoglycoside, plus vancomycin or linezolid for MRSA.', [('', 4)]),
    ('Day 2 and 3: check cultures and assess clinical response (temperature, WBC, chest x-ray, purulent sputum, oxygenation, hemodynamic changes, and organ function). Clinical improvement at 48-72 hours?', [
        ('No; culture negative', OTHER), ('No; culture positive', 'Adjust antibiotics. ' + OTHER),
        ('Yes; culture negative', 'Consider stopping the antibiotics.'),
        ('Yes; culture positive', 'De-escalate antibiotics if possible; treat for 7-8 days, except patients with Pseudomonas aeruginosa.')]),
], graphic='eee0841-w0001.gif')], C)

write('eee0703', [alg('eee0703-1', 'Suggested treatment approach to the patient with osteoarthritis', [
    ('First-line treatments: full-dose acetaminophen, topical therapies, exercise, tai chi, knee taping, physical therapy.', [('Not adequate', 2)]),
    ('Second-line treatments: nonsteroidal anti-inflammatory drugs.', [('Not adequate', 3)]),
    ('Third-line treatments: tramadol or duloxetine (Cymbalta).', [('Not adequate', 4)]),
    ('Fourth-line treatments: carefully supervised opiates (50 mg of hydrocodone or 30 mg of oxycodone per day or less); joint replacement in patients with moderate to severe pain and moderate to severe radiographic evidence of osteoarthritis.', []),
], graphic='eee0703-w0001.gif')], C)

write('eee0416', [alg('eee0416-1', 'Evaluation of suspected transverse myelitis (TM)', [
    ('Myelopathy?', [('No', 'Not TM.'), ('Yes', 2)]),
    ('MRI of the spine at the level of injury to rule out compression.', [
        ('Compression present', 'Not TM; consult neurology and neurosurgery.'), ('No compression', 3)]),
    ('Lumbar puncture.', [
        ('Infection present', 'Not TM.'),
        ('No infection, no evidence of connective tissue disease or hematologic malignancy', 'TM possible; consult neurology if not done.')]),
], graphic='eee0416-w0001.gif')], C)

write('eee0423', [alg('eee0423-1', 'Sideline Algorithm for Suspected Head Injury in Athletes', [
    ('Signs or symptoms of concussion. Abnormal neurologic examination?', [
        ('Yes', 'Consider advanced imaging per CT head and C-spine clinical decision tools.'), ('No', 2)]),
    ('Sideline concussion evaluation.', [('', 3)]),
    ('Interval reevaluation.', [('', 4)]),
    ('24-48 hour rest.', [('', 5)]),
    ('Return to play protocol (Table 3).', []),
], graphic='EE concussion table.GIF')], C.replace('the chapter had no algorithm', "the chapter's algorithm had no boxes") + ' eee0423-w0001.gif is an older version and is not used.')

write('eee0655', [alg('eee0655-1', 'Evaluation of the child with urinary tract infection for vesicoureteral reflux', [
    ('Child with UTI. Over 2 years of age?', [('Yes', 2), ('No', 4)]),
    ('Sex?', [('Female', 3), ('Male', 4)]),
    ('Febrile?', [('Yes', 4), ('No', 'Antibiotics and observation.')]),
    ('Antibiotics, ultrasound and/or DMSA scan. VCUG when infection is resolved. VCUG results?', [
        ('Normal', 'Routine care.'), ('Reflux', 'Urine cultures every 3-4 months; repeat VCUG every 2-3 years.')]),
], graphic='eee0655-w001.gif')], C)

ROUTINE = ('Obtain routine laboratory studies: complete blood count (CBC), blood culture; urinalysis (UA) and urine culture (catheterized or suprapubic tap); '
           'cerebrospinal fluid (CSF) culture and CSF studies (cell count, glucose, protein). Additional studies if applicable: if tachypnea, chest x-ray (CXR); '
           'if diarrhea, stool smear and culture. Give empiric antibiotics (Table 2). Hospitalize and observe until cultures remain negative for 24-36 hours. '
           'Consider herpes simplex virus for infants <28 days.')
EMPIRIC = 'Give empiric antibiotics (Table 2) and hospitalize until cultures are negative for 24-36 hours.'
write('eee0575', [alg('eee0575-1', 'Evaluation of fever in infants up to 60 days of age', [
    ('Evaluation of fever in infants up to 60 days of age. Focal infection?', [('Focal infection', 'Treat focal infection.'), ('No focal infection', 2)]),
    ('Well appearing (interactive, good perfusion, no respiratory distress or lethargy)?', [('Yes', 3), ('No', 7)]),
    ('Age?', [('22-60 days', 4), ('<22 days', 7)]),
    ('Order lab studies: CBC, blood culture; UA and urine culture (catheterized or suprapubic tap). If not low risk (see Table 1), consider CSF culture and CSF studies. Additional studies if applicable: if tachypnea, CXR; if diarrhea, stool smear and culture.', [('', 5)]),
    ('CSF pleocytosis? If CSF not obtained, is the infant <29 days?', [('Yes', 8), ('No', 6)]),
    ('Secure follow-up within 12-24 hours (family and physician agreement)?', [
        ('Yes', 'Two options: (1) give IV/IM antibiotics (see Table 2) and observe at home, reassessing in 24 hours; or (2) give IV/IM antibiotics (see Table 2) and observe in the hospital.'),
        ('No', 8)]),
    (ROUTINE, [('', 'Manage according to laboratory results, study results, and clinical course.')]),
    (EMPIRIC, []),
], graphic='eee0575-w0001.gif')], C)

write('eee0831', [alg('eee0831-1', 'Intrapartum antibiotic prophylaxis for group B streptococcus (GBS)', [
    ('Positive GBS culture at 35-37 weeks\' gestation. Penicillin allergic?', [
        ('No', 'Penicillin G 5 million U load, then 2.5 million U every 4 hours, OR ampicillin 2 g IV load, then 1 g IV every 4 hours until delivery.'), ('Yes', 2)]),
    ('High risk for anaphylaxis?', [('No', 'Cefazolin 2 g IV initial dose, then 1 g every 8 hours until delivery.'), ('Yes', 3)]),
    ('GBS resistant to clindamycin or erythromycin, or sensitivity unknown?', [
        ('Yes', 'Vancomycin 1 g every 12 hours until delivery.'),
        ('No', 'Check sensitivities and start clindamycin 900 mg IV every 8 hours until delivery OR erythromycin 500 mg every 6 hours until delivery.')]),
], notes=['Adapted from Morin CA, White K, Schuchat A, Danila RN, Lynfield R. Perinatal group B streptococcal disease prevention, Minnesota. Emerg Infect Dis. 2005;11:1467-9.'],
   graphic='eee0831-w001.gif')], C + ' The image has the Yes/No arrows from "Penicillin allergic?" swapped; corrected here.')

write('eee0715', [alg('eee0715-1', 'Initial management of systemic lupus erythematosus', [
    ('Is the disease clinically unstable, or does it appear to have life-threatening complications?', [('Yes', 6), ('No', 2)]),
    ('Do the following organ systems have normal and stable function: renal, skin, joints, hematologic, pulmonary, cardiovascular, gastrointestinal, central nervous system?', [('Yes', 3), ('No', 6)]),
    ('Are the therapies being considered associated with significant toxicity?', [('Yes', 6), ('No', 4)]),
    ('General treatment: patient education; analgesics as needed; NSAIDs as needed; topical steroids for rash; topical sunscreens (minimum sun protection factor 15).', [('', 5)]),
    ('If the patient has diminished quality of life (constitutional symptoms, inadequate analgesia, etc.), consider an antimalarial (eg, hydroxychloroquine 200-400 mg/day) or low-dose corticosteroid (not to exceed 10 mg/day prednisone or equivalent).', [('Not controlled', 6)]),
    ('Refer to rheumatologist.', []),
], graphic='eee0715-w0001.gif')], C)

write('eee0666', [alg('eee0666-1', 'Management of bronchiolitis in infants', [
    ('History, physical, and respiratory assessment. Toxic or in severe respiratory distress?', [('Yes', 'Treat emergently.'), ('No', 2)]),
    ('Suction, assess respiratory status, and start O2 if SaO2 is consistently 91% or less. Medication trial desired?', [('Yes', 3), ('No', 4)]),
    ('Single-dose trial with epinephrine or albuterol. If improved, consider repeated inhalations.', [('', 5)]),
    ('Manage without medications (nasal suctioning, oxygen, monitoring).', [('', 5)]),
    ('Period of observation. Ready for discharge (RR <70, room air, oral feedings, family can provide care and monitoring, follow-up scheduled)?', [
        ('Yes', 'Discharge home with parent education and primary care physician follow-up.'),
        ('No', 'Monitor until ready for discharge, or admit. If admitted, consider cardiopulmonary monitoring, frequent respiratory and SaO2 checks, and suction before feeding and as needed.')]),
], notes=['Adapted from Evidence Based Clinical Practice Guideline for Infants with Bronchiolitis. 2006 Cincinnati Children\'s Hospital Medical Center. Page 7.'],
   graphic='eee0666-w0001.gif')], C)

HCC = 'Hepatocellular carcinoma.'
write('eee0489', [alg('eee0489-1', 'Surveillance and evaluation of liver nodules in patients with hepatitis B or cirrhosis', [
    ('Patients with known hepatitis B or cirrhosis: ultrasound every 6 months. Nodule detected?', [
        ('No nodules', 'Repeat ultrasound in 6 months. Consider CT if alpha-fetoprotein (AFP) is increased or rising.'),
        ('<1-cm nodule', 2), ('1-2-cm nodule', 3), ('>2-cm nodule', 4)]),
    ('Repeat ultrasound and AFP every 3-4 months.', [
        ('Increase in size', 'Proceed according to size of nodule.'), ('Stable for 12 to 18 months', 'Ultrasound every 6 months.')]),
    ('Typical vascular pattern (a) seen on two coincident imaging techniques (b)?', [('Yes', HCC), ('No', 5)]),
    ('AFP >200 ng/mL and typical vascular pattern (a) seen on one imaging technique (b), OR typical vascular pattern seen on two coincident imaging techniques?', [('Yes', HCC), ('No', 5)]),
    ('Liver biopsy.', [('Positive', HCC), ('Nondiagnostic or alternate diagnosis', 'Repeat CT or MRI every 3-4 months.')]),
], notes=['(a) Typical vascular pattern: the lesion is hypervascular in the arterial phase and washes out in the portal/venous phase. All other patterns are considered atypical.',
          '(b) Imaging techniques include ultrasound, CT, MRI, or hepatic arteriogram.',
          'Adapted from Bruix J, Sherman M. AASLD Practice Guideline: Management of Hepatocellular Carcinoma. Hepatology 2005;42:1208-1236.'],
   graphic='eee0489-w001.gif')], C)
print('written')
