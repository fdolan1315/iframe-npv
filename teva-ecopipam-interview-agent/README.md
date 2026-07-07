# Teva / Ecopipam ABD Interview-Prep Agent

A complete build kit for an **ElevenLabs voice agent** that mock-interviews you for the **Area Business Director (ABD), East** role at Teva, supporting the launch of **ecopipam** (first-in-class dopamine D1 antagonist) for **pediatric Tourette syndrome** — and coaches you on your answers.

Everything here is source material and configuration you paste into ElevenLabs. There's no code to run.

---

## What's in the box

```
teva-ecopipam-interview-agent/
├── README.md                                    ← you are here (build guide)
├── 01-knowledge-base/                           ← upload these to the agent's Knowledge Base
│   ├── 01-ecopipam-and-clinical-landscape.md    ← the disease, guidelines, the drug, objection-handling
│   ├── 02-competitive-landscape-and-market-access.md ← competitors, pipeline, devices, payer/access
│   ├── 03-epidemiology-and-eastern-coe-map.md   ← prevalence + your Eastern-US target institutions
│   └── 04-teva-strategy-and-the-abd-role.md     ← Pivot to Growth, portfolio, values, JD language, interview style
├── 02-agent-config/                             ← the agent brains
│   ├── interviewer-agent-system-prompt.md       ← the interviewer persona + STAR question bank + probes
│   ├── coach-agent-system-prompt.md             ← the three-phase feedback coach
│   └── evaluation-criteria-and-data-collection.md ← post-call scorecard config
└── 03-your-inputs/                              ← the parts only you can supply
    ├── README-your-inputs.md
    └── your-star-story-bank-TEMPLATE.md
```

---

## The design in one paragraph

Two agents, one conversation. The **Interviewer** ("Morgan") runs a realistic DDI/STAR behavioral interview, asks one question at a time, and **probes like a trained interviewer** when your STAR is incomplete — but never coaches mid-interview. When you say **"coach me"** or **"let's debrief,"** the platform's agent-transfer hands off to the **Coach** ("Riley"), who gives feedback in your **three phases: (1) timing & delivery, (2) content & sequencing, (3) how to make it better** — then hands back so you can run it again. After every session, the platform's post-call analysis produces a **structured scorecard** so you can track improvement.

This mirrors exactly what you asked for: a mode you switch on by voice; feedback anchored to the standard pharma STAR interview guide; and explicit attention to **idea sequencing** as a scored dimension, not just content.

---

## Build steps (≈30–45 min in the ElevenLabs dashboard)

> Reference: ElevenLabs **Agents Platform** docs. Menu names may shift slightly as the product evolves.

### 1. Create the Interviewer agent
1. ElevenLabs → **Agents** → **Create agent** (blank template). Name it `Teva ABD — Interviewer`.
2. **System prompt:** paste the `SYSTEM PROMPT` block from `02-agent-config/interviewer-agent-system-prompt.md`.
3. **First message:** paste the `FIRST MESSAGE` block from the same file.
4. **LLM:** a fast, strong instruction-following model is fine for the interviewer.
5. **Voice:** pick a warm, professional voice (senior hiring leader).
6. **Knowledge base:** upload all four `01-knowledge-base/*.md` files, plus your inputs from step 3 below.

### 2. Create the Coach agent
1. Create a second agent named `Teva ABD — Coach`.
2. **System prompt:** paste the `SYSTEM PROMPT` block from `02-agent-config/coach-agent-system-prompt.md`.
3. **First message:** paste the coach's `FIRST MESSAGE` block.
4. **LLM:** use your **best** available model here — judging sequencing and rewriting answers is the hardest task in the system.
5. **Knowledge base:** attach the same four knowledge-base files + your inputs (so the coach can fact-check market answers and reference your stories).

### 3. Wire up the transfer (mode switching)
1. On the **Interviewer**, add the **`transfer_to_agent`** system tool → target the **Coach**. Trigger phrases: "coach me," "feedback," "how did I do," "let's debrief."
2. On the **Coach**, add a `transfer_to_agent` tool back to the **Interviewer**. Triggers: "next question," "back to the interview," "let's keep going," "run it again."
3. (Optional, cleaner) Use the platform's **Workflows** to model this as two nodes with transfer edges instead of standalone tools — either works.

