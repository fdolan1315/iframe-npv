# CNS Launch Atlas: design consultation

Basis: full-page screenshots at 1360px of all ten sections for rare epilepsy (DEE) and of Overview, Disease 101 and Journey for essential tremor (ET), plus the view code and config. Word counts are visible words measured in the rendered page (`innerText`), default state.

## 1. Diagnosis: why it reads as text-heavy and utilitarian

1. **There are no explanatory graphics at all.** The whole app contains zero images, zero diagrams and one to four small charts per screen. Disease 101, the section that should teach, has a single chart, and it is "Publication momentum", a bibliometric bar chart that teaches nothing about the disease. The central clinical idea of the DEE market (sodium-channel blockers help gain-of-function and harm loss-of-function) is an accordion title.
2. **Every screen is the same three components: accordion, table, fact list.** Overview "What matters in this market", Disease 101 "Primers", Journey "Guidelines and consensus", Access "Policy that moves net price" are all the same plus-sign list. Nothing looks different because nothing is drawn differently, so the reader cannot tell a headline from a footnote.
3. **Research notes are published as the interface.** Payers & access is 12,035px tall and 3,764 words; its lead panel is 19 stacked fact rows. Landscape is 2,136 words and opens with a relutrigine profile made of label-value rows and four tables. Provenance language is in the reading line: "not found", "not retrieved this session", "(not re-verified)" appear dozens of times, including inside the Journey stage tabs ("Stage 4 … not found").
4. **Charts are untitled defaults.** "Study starts by year", "Most active industry sponsors", "Net revenue by year" label the data, not the finding. Blue and orange (both off-kit) are used for series on every chart with no semantic meaning; nothing is annotated.
5. **Sequences are shown as lists.** The Overview catalyst calendar is 12 text rows with dates in a column, not a timeline. Treatment sequencing is three bullet groups. The patient journey is a tab strip with a paragraph beneath. The patient funnel is four equal-width progress bars, so the 10,000 to 1,900 drop, the launch thesis, has no shape.
6. **Uniform density and no focal point.** Each screen is a grid of equal white cards with 13 to 14px body text. Half-empty cards (Overview left column, ET Journey guidelines card, Access payer-mix card with 1,400px of blank space) sit beside overfull ones.
7. **Confidence and source furniture outshouts content.** HIGH/MEDIUM/LOW pills in green, amber and red are the most saturated items on Disease 101 and Journey. They are metadata and should be the quietest thing on the page.
8. **Interaction is filtering, not understanding.** Outside the simulator, controls are search boxes, selects and pagination. Nothing lets a reader change a condition and watch a consequence, which is what the owner means by interactivity.

## 2. Design direction: "the annotated figure", inside the BIOS Brand Kit

All visuals follow BIOS Brand Kit v1.3.0 rev 6. BIOS voice does not apply; copy stays neutral and clinical. Model each screen on an HBR "Idea in Brief" spread: one large figure that carries the argument, a headline that states the finding, a short deck, and annotations on the figure itself. The kit's personality (calm, precise, quietly premium) and this approach point the same way: fewer, larger, flatter figures with a lot of white space.

