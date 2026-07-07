# Post-Call Analysis — Evaluation Criteria & Data Collection

> **Purpose:** turn the three-phase feedback rubric into a **consistent, structured scorecard** the ElevenLabs platform produces automatically after every session, so you get repeatable scoring and can track improvement over time (not one-off vibes).
>
> **Where this goes:** ElevenLabs → your agent → **Analysis** tab → **Evaluation criteria** and **Data collection**. Configure these on whichever agent is active at the end of the session. Because the post-call evaluator receives the **full transcript** across agent transfers, configuring them on the **Interviewer agent** (the entry agent) captures the whole conversation, including the coaching debrief. (If you keep Interviewer and Coach as separate agents, set the criteria on the Interviewer; the evaluator still sees both.)
>
> **How it works:** after each conversation, an evaluator LLM reads the transcript and returns, for each **evaluation criterion**, a result of `success` / `failure` / `unknown` plus a rationale; and for each **data collection** item, an extracted value. Evaluation criteria are pass/fail goals; data collection items pull structured values (numbers, text, enums).

---

## A. Evaluation criteria (pass/fail goals)

Create each of these as a criterion. The **prompt** is what the evaluator LLM is told to check.

1. **STAR completeness**
   *Prompt:* "Across the candidate's behavioral answers, did each substantive answer include all four STAR elements — Situation, Task, Action, and Result? Return success only if the majority of answers were STAR-complete with an explicit Result. Return failure if answers frequently omitted the Result or the candidate's specific Task/role."

2. **Ownership / personal contribution**
   *Prompt:* "Did the candidate clearly describe what THEY personally did (using 'I' with specific actions), rather than describing team activity in the collective 'we' without isolating their contribution? For a second-line leadership role, credit answers that show the candidate leading THROUGH other managers. Success = ownership was consistently clear."

3. **Sequencing / idea order**
   *Prompt:* "Were the candidate's answers sequenced in the order an interviewer's mind wants: a brief headline/result up front, then situation and the candidate's role, then their specific actions, then a quantified result? Success = answers generally led with a clear point and did not bury the outcome under long setup. Failure = the candidate frequently opened with extended context before the interviewer could tell where the story was going."

4. **Quantified results**
   *Prompt:* "Did the candidate support outcomes with specific, quantified results (percentages, rankings, quota attainment, headcount, timelines, dollar figures) rather than vague claims like 'it went well'? Success = most results were quantified."

5. **Answer length discipline**
   *Prompt:* "Were the candidate's answers appropriately concise — roughly 90 seconds to 2 minutes each — without rambling or trailing off? Success = answers were focused and did not consistently run long."

6. **Second-line altitude / fit**
   *Prompt:* "Did the candidate's examples reflect second-line leadership (leading and developing first-line managers, strategy, org-building, cross-functional influence) rather than only individual-contributor selling stories? Success = examples were pitched at the manager-of-managers level appropriate to an Area Business Director."

7. **Market / clinical fluency (only when a market question was asked)**
   *Prompt:* "When asked a market or clinical question (competition, market access, targeting, portfolio), was the candidate's answer accurate and reasonably complete given the ecopipam/Tourette knowledge base? Return unknown if no market question was asked. Success = the candidate demonstrated credible command of the launch context."

8. **Teva alignment / motivation**
   *Prompt:* "If the candidate discussed why Teva / why this role, did they connect it credibly to Teva's strategy (Pivot to Growth, neuroscience), the ecopipam launch, or Teva's values? Return unknown if not discussed."

## B. Data collection items (structured values to extract)

Create each of these to extract a value from the transcript. Type in brackets.

- **num_questions_answered** *[number]* — "How many distinct behavioral interview questions did the candidate answer?"
- **competencies_covered** *[text]* — "List the leadership competencies the questions assessed (e.g., coaching, turnaround, launch, compliance, cross-functional influence)."
- **star_score_1to5** *[number]* — "On a 1–5 scale, rate overall STAR completeness across the session. 5 = every answer complete with quantified result; 1 = consistently missing elements."
- **sequencing_score_1to5** *[number]* — "On a 1–5 scale, rate how well the candidate sequenced ideas (headline-first, logical STAR order). 5 = excellent order; 1 = consistently buried the point."
- **ownership_score_1to5** *[number]* — "On a 1–5 scale, rate clarity of personal ownership / leading through others. 5 = always clear; 1 = mostly 'we' with no individual contribution."
- **timing_score_1to5** *[number]* — "On a 1–5 scale, rate answer-length discipline. 5 = consistently 90s–2min and focused; 1 = consistently rambling or too short."
- **strongest_answer** *[text]* — "Which question did the candidate answer best, and why (one sentence)?"
- **weakest_answer** *[text]* — "Which answer needed the most work, and what was the single biggest gap?"
- **top_priority_fix** *[text]* — "The single highest-impact improvement for the candidate to work on next."
- **filler_words_noted** *[text]* — "Note any obvious filler words or verbal tics that appeared frequently in the transcript (um, like, you know), or 'none observed'."

## C. How to read the output over time

- Track the four 1–5 scores (**star, sequencing, ownership, timing**) session over session — that is your progress dashboard. Sequencing and ownership are usually the last to improve and the biggest differentiators for a second-line role.
- `top_priority_fix` is your homework between sessions. Re-run the same competency next time and watch whether the weakest-answer gap closes.
- **Caveat on delivery scoring:** all of this is judged from the **transcript**, so timing/filler are real but **vocal tone, energy, and confidence are not directly observable.** For tone, review the session **audio recording** yourself. (See the README's "honest limitations" note.)

## D. Optional — dynamic variables for per-answer timing

If you want more precise length feedback, the platform exposes turn counts as dynamic variables (e.g., `system__current_agent_turns`) and the post-call transcript carries timestamps. You can instruct the Coach, in its system prompt, to reference approximate answer duration from the transcript timestamps. This is optional polish — the length criterion above already captures the essentials.