### 4. Add your personal inputs (see `03-your-inputs/`)
1. Upload **your resume**.
2. Fill in and upload **`your-star-story-bank-TEMPLATE.md`** (rename it, drop the `-TEMPLATE`). This is the single highest-leverage thing you can do.
3. Upload the **actual job posting** once you have it.

### 5. Configure the post-call scorecard
1. On the **Interviewer** (the entry agent — the evaluator sees the whole transcript including the coaching), open the **Analysis** tab.
2. Add the **Evaluation criteria** and **Data collection** items from `02-agent-config/evaluation-criteria-and-data-collection.md`.

### 6. Test it
1. Start a voice conversation. Answer the opener.
2. Let Morgan ask 2–3 questions and probe you.
3. Say **"coach me"** → Riley debriefs in three phases.
4. Say **"next question"** → back to Morgan.
5. End the call → check the **post-call analysis** for your scorecard.

---

## How to actually practice (getting value out of it)

- **Two modes, both built in:** for **drill mode**, answer one question, immediately say "coach me," fix it, and re-run the same question. For **realistic-simulation mode**, do a full 20–30 minute interview and only debrief at the end.
- **Chase the sequencing score.** Content is usually the easy part; the score that moves you from "good" to "hired" is delivering the *same* content headline-first, in the order the interviewer's brain wants it. Watch that number across sessions.
- **Run your two must-have stories cold** (the launch story and the pre-approval compliance story — see the story-bank template). These are what this specific role tests hardest.
- **Review the audio for tone.** The agent judges your transcript, not your voice — so for energy/confidence, listen back to the recording yourself (see limitation below).

---

## Honest limitations (so you build with eyes open)

1. **Delivery feedback is transcript-based.** The coach can assess answer **length, structure, hesitation, and filler words**, but it does **not hear your voice** — it can't directly judge tone, energy, or confidence. Workaround: review the session recording yourself.
2. **Knowledge-base cap.** Non-enterprise accounts allow ~**20 MB / 300k characters**. These docs are well within it; add your resume, JD, and stories freely.
3. **Keep instructions in the system prompt, facts in the knowledge base.** RAG retrieval is unreliable for behavioral instructions — that's why the question bank, probe logic, and rubric live in the prompts, and only reference facts live in the knowledge base.
4. **Some figures need a final primary-source check.** The research was thorough but a few items were flagged for confirmation before any *customer-facing* use: the live TAA Center-of-Excellence roster, ecopipam's exact WAC (not yet set) and any Rare-Pediatric-Disease/PRV status (unconfirmed), and precise Phase 3 secondary-endpoint deltas from the JAMA Neurology paper. For *interview prep* the current numbers are more than solid.

---

## Fastest facts to have cold (walking-in cheat sheet)

- **Drug:** ecopipam — first-in-class selective **dopamine D1 antagonist**, **non-antipsychotic**. Teva acquired **Emalex** (~$700M upfront / up to ~$900M). **NDA filed June 18, 2026**; likely approval ~2027 → **this is a pre-launch build year.**
- **Data:** Phase 3 **D1AMOND** (n=216, randomized-withdrawal, *JAMA Neurology* 2026): pediatric relapse **HR ~0.5, P=.008**; **weight-neutral, no EPS/metabolic signals**; AEs somnolence/anxiety/headache/insomnia.
- **Market:** ~174k diagnosed US pediatric patients (~half undiagnosed); boys ~3:1; peak severity age 10–12.
- **Competition = mostly not a drug:** watchful waiting, **CBIT** (first-line, access-limited), cheap generic **alpha-2 agonists** and **aripiprazole**; VMAT2s (incl. Teva's own Austedo) **failed** pediatric TS.
- **Teva:** **"Pivot to Growth"** (4 pillars), neuroscience spearhead (**Austedo, Uzedy, Ajovy**), value phrases like **"all in for better health," "Accountability," "Getting it Done."** ABD = **second-line, "general management approach," "coaching Managers and Senior Managers."**
- **Access:** premium orphan drug vs penny generics → heavy **Medicaid/CHIP (~half of peds)**, **prior auth / step therapy**, specialty distribution, **Teva Shared Solutions** hub; copay cards can't touch government-insured patients (AKS).
- **Your Eastern map:** TAA **Centers of Excellence** — Kennedy Krieger/Johns Hopkins, Yale, MGH, Mount Sinai, NYU, Rochester, Emory, UF Fixel, Vanderbilt, UAB, plus high-volume non-CofE **CHOP** and **Boston Children's**.
