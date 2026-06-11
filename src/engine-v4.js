/* ================================================================
   NoddyTales — Engine v4: authored-template story renderer

   v0.9.3 · b52 — Phase 1 of the followability pivot (Story Test Log Entry
   018; "Engine v4" Build Idea). v4 replaces beat-pool ASSEMBLY with complete
   hand-authored templates (src/stories-v4.js), so narrative coherence is a
   property of the data, not a hope of the selector.

   STATUS: MVP behind the ?engine=v4 flag, little + kid tiers only.
   V3 remains the production default for all ages until cutover.

   LOAD ORDER (script tags in index.html + the QA harnesses):
     content.js → engine-v2.js → stories-v4.js → engine-v4.js
   v4 deliberately REUSES engine-v2.js globals — V2_WORDS rich-word pools and
   mapPickToWord — for grammar-safe slot data (articleText etc.). Those pools
   survive the planned V2 deletion (refactor R2 keeps V2_WORDS; see the
   refactor roadmap Build Idea).

   DESIGN CONTRACTS:
   - NEVER NULL for little/kid: every slot has a default; template pools are
     non-empty per tier. Returns null ONLY for out-of-range tiers so the
     router falls through to V3 (tot/big/tween keep V3 until their batches).
   - Picks are plot ingredients: rotation BIASES toward templates that
     consume more of what the kid actually picked (template.uses), so picked
     words pay off without coverage-injection. No FLAVOR_CALLBACKS, no smell
     line, no force-injection of any kind in v4.
   - picks.__v4TemplateId forces a template (QA determinism, mirrors
     picks.__v3BlueprintId).
   ================================================================ */

const ENGINE_V4_VERSION = 'v4.0.0-mvp';

/* Tier resolution for the v4 MVP batch. Out-of-range → null (router falls
   through to V3). Expand per-tier as template batches land. */
function v4TierForAge(age) {
  if (age >= 4 && age <= 5) return 'little';
  if (age >= 6 && age <= 7) return 'kid';
  return null;
}

function v4Random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* User text can arrive with terminal punctuation ("SPLAT!") — strip it so
   templates control their own punctuation ("[y:{noise.text}]!" would
   otherwise render "SPLAT!!"). Mirrors generateStoryV3's local helper. */
function v4StripTerminalPunct(s) {
  return typeof s === 'string' ? s.replace(/[!?.,]+$/, '') : s;
}

/* Title-case a multi-word value: "mac and cheese" → "Mac and Cheese".
   Small words stay lowercase unless first (matches the app's titleCase
   convention from v2.6.1). v4 templates use {x.cap} only in titles. */
