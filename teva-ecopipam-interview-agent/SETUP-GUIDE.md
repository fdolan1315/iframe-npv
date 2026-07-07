# ElevenLabs Setup Guide — step by step, plain English

This walks you through building your interview-prep voice agent in ElevenLabs. No coding. Budget ~15 minutes for the simple version, ~40 for the deluxe version.

You have two paths. **Do Path A first** — it gets you practicing today. Upgrade to Path B later if you want.

- **Path A — one agent (simplest).** A single agent that interviews you and coaches you, switching when you say "coach me." Recommended starting point.
- **Path B — two agents (deluxe).** A separate Interviewer and Coach that hand off to each other. Slightly higher quality, more setup.

---

## Before you start

- Log in at **elevenlabs.io**. You need an account that includes **Agents** (formerly "Conversational AI"). A paid tier is recommended for enough call minutes to practice.
- Have the files from this kit on your computer (see "Getting the files" at the bottom).
- The files you'll upload as **knowledge base** are the four documents in the `01-knowledge-base` folder, plus (optionally, and highly recommended) your resume, your filled-in STAR story bank, and the real job posting.

---

## PATH A — one agent (start here)

### Step 1 — Create the agent
1. In the left sidebar, click **Agents** (under the Agents Platform / Conversational AI section).
2. Click **Create agent** (or **+ New agent**).
3. Give it a name: `Teva ABD Interview Coach`.
4. Choose the **Blank** template. Click create.

### Step 2 — Paste the system prompt
1. You'll land on the **Agent** tab. Find the **System prompt** box (large text field).
2. Open the file `02-agent-config/single-agent-combined-system-prompt.md`.
3. Copy **everything between the ``` marks** in the `SYSTEM PROMPT` block (not the ``` marks themselves) and paste it into the System prompt box.

### Step 3 — Set the first message
1. Find the **First message** field (near the top of the Agent tab).
2. Copy the text in the `FIRST MESSAGE` block from the same file and paste it there.

### Step 4 — Upload the knowledge base
1. Still on the **Agent** tab, scroll to the **Knowledge base** section.
2. Click **Add document** → **Upload file** (you can also add text or a URL).
3. Upload these four files one at a time:
   - `01-knowledge-base/01-ecopipam-and-clinical-landscape.md`
   - `01-knowledge-base/02-competitive-landscape-and-market-access.md`
   - `01-knowledge-base/03-epidemiology-and-eastern-coe-map.md`
   - `01-knowledge-base/04-teva-strategy-and-the-abd-role.md`
4. **(Highly recommended)** also upload your resume, your filled-in `your-star-story-bank.md`, and the real job posting once you have it.
5. If you see a **"Use RAG"** or **"Retrieval"** toggle near the knowledge base, turn it **on** (it lets the agent search these documents efficiently).

### Step 5 — Pick a voice and model
1. Find the **Voice** selector. Pick a warm, professional voice (male or female — your preference for "the interviewer").
2. If there's an **LLM / Model** dropdown, choose the most capable option available on your plan (the coaching quality depends on it). The default is usually fine to start.

### Step 6 — Save and test
1. Click **Save** (top right).
2. Click **Test AI agent** / the **call/phone button** to start a voice conversation in your browser (allow microphone access).
3. Answer Morgan's opening question. After an answer or two, say **"coach me"** — it should switch into three-phase feedback. Say **"next question"** to go back.

**That's it — you're practicing.** Everything below is optional polish.

---

## PATH B — two agents (deluxe, do later if you want)

This creates a dedicated Interviewer and a dedicated Coach that hand off by voice. It's a little more work but keeps each perfectly in character.

### Step 1 — Create the Interviewer agent
- Same as Path A Steps 1–5, but:
  - Name it `Teva ABD — Interviewer`.
  - Use the prompt from `02-agent-config/interviewer-agent-system-prompt.md` (the `SYSTEM PROMPT` and `FIRST MESSAGE` blocks).