- **Layout.** Page on Clear White #F8FAFC, content width 1200–1280px, gutters 24/40/64px, 8px spacing base. One hero figure per screen at full content width, 420–560px tall, set directly on the page with no card. Supporting figures at half width. Running text beside or under a figure is held to a 60–72 character measure. Cards (12px radius, 1px rgba(17,24,39,.12) border, no shadow) remain only for tools: simulator inputs, explorers, drawers. Controls 8px radius.
- **Annotation style.** 1px Context Steel #42526E leader lines ending in a small open circle, with a sentence-case Inter note beside the mark. Maximum five annotations per figure. Annotations are the body copy; no paragraph restates them. Every essential value is printed on the figure, never left to hover.
- **Colour discipline.** Deep Slate #111827 is the default mark and text colour. Authority Cobalt #2457D6 means one thing only: "the subject of this figure or the current selection" (the asset, the chosen stage, the selected state), plus links and actions. Context Steel carries comparison series and secondary text. Signal Silver #94A3B8 is for dividers and decoration only, never text. Semantic colours are used strictly for meaning and always with icon plus label: Consequence Crimson #B4233C (on #FBEAEC) for clinical harm, discontinuation, failed or terminated programmes; Evidence Green #0B6B50 for approved or positive-evidence status; Watch Amber for caution; Synthesis Violet for mixed evidence; neutral Steel and "not assessed" Slate for the rest. Direction is not sentiment: a falling line or a simulator downside is slate or steel, not crimson. BIOS Electric #0021FE appears nowhere outside the logo file.
- **Confidence and data quality.** Confidence (high / medium / low / not scored) is not sentiment, so the current green/amber/red pills go. Use a neutral Steel chip with the word and a filled, half or hollow dot. Data quality (observed / estimated / modeled / unknown) is a second word on the same chip; modeled values are also drawn with a long-dash stroke or hatched fill.
- **Typography.** Two families only. Instrument Sans 700 for finding headlines (28–32px desktop, sentence case) and for the one large numeral per screen (56–72px); Instrument Sans 600 for figure titles. Inter 400 for everything else at 18px/1.6 desktop and 17px/1.55 mobile for reading text, with a 16px floor for anything read as a sentence. Inter 500/600 with `font-variant-numeric: tabular-nums` replaces the monospace for all data. ALL CAPS only for compact metadata labels. IBM Plex Sans, Plex Sans Condensed and Plex Mono are all removed.
- **Chart vocabulary, limited on purpose.** Stepped funnel (proportional widths), swimlane timeline, dot and dumbbell plots with intervals, slope charts, tile-grid map with the six-step sequential cobalt scale, small multiples for states and analog ramps. Default series slate, emphasis cobalt, context steel; gridlines rgba(17,24,39,.12), reference lines rgba(17,24,39,.45). When categories are unavoidable use the kit's categorical order with its line patterns, and switch to small multiples beyond four series. All fills flat: no gradient encodes anything. Missing values are gaps with a stated null state (not available / not disclosed / unknown / not applicable), never zero. Sparklines follow the kit spec (96×28, 2px, endpoint dot, paired with value, signed change and period). No pies, gauges or radial bars.
- **Atmosphere.** Flat by default. The "executive field" gradient (#111827 to #2457D6, 135°) is allowed once per viewport: use it only for the Overview hero band and video title cards, with reverse text on it. No glass, no shadows, no animated gradients.
- **Logo.** Replace the current waveform mark and typed "CNS Launch Atlas" lockup with the supplied BIOS SVG wordmark (minimum 120px, clear space respected, on #F8FAFC). "CNS Launch Atlas" becomes a plain Instrument Sans product title set apart from it. No invented icon or favicon.
- **Signature device (inside the kit, no new motif).** The recurring device is the annotated figure itself: a slate figure with one cobalt subject and steel leader-line notes. That is recognisable, costs nothing in sign-off, and is what HBR graphics actually have in common. Waveforms (EEG current, tremor amplitude, spiral) appear only as content inside figures where they are the thing being explained. Using a trace line as a decorative brand device (header rules, loaders, dividers) would be a new motif and needs owner confirmation; I would not pursue it.
- **Provenance line and source chip.** Every figure ends with a visible provenance line in Inter 14–16px Context Steel: source name, as-of or published date, confidence, data quality. Numbers on the figure carry a small numbered chip keyed to that line. A click on the chip opens a panel with accessed date, URL and caveats and links to Sources & methods. The popover adds depth; nothing essential lives only in it.
- **Mechanism figures as schematics.** The kit bans molecule diagrams, DNA helices and pills as brand imagery. Mechanism explainers are instructional content, but they should still not look like stock molecular art: draw them as flat 2D line schematics in slate with 1.5–2px strokes, a channel as a simple gate in a membrane line, a circuit as labelled boxes and arrows over a plain brain outline, with cobalt for the element under discussion. No 3D, no glow, no ribbon proteins, no ball-and-stick, no cell renderings. Each carries "Schematic, not to scale".
- **Light theme only.** No dark mode. Reverse fields exist only as exact #111827 (or the executive field) bands and video frames.

## 3. Section-by-section recommendations

### Disease 101 (deepest change) — effort L, impact High

**Cut or demote:** the nine/twelve primer accordions become captions of figures; the 22-row epidemiology table and glossary go into a drawer; glossary terms become inline dotted-underline definitions (tap or focus; the full glossary stays reachable in the drawer); delete Publication momentum (move to KOLs). Quiz stays but is embedded as one question after each figure.

Structure as a scrolling sequence of five explainers per disease, each with one headline, one figure, 40 to 60 words.

**SCN2A/SCN8A set (all in-page SVG, deterministic):**
1. **"Same gene, opposite problems": channel gain vs loss of function.** Schematic membrane with a sodium channel and a trace of sodium current beneath it. Three-way toggle: typical / gain of function / loss of function. Current trace and a firing-rate strip change. A second switch, "add a sodium-channel blocker", shows GoF firing normalise and LoF firing drop further, flagged Consequence Crimson with a warning icon and the label "worsens". This one figure replaces four primers. Schematic only, labelled "conceptual, not to scale". M.
2. **Age-of-onset timeline.** Horizontal axis birth to adulthood; bands for SCN2A GoF (first days to 3 months), SCN2A LoF (later onset, autism/ID), SCN8A, Dravet as comparator. Onset ages are printed on the bands; selecting a band shows seizure type, typical first drug and what the genetic result changes in a panel beneath. S.
3. **"One in 590" incidence icon array**, DEE overall with SCN2A/SCN8A share highlighted, plus the prevalence ranges as interval bars so source disagreement is visible rather than tabulated. S.
4. **Burden beyond seizures:** a body-and-life diagram as a radial or simple column set (seizures, development, sleep, movement, feeding, SUDEP, caregiver employment) with one sourced number each. S.
5. **Persistent current and where the pipeline acts:** the same channel figure reused with three markers (non-selective blocker, persistent-current-preferring modulator, antisense lowering expression). Neutral mechanism labels, status tag "investigational" on each, no efficacy claims on the figure. M.

**Essential tremor set:**
1. **The tremor loop.** Stylised sagittal brain outline with four nodes: inferior olive, cerebellum, thalamus (Vim), motor cortex, and the arm. An oscillation travels the loop. Selectable overlays: "T-type calcium channel blocker" (highlights nodes where these channels are thought to drive rhythmicity), "DBS" and "focused ultrasound" (both point to Vim; one reversible stimulation, one lesion), "propranolol/primidone" (shown honestly as "mechanism in ET not established"). Hand-built SVG; anatomy schematic, reviewed by a neurologist. L.
2. **Spiral and amplitude interactive.** A code-generated Archimedes spiral and a line of handwriting with a severity slider (mapped to a 0 to 4 rating scale descriptor) and a frequency readout. A second control applies "about 50% average amplitude reduction" to show what first-line therapy typically delivers. This is the most memorable teaching moment in the app. M.
3. **Tremor is action tremor: ET vs Parkinson's vs dystonic tremor** as a three-column comparison matrix of icons (at rest / posture / action; symmetric or not; other signs). S.
4. **Daily living tiles:** drinking, writing, eating, dressing, phone use, linked to items patients are scored on. Line pictograms, not photos. S.
5. **Prevalence by age curve** with the 65+ share shaded and Medicare annotation. S.

### Journey & treatment — effort L, impact High

**Cut or demote:** the tab strip with paragraph; the "Unmet needs and live debates" wall (13 to 14 prose rows); guideline accordion to a drawer; all in-line "not found" in stage tabs.

**DEE: "The diagnostic odyssey" as a subway-style swimlane.** Horizontal time axis from first seizure; lanes for family, ED/NICU, neurology, genetics, epilepsy centre. Stage nodes sized by time spent; delay segments drawn as stretched dashed track with the sourced duration (rapid genome about 5 weeks). Friction points are crimson markers on the track; unmet needs attach to the stage they belong to as numbered pins that open a 30-word popover. A "fork" at Stage 3 shows GoF and LoF routes diverging into different treatment paths, tying back to Disease 101. Clicking a syndrome chip re-routes the line. In-page SVG. L.

**ET: "The leaky pipeline" Sankey-style drop-off.** 7 to 9M prevalent, to diagnosed (1.1 to 2.2M), to treated, to still on first-line at two years (40 to 47% stop), to procedure. Widths proportional, each loss labelled with why. Then a **treatment ladder**: rungs 1L, 2L, focal, device, procedural, emerging, each rung a compact row with three aligned mini-marks: evidence grade, typical tremor reduction as an interval bar, discontinuation as a crimson bar. The seven prose blocks of evidence/efficacy/limits collapse into these marks plus an expand. Emerging rung carries "investigational, under FDA review" and reports trial results only as cited data. M to L.

**Both:** "Live debates" become three to five two-sided "tension cards" (claim / counter-claim, each with a source chip) instead of paragraphs. S.

### Overview — effort M, impact High
**Cut:** six-item accordion to six one-line findings attached to visuals; competitor table to a link. **Replace with:** a hero "market in one picture": proportional stepped funnel with the gap annotated ("8,100 not yet visible in data"); a **catalyst timeline** as a horizontal track with a "today" marker, past events grey and upcoming cobalt, PDUFA date as the one large numeral; KPI strip cut from six to three with sparklines where a series exists; a pipeline phase strip (dots by phase, discontinued hollow). In-page SVG.

### Competitive landscape — effort M, impact High
**Cut:** label-value asset profiles and the 34-row pipeline table from the default view. **Replace with:** a **pipeline matrix**, mechanism class (rows) by development stage (columns), one dot per asset, discontinued as hollow crimson, click for a side panel; **trial-result dot plot** for each near-launch asset (effect estimate, interval where published, n, design tag) with blunt design caveats annotated; marketed brands as a **slope or small-multiple spend chart** with the leader labelled directly. Asset panels use a fixed "label card" template: mechanism icon, status, three numbers, next catalyst.

### Trials — effort S to M, impact Med
**Cut:** intro prose; the 273-row table stays as the explorer but collapsed to ten rows below the figure. **Replace with:** a **beeswarm/strip timeline**: each study a dot on start year, row by phase, size by enrolment, colour only for the selected sponsor; filters drive the dots and table together. Institutions become a ranked dot plot linked to the map.

### Geography — effort M, impact Med
Already the most visual screen. **Cut:** the 51-row table from default (toggle "table view"). **Replace/add:** finding headline ("Ten states hold 54% of modeled patients"); **component breakdown** on state select: four small bars showing why the index is what it is; **small-multiple tile-grid map** so the four layers can be compared at once; a patients-vs-specialists scatter identifying under-served states. Use the kit's six-step sequential cobalt scale as flat steps, states with no data hatched and labelled "not available".

### Payers & access — effort L, impact High
The worst offender. **Cut:** about 65% of visible text. **Replace with:** a **"how a prescription gets paid" flow diagram** (patient to payer type to PA to specialty pharmacy, with time-to-coverage clocks on each arm); a **time-to-coverage timeline** (Medicaid P&T lag, commercial new-to-market block, Part D) as ranged bars on a shared months axis; a **gross-to-net waterfall** with the statutory rebate and inflation penalty as labelled steps; a **PA criteria matrix** (16 policies as rows, criteria such as genetic confirmation, specialist prescriber, step edits, reauthorisation as columns, filled cells) with policy text on click; state Medicaid data as a tile map. Fact rows move to an "Evidence" drawer per figure.

### KOLs & prescribers — effort M, impact Med
**Cut:** advocacy paragraphs to logo-free name tiles with one line; score formula to a one-line visible note with the full method in a disclosure. **Replace with:** an **influence scatter** (papers vs gene-specific papers, size = study leads, named experts labelled); institution cluster map; prescriber targets as a decile curve ("top N prescribers write X% of claims") above the table. Avoid network hairballs.

### Launch simulator — effort M, impact High
Already interactive; make it legible. **Cut:** year-by-year table to a toggle. **Replace/add:** a **scenario fan** (base line plus upside/downside band) with analog ramps overlaid as grey lines, replacing the analog table; a **tornado chart** showing which assumption moves peak revenue most; a **patient-flow strip** (addressable to diagnosed to covered to on therapy) that animates as sliders move; group 20 sliders into five collapsible drivers with the three most sensitive open. Keep "illustrative model, not a forecast" visible.

### Sources & methods — effort S, impact Low (but protects everything else)
Keep text; this is where rigour lives. Add a **provenance diagram** (sources flowing into sections), a confidence-mix bar per section, and make this page the landing target of every source chip. Move "Known gaps" here from all other screens.

## 4. Videos: make three, not six

All video uses the kit palette, Instrument Sans and Inter, flat fills, and the supplied wordmark on a #111827 or executive-field end card. Video is the least maintainable asset in a product whose facts change with each catalyst. Three code-rendered pieces, no narration dependency (captions on screen), each under 45 seconds, each also usable as the poster for its section. All built from the same SVG assets as the in-page diagrams.

1. **"Gain vs loss" (30 s, code-rendered).** Channel opens; current trace; GoF over-fires; blocker calms it; same blocker on LoF silences the cell; closing line on why the gene test precedes the drug choice.
2. **"The tremor loop" (40 s, code-rendered).** Oscillation circulates olive, cerebellum, thalamus, cortex; hand trace shakes; three interventions appear in turn at their site of action; trace steadies.
3. **"The odyssey" or "The leaky pipeline" (30 s each, code-rendered, optional third).** The journey line draws itself, pausing at each delay with the sourced duration.

Generated footage: at most one 6 to 8 second silent ambient loop per market for the Overview header (hands around a cup; a parent's hand on an infant's back), no faces, no text, clearly illustrative. If budget is tight, skip generated video entirely. Do not make a talking-head or AI-avatar explainer.

## 5. Still images

**Worth generating (six to eight total, one consistent art direction):** documentary-style, natural light, shallow depth, muted palette graded toward the kit's cool slate and steel neutrals, hands and environments rather than faces.
- ET: older hands steadying a coffee cup; a hand signing a form; a kitchen table with adapted utensils. Used on Overview header, Journey stage 1, Disease 101 daily-living section.
- DEE: parent's hands holding an infant's foot or hand; a hospital corridor at night; a handwritten seizure diary on a kitchen counter (no medicines or pills in frame). Used on Overview header, Journey start, caregiver-burden figure.

**Do not generate:** ion channels, neurons, synapses, brain anatomy or cross-sections, MRI/EEG images, pill or packaging images, any drug product, molecular structures, charts or maps, logos, identifiable patients or clinicians, "KOL portraits", children's faces, anything depicting a seizure, and any image containing text. Caption every generated image "Illustrative image".

## 6. Text-reduction plan

Mechanisms: finding headlines replace section intros; annotations replace paragraphs; one figure replaces several accordion items; tables default to collapsed or top five; source hosts, confidence pills and "not found" caveats move into chips and the Sources page; glossary becomes inline definitions; detail lives in a right-hand drawer opened from a mark. Rule: no more than 60 words of running text per figure, no paragraph over three lines at default.

| Section | Visible words now | Target | Cut |
|---|---|---|---|
| Overview | 600–670 | 330 | 50% |
| Disease 101 | 1,220 | 520 | 57% |
| Journey | 880 (DEE) / 1,420 (ET) | 480 / 620 | 45–56% |
| Landscape | 2,140 | 950 | 55% |
| Trials | 1,030 | 720 | 30% |
| Geography | 830 | 520 | 37% |
| Payers & access | 3,760 | 1,300 | 65% |
| KOLs | 1,340 | 900 | 33% |
| Simulator | 660 | 470 | 29% |
| Sources | 800 | 800 | 0% |

Total falls from roughly 13,300 to about 7,000 words on default view (about 47%), with nothing deleted from the data, only relocated one interaction away.

## 7. Roadmap

**Phase 1, quick wins (one pass, no new assets).** BIOS tokens (palette, Instrument Sans + Inter, 16–18px text, spacing, radii, supplied wordmark); provenance line and source-chip component; demote confidence pills; purge "not found" from the reading line; finding-style headlines on every chart; colour discipline (slate default, cobalt subject, steel context, semantic colours with icon + label); proportional funnel; catalyst timeline; collapse tables to top rows; hero-figure layout template; delete Publication momentum from Disease 101.

**Phase 2, core redesign.** Disease 101 explainer sets for both diseases; Journey swimlane and ET drop-off plus treatment ladder; Access flow, waterfall and PA matrix; Landscape pipeline matrix and trial dot plots; simulator fan, tornado and patient-flow strip.

**Phase 3, premium media.** Two to three code-rendered videos from the Phase 2 SVG assets; six to eight generated stills; ambient loops if still wanted; mobile polish and reduced-motion variants.

**If only one build pass:** the BIOS tokens, the provenance line and source chip, the Phase 1 headline rules, and four hero interactives: the GoF/LoF channel toggle, the ET tremor loop with the spiral slider, the two Journey figures, and the Overview funnel plus timeline. Those four screens are what a new reader sees first and are where the "text-heavy" verdict is formed.

## 8. Risks and things to resist

- **Decoration instead of explanation.** Gradients beyond the one permitted hero field, glass cards, 3D brains and stock "neural network" backdrops would make it look like every AI-built pharma deck. If a visual does not encode a fact or a relationship, cut it.
- **Chartjunk and novelty forms.** No radial bars, chord diagrams or network graphs for KOLs. Use the limited vocabulary above.
- **Scientific inaccuracy.** All mechanism and anatomy figures hand-drawn in SVG, labelled schematic, and signed off by a clinician before release. Where a mechanism is unsettled (propranolol and primidone in ET, the neurodegeneration hypothesis), draw the uncertainty rather than a confident arrow.
- **Promotional drift.** Animated "drug fixes the trace" sequences can read as efficacy claims. For investigational assets, show mechanism as a hypothesis, report trial results only as cited data with design caveats, and keep "investigational, not approved" on the figure itself, not in a footer.
- **Buried sources.** Cutting text must not cut traceability. Every figure carries a visible provenance line and every numeral a chip; test that each one resolves to the Sources page.
- **Inaccessible interaction.** Hover-only detail fails on touch and keyboard. Every interactive needs tap and focus states, a visible default state that already tells the story, text alternatives, and `prefers-reduced-motion` handling. Never rely on cobalt vs crimson alone; pair with icon and label, and hold meaningful marks to 3:1 contrast and text to WCAG 2.2 AA.
- **Mobile breakage.** Swimlanes and matrices need a stacked vertical variant below about 720px, designed, not left to overflow.
- **Weight and maintenance.** Keep video under roughly 5MB each, lazy-loaded with a poster. Never bake dated numbers into video or raster images; numbers live in the data layer so the next catalyst does not force a re-render.
- **Sensitive imagery.** These are severely ill children and older adults with a stigmatised symptom. Restraint in photography is part of credibility with this audience.

## 9. BIOS compliance: what changed and what the owner must decide

**Changed from my original advice**
- Emphasis colour teal became Authority Cobalt; vermilion became Consequence Crimson, now restricted to genuine adverse meaning and always with icon plus label. Drop-offs, declines and downside scenarios are slate or steel, not crimson.
- "Warm greys" became the kit's slate, steel and silver neutrals. Geography uses the sequential cobalt steps.
- IBM Plex (three faces, including mono) is replaced by Instrument Sans and Inter with tabular numerals. Text rises from 12.5–14px to 16–18px.
- The "trace" signature motif is withdrawn as decoration; waveforms remain only as explanatory content. The existing waveform logo is replaced by the supplied BIOS wordmark.
- Source chips no longer rely on a popover: a visible provenance line sits under every figure.
- Confidence pills lose green/amber/red and become neutral labelled chips; "not found" becomes the kit's defined null states.
- No dark mode. One executive-field gradient at most, on the Overview hero and video cards.
- Generated stills lose the syringes/medicines shot and are graded cool, not warm.

**Tensions for the owner to decide**
1. **Type size vs data density.** At 18px body the tables and explorers get roughly 30–40% longer. I recommend 18px for reading text, 16px for annotations, and an owner-approved 14px floor for table cells and compact metadata only. Without that exception, the Trials, KOL and Geography tables should show fewer columns by default.
2. **Mechanism schematics vs the "molecule diagram" ban.** I read the ban as covering decorative brand imagery. Confirm that flat, labelled ion-channel and brain-circuit schematics are acceptable as instructional content.
3. **Waveform as motif.** If the owner wants a recurring trace device beyond in-figure content, it needs sign-off as a new motif. My advice is not to.
4. **Crimson for clinical harm.** Using Consequence Crimson for "blocker worsens loss-of-function" and for discontinued programmes is a semantic use; confirm that reading. Stage colours for the pipeline otherwise stay neutral.
5. **Human photography.** The kit lists banned clichés but does not say whether documentary photography of patients' hands and homes fits a "private executive institution" tone. Confirm before generating; the app works without it.
6. **Product title beside the wordmark.** Confirm that a plain-text "CNS Launch Atlas" title near the BIOS wordmark is acceptable and is not treated as a new logo variant.
7. **Dark fields.** Confirm light-only. If a dark presentation mode is wanted, it must be exact #111827 with re-checked contrast for cobalt on slate (cobalt text on #111827 is below 4.5:1, so links and emphasis there would need the reverse treatment the kit specifies).