const V4_TITLE_SMALL_WORDS = new Set(['a', 'an', 'the', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with']);
function v4TitleCase(s) {
  return String(s).split(' ').map((w, i) =>
    (i > 0 && V4_TITLE_SMALL_WORDS.has(w)) ? w : (w.charAt(0).toUpperCase() + w.slice(1))
  ).join(' ');
}

/* Normalize any slot value into { text, cap, ...rich } so templates can use
   {x.text} and {x.cap} everywhere. Rich words (from V2_WORDS) keep their
   articleText/plural fields for grammar-safe frames. */
function v4Slot(richOrText) {
  if (!richOrText) return null;
  const base = (typeof richOrText === 'string') ? { text: richOrText } : { ...richOrText };
  if (!base.text) return null;
  base.cap = v4TitleCase(base.text);
  return base;
}

/* Exact-match lookup against a V2_WORDS pool (text or id, case-insensitive).
   Unknown picker words return { text } RAW — deliberately NO donor-entry
   fallback synthesis: inheriting a random donor's article/plural fields is
   the b43 root-cause bug class, and v4 templates only use plural-neutral
   frames ("the X" / "some X"), so raw text is always grammatically safe.
   (mapPickToWord can't be reused here — it's function-scoped inside the
   v2/v3 generators.) */
function v4LookupWord(w, pool) {
  if (!w) return null;
  const needle = String(w).toLowerCase();
  return (pool || []).find(e =>
    (e.text && e.text.toLowerCase() === needle) || (e.id && e.id.toLowerCase() === needle)
  ) || { text: String(w) };
}

/* Build the v4 slot set from picks. Every structural slot gets a default so
   rendering is total (never-null contract). */
function buildV4Slots(name, picks) {
  const p = picks || {};
  const kidName = (typeof name === 'string' && name.trim()) ? name.trim() : 'Friend';

  const petRich  = v4LookupWord(p.pet?.w,  V2_WORDS.companions) || v4Random(V2_WORDS.companions);
  const foodRich = v4LookupWord(p.food?.w, V2_WORDS.foods)      || v4Random(V2_WORDS.foods);

  // Setting 2.0 resolved place wins (matches V3); raw place pick second.
  const placeText = p.setting?.place
    || v4LookupWord(p.place?.w, V2_WORDS.places)?.text
    || 'park';

  const noiseText = v4StripTerminalPunct(p.sound?.w || p.freeword?.w)
    || v4Random(V2_WORDS.sounds).text;
  const bigwordText = v4StripTerminalPunct(p.freeword?.w || p.freeword2?.w) || noiseText;

  return {
    kid:     { name: kidName, cap: kidName },
    pet:     v4Slot(petRich),
    food:    v4Slot(foodRich),
    place:   v4Slot(placeText),
    noise:   v4Slot(noiseText),
    bigword: v4Slot(bigwordText),
    // Optional garnish slots — only render if a future template asks.
    color:   v4Slot(p.color?.w   || null),
    move:    v4Slot(p.move?.w    || null),
    mood:    v4Slot(p.mood?.w    || null),
    weather: v4Slot(p.weather?.w || null),
  };
}

/* Which slots did the kid ACTUALLY pick this session? Used for rotation bias
   (defaults don't count — a defaulted food shouldn't pull food templates). */
function v4PickedSlots(picks) {
  const p = picks || {};
  const picked = new Set();
  if (p.pet?.w) picked.add('pet');
  if (p.food?.w) picked.add('food');
  if (p.place?.w || p.setting?.place) picked.add('place');
  if (p.sound?.w || p.freeword?.w) picked.add('noise');
  if (p.freeword?.w || p.freeword2?.w) picked.add('bigword');
  if (p.weather?.w) picked.add('weather');
  if (p.color?.w) picked.add('color');
  if (p.move?.w) picked.add('move');
  if (p.mood?.w) picked.add('mood');
  return picked;
}

/* No immediate repeats per tier (kids hit "again!" — same arc twice in a row
   reads as a rerun even with different picks). Module-level, page lifetime. */
const v4LastTemplate = { little: null, kid: null };

function pickV4Template(tier, picks) {
  const forced = picks && picks.__v4TemplateId;
  if (forced) {
    const t = V4_TEMPLATES.find(t => t.id === forced);
    if (t) return t;
  }
  let pool = V4_TEMPLATES.filter(t => t.tier === tier);
  if (!pool.length) return null;

  // Bias toward templates that consume more of this session's real picks.
  const picked = v4PickedSlots(picks);
  const score = t => (t.uses || []).filter(u => picked.has(u)).length;
  const max = Math.max(...pool.map(score));
  let top = pool.filter(t => score(t) === max);

  // Avoid the immediately-previous template when there's any alternative.
  if (top.length > 1 && v4LastTemplate[tier]) {
    const fresh = top.filter(t => t.id !== v4LastTemplate[tier]);
    if (fresh.length) top = fresh;
  }
  return v4Random(top);
}

/* {slot.prop} substitution. Unresolved tokens render as '?' (same convention
   as renderV3Line) so QA Section 27's unresolved-token gate catches authoring
   mistakes instead of shipping braces to kids. */
function renderV4Line(line, slots) {
  return String(line).replace(/\{(\w+)\.(\w+)\}/g, (m, slot, prop) => {
    const v = slots[slot] && slots[slot][prop];
    return (v === undefined || v === null) ? '?' : String(v);
  });
}

/* Main entry. Returns {title, paragraphs} in the exact shape index.html's
   renderStory/parseStoryLine pipeline already consumes ([name|c|y] tokens
   intact — the b41 apostrophe tokenizer guardrail machinery is untouched). */
function generateStoryV4(name, picks, age) {
  const tier = v4TierForAge(age);
  if (!tier) return null;
  if (typeof V4_TEMPLATES === 'undefined' || !Array.isArray(V4_TEMPLATES)) return null;

  const slots = buildV4Slots(name, picks);
  const template = pickV4Template(tier, picks);
  if (!template) return null;
  v4LastTemplate[tier] = template.id;

  const paragraphs = template.paragraphs.map(variants => renderV4Line(v4Random(variants), slots));

  const mode = (picks && picks.storyMode === 'anytime') ? 'anytime' : 'bedtime';
  const endingPool = (template.endings && template.endings[mode]) || template.endings.bedtime;
  paragraphs.push(renderV4Line(v4Random(endingPool), slots));

  const title = renderV4Line(v4Random(template.title), slots);

  return {
    title,
    paragraphs,
    __engine:   'v4',
    __template: template.id,
    __tier:     tier,
  };
}

/* Browser-global exports (matches engine-v2.js tail pattern). */
if (typeof window !== 'undefined') {
  window.generateStoryV4 = generateStoryV4;
  window.ENGINE_V4_VERSION = ENGINE_V4_VERSION;
}