### Step 2 — Create the Coach agent
- Create a second agent named `Teva ABD — Coach`.
- Use the prompt from `02-agent-config/coach-agent-system-prompt.md`.
- Attach the **same knowledge-base files** to this agent too.
- For this one, pick your **best** model if you have a choice — judging your answers is the harder job.

### Step 3 — Wire the hand-off (agent transfer)
1. Open the **Interviewer** agent → find **Tools** (sometimes under "Agent" or "Tools & Integrations").
2. Add the built-in **"Transfer to agent"** (a.k.a. `transfer_to_agent`) system tool.
3. Set its target to the **Coach** agent. In its description/trigger, note it should fire when the user says "coach me," "feedback," "how did I do," or "debrief."
4. Open the **Coach** agent → add the same **Transfer to agent** tool, targeting the **Interviewer**, triggered by "next question," "back to the interview," or "keep going."
5. Save both.

> Tip: If ElevenLabs offers a **Workflows** builder, you can instead drag the two agents in as nodes and draw transfer arrows between them — same result, more visual.

### Step 4 — Test
- Start a call with the **Interviewer**. Answer a question, say **"coach me"** → it should transfer to Riley. Say **"next question"** → back to Morgan.

---

## Optional — the automatic scorecard (both paths)

This makes ElevenLabs grade each session so you can track improvement.

1. Open your agent (the Interviewer in Path B) → find the **Analysis** tab.
2. Open `02-agent-config/evaluation-criteria-and-data-collection.md`.
3. Under **Evaluation criteria**, add each criterion listed there (name + the prompt text).
4. Under **Data collection**, add each item (name + type + the extraction prompt).
5. Save. Now, after every call, open the conversation's **Analysis / transcript** view to see your scores (STAR, sequencing, ownership, timing) and your "top priority to work on."

---

## How to actually practice (getting value)

- **Quick drill:** answer one question, immediately say "coach me," apply the fix, say "next question," and re-answer the same one. Repeat until it's crisp.
- **Full mock:** do 20–30 minutes straight, then say "debrief everything" at the end.
- **Chase the sequencing score** — delivering the *same* content in the right order (headline first) is what moves you from good to hired.
- **Run your two must-have stories cold:** the launch story and the pre-approval compliance story (in the story-bank template).
- **For tone/energy:** the agent reads your words, not your voice. To judge delivery, play back the session recording (ElevenLabs saves call audio) and listen to yourself.

---

## Troubleshooting

- **It coaches me during the interview / won't switch modes:** say the trigger words clearly — "coach me" to get feedback, "next question" to resume. In Path B, make sure the transfer tool is added to *both* agents.
- **It doesn't seem to know the drug/market facts:** confirm the four knowledge-base files uploaded successfully and the RAG/Retrieval toggle is on. Give it a moment — retrieval adds a slight pause.
- **Answers feel generic about my background:** upload your resume and filled-in STAR story bank to the knowledge base.
- **Runs out of minutes:** that's a plan limit, not a setup problem — upgrade your ElevenLabs tier for more conversation minutes.
- **Facts to double-check before any real-world/customer use** (not needed for practice): the live TAA Center-of-Excellence list, ecopipam's actual price (not set yet), and precise trial secondary endpoints. These are flagged inside the knowledge-base docs.

---

## Getting the files

All files live in the `teva-ecopipam-interview-agent/` folder. You can get them either way:
- **From the download** I sent you (a single `.zip` — unzip it and you'll see the folders `01-knowledge-base`, `02-agent-config`, `03-your-inputs`).
- **From GitHub** — they're in pull request #1 on your `iframe-npv` repo, on branch `claude/teva-tourettes-interview-agent-ri36ir`. Use the green **Code** button → **Download ZIP**, or open each file and copy its contents.

You only ever **upload the knowledge-base files** (folder `01`) plus your personal inputs (folder `03`). The agent-config files (folder `02`) are **copy-paste into text boxes**, not uploads.
