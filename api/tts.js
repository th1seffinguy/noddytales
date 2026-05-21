/* NoddyTales TTS proxy (Vercel serverless).
   POST /api/tts  body: { text: string, voicePreset?: string }
   Returns: { audioBase64, alignment }

   v0.9.3 · b8 — Narrator Voice Selector MVP.
   v0.9.3 · b16 — Lineup refresh: 1 British storybook narrator + 3 American voices
   (warm / energetic / cartoon). The four preset env vars are now OPTIONAL
   operator overrides — every preset ships with a curated ElevenLabs stock
   voice baked in as `defaultId` (see b17 + b18 notes below), so a fresh
   Vercel deploy with only `ELEVENLABS_API_KEY` set produces 4 distinct
   preview voices automatically.

   Intended lineup:
     sunny      → American · warm, clear, everyday read-aloud
     cozy       → British  · classic storybook narrator
     adventure  → American · energetic + expressive
     silly      → quirky   · high-pitched / cartoony / goofy

   The client picks a friendly preset key. The browser never sees ElevenLabs
   voice IDs — they live only in server-side code + env vars. This proxy:
     1. Validates voicePreset against an allowlist; rejects unknown values 400.
     2. Resolves preset → voice ID via the b17 priority chain (per-preset env
        override → per-preset hardcoded default → legacy universal env →
        final backstop). See `resolveVoice` for the source-of-truth chain.
     3. Logs a console.warn per request only when the legacy fallback chain
        actually fires (env[ELEVENLABS_VOICE_ID] or final backstop) — meaning
        the curated per-preset default got bypassed somehow. With cfg.defaultId
        set for every known preset that branch is effectively unreachable on
        the happy path.
     4. Applies per-preset ElevenLabs voice_settings (stability / similarity /
        style) so the moods land distinctly even if a future config collapses
        two presets to the same voice ID.
     5. Keeps the /with-timestamps endpoint so karaoke highlighting still works.
*/

/* v0.9.3 · b17 — per-preset hardcoded `defaultId` so the 4 presets sound
   genuinely distinct out-of-the-box without requiring the operator to paste 4
   ElevenLabs voice IDs into Vercel. All four IDs below are ElevenLabs
   first-party STOCK voices, available on every ElevenLabs account — NOT
   celebrity / real-person impersonations.

   v0.9.3 · b18 — Silly first stock-voice swap (Gigi → Mimi). Rejected
   in user testing: Mimi reads as Australian / foreign-accented rather than
   high-pitched + goofy + American. Two blind-pick stock attempts have now
   failed (Gigi b17 too calm-American; Mimi b18 foreign accent).

   v0.9.3 · b20 — Silly stays on Mimi as the hardcoded BACKSTOP so the app
   doesn't 500 when ELEVENLABS_VOICE_SILLY is unset, but operators are now
   STRONGLY RECOMMENDED to override `ELEVENLABS_VOICE_SILLY` in Vercel with a
   custom high-pitched cartoon voice — either a find from the ElevenLabs Voice
   Library (search: "cartoon", "kids", "high pitch", "character") or a cloned
   voice. The per-request warn copy and README narrator-lineup table both
   flag this. Silly is the only preset with this operator-override
   recommendation; Sunny / Storybook / Adventure ship complete out of the box.

   Operator can override any preset via env vars; resolveVoice priority is
   (strongest → weakest):
     1. env[envVar]    (operator per-preset override)
     2. cfg.defaultId  (curated hardcoded default — happy path for 3 of 4)
     3. env.ELEVENLABS_VOICE_ID  (legacy universal fallback)
     4. 'JBFqnCBsd6RMkjVDRZzb' (George — final backstop)
   Steps 3-4 are effectively unreachable when cfg.defaultId is set for every
   known preset. */
const VOICE_MAP = {
  sunny: {
    envVar:        'ELEVENLABS_VOICE_SUNNY',       // American · warm / clear
    defaultId:     '21m00Tcm4TlvDq8ikWAM',         // Rachel — American female, calm narration
    voice_settings:{ stability: 0.80, similarity_boost: 0.90, style: 0.20, use_speaker_boost: true },
  },
  cozy: {
    envVar:        'ELEVENLABS_VOICE_COZY',        // British · storybook narrator
    defaultId:     'JBFqnCBsd6RMkjVDRZzb',         // George — British male, warm mature narrative
    voice_settings:{ stability: 0.85, similarity_boost: 0.92, style: 0.10, use_speaker_boost: true },
  },
  adventure: {
    envVar:        'ELEVENLABS_VOICE_ADVENTURE',   // American · energetic / expressive
    defaultId:     'ErXwobaYiN019PkySvjV',         // Antoni — American male, well-rounded, expressive
    voice_settings:{ stability: 0.65, similarity_boost: 0.85, style: 0.50, use_speaker_boost: true },
  },
  silly: {
    envVar:        'ELEVENLABS_VOICE_SILLY',       // PERFORMANCE STYLE: high-pitched / goofy / extra expressive
    // b18 — swapped Gigi → Mimi to escape Rachel's calm-American timbre.
    // b20 — Mimi was REJECTED in user testing because she reads as Australian /
    // foreign-accented rather than high-pitched + goofy + kid-cartoon.
    //
    // Mimi stays as the hardcoded BACKSTOP so the app does not 500 if
    // ELEVENLABS_VOICE_SILLY is unset, but production should override:
    //
    //   ELEVENLABS_VOICE_SILLY=<custom_voice_id>
    //
    // in Vercel → Project Settings → Environment Variables. Good search
    // terms in the ElevenLabs Voice Library: "cartoon", "kids", "high pitch",
    // "character", "animated". A cloned voice also works.
    //
    // Failed stock-voice candidates so far (do NOT re-try without listening):
    //   Gigi   (jBpfuIE2acCO8z3wKNLl) — too calm-American, reads similar to Rachel (Sunny)
    //   Mimi   (zrHiDhphv9ZnVXBqCLjz) — too Australian / foreign-accented, doesn't read as goofy
    defaultId:     'zrHiDhphv9ZnVXBqCLjz',         // Mimi — backstop only; override via ELEVENLABS_VOICE_SILLY
    voice_settings:{ stability: 0.40, similarity_boost: 0.75, style: 0.85, use_speaker_boost: true },
  },
};
const DEFAULT_PRESET = 'sunny';
const VALID_PRESETS  = Object.keys(VOICE_MAP);

/* v0.9.3 · b22 — VOICE_CONFIG_VERSION + voiceSignature helpers.

   Bumping VOICE_CONFIG_VERSION signals to the client that the voice routing
   contract has changed (default IDs swapped, env-var semantics shifted).
   Returned in every /api/tts response so dev tools / qaVoicePreviews helper
   can see which config the server is running.

   voiceSignature is the first 8 hex characters of SHA-256(voiceId). Lets
   the client verify that 4 preset previews are actually resolving to 4
   different underlying voices without exposing raw ElevenLabs voice IDs to
   the browser. */
const VOICE_CONFIG_VERSION = 'v2';
const crypto = require('crypto');
function voiceSignature(voiceId) {
  if (!voiceId) return null;
  return crypto.createHash('sha256').update(String(voiceId)).digest('hex').slice(0, 8);
}

/* v0.9.3 · b22 — detectVoiceCollapse(env)
   Runs resolveVoice for all 4 presets and groups results by voiceSignature.
   Returns an array of collision groups (each group is { signature, presets }
   where presets.length >= 2). Empty array means all 4 presets resolve to 4
   distinct voices.

   Use case: the b16/b17 production defect where ELEVENLABS_VOICE_ID was set
   to George and the per-preset env vars were unset OR all set to George —
   every preset collapsed to George. detectVoiceCollapse surfaces this as a
   per-request console.warn naming the specific presets that collide.

   Pure function, no I/O. Exposed for Section 14 unit tests. */
function detectVoiceCollapse(env) {
  const bySig = {};
  for (const preset of VALID_PRESETS) {
    const r = resolveVoice(preset, env);
    if (!r.ok) continue;
    const sig = voiceSignature(r.voiceId);
    if (!bySig[sig]) bySig[sig] = [];
    bySig[sig].push(preset);
  }
  const collisions = [];
  for (const [sig, presets] of Object.entries(bySig)) {
    if (presets.length >= 2) collisions.push({ signature: sig, presets });
  }
  return collisions;
}

// Exposed for unit tests (scripts/qa-current.js Section 14). Pure function, no I/O.
function resolveVoice(presetRequested, env) {
  // Default to Sunny when no preset supplied
  const preset = presetRequested == null ? DEFAULT_PRESET : presetRequested;
  if (!VALID_PRESETS.includes(preset)) {
    return { ok: false, status: 400, error: 'unknown voice preset' };
  }
  const cfg = VOICE_MAP[preset];
  // v0.9.3 · b17 — priority chain (highest → lowest):
  //   1. env[cfg.envVar]    — operator per-preset override
  //   2. cfg.defaultId      — per-preset hardcoded curated stock voice (NEW)
  //   3. env.ELEVENLABS_VOICE_ID — legacy universal operator fallback
  //   4. 'JBFqnCBsd6RMkjVDRZzb' — final backstop (George)
  // `usedFallback` is true only when we ended up in the legacy chain
  // (envUniversal or hardcodedFinal) — meaning the curated default was
  // bypassed somehow. With cfg.defaultId set for every known preset, the
  // legacy chain is effectively unreachable, and the per-request
  // console.warn in the handler no longer fires for the happy path.
  let voiceId, source;
  if (env[cfg.envVar])              { voiceId = env[cfg.envVar];        source = 'envPerPreset'; }
  else if (cfg.defaultId)           { voiceId = cfg.defaultId;          source = 'hardcodedPerPreset'; }
  else if (env.ELEVENLABS_VOICE_ID) { voiceId = env.ELEVENLABS_VOICE_ID; source = 'envUniversal'; }
  else                              { voiceId = 'JBFqnCBsd6RMkjVDRZzb'; source = 'hardcodedFinal'; }
  return {
    ok: true,
    preset,
    voiceId,
    voice_settings: cfg.voice_settings,
    source,
    usedFallback: source === 'envUniversal' || source === 'hardcodedFinal',
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text, voicePreset } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text required' });
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TTS not configured' });

  const resolved = resolveVoice(voicePreset, process.env);
  if (!resolved.ok) {
    return res.status(resolved.status).json({ error: resolved.error });
  }

  // Use the with-timestamps endpoint so karaoke highlighting can sync to actual word timing
  // (not proportional char-count estimation). Returns JSON: { audio_base64, alignment, ... }.
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolved.voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: resolved.voice_settings,
    }),
  });
  // v0.9.3 · b16/b17/b18 — log at console.log on the happy path
  // (envPerPreset or hardcodedPerPreset). Escalate to console.warn when:
  //   (a) the LEGACY chain fires (envUniversal or hardcodedFinal) — meaning
  //       the curated per-preset default got bypassed, which signals a code
  //       bug (missing defaultId);
  //   (b) v0.9.3 · b20 — `silly` resolved via its hardcoded backstop (Mimi),
  //       which user testing showed reads as foreign-accented rather than
  //       high-pitched/goofy. The operator should set ELEVENLABS_VOICE_SILLY
  //       to a custom cartoon voice — surface the recommendation in Vercel
  //       logs every time the Silly preset fires on the backstop;
  //   (c) v0.9.3 · b22 — detectVoiceCollapse flags ≥2 presets resolving to
  //       the same underlying voice. This was the production failure mode
  //       in b16: ELEVENLABS_VOICE_ID set to George with no per-preset env
  //       vars → all 4 presets resolved to George. The new warn explicitly
  //       names the colliding preset keys so an operator can fix env vars.
  const sillyOnBackstop = resolved.preset === 'silly' && resolved.source === 'hardcodedPerPreset';
  const collisions      = detectVoiceCollapse(process.env);
  const sig             = voiceSignature(resolved.voiceId);
  const logFn = (resolved.usedFallback || sillyOnBackstop || collisions.length) ? console.warn : console.log;
  logFn(`[TTS] chars=${text.length} preset=${resolved.preset} voice=${resolved.voiceId} source=${resolved.source} sig=${sig} status=${response.status}`);
  if (resolved.usedFallback) {
    console.warn(`[TTS] preset "${resolved.preset}" resolved via legacy fallback (source=${resolved.source}). Curated per-preset defaultId is missing from VOICE_MAP — investigate api/tts.js.`);
  }
  if (sillyOnBackstop) {
    console.warn('[TTS] Silly preset is using its hardcoded Mimi backstop. Mimi reads as foreign-accented in user testing. Set ELEVENLABS_VOICE_SILLY in Vercel to a custom high-pitched cartoon voice for the intended Silly performance. See api/tts.js header.');
  }
  if (collisions.length) {
    for (const c of collisions) {
      console.warn(`[TTS] VOICE COLLAPSE: presets [${c.presets.join(', ')}] all resolve to the same voiceSignature=${c.signature}. Users will hear identical audio for these presets. Check Vercel env vars (ELEVENLABS_VOICE_SUNNY/COZY/ADVENTURE/SILLY/ID).`);
    }
  }
  if (!response.ok) return res.status(response.status).json({ error: 'ElevenLabs API error' });

  const data = await response.json();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  // alignment.characters[] is parallel to character_start_times_seconds[] / character_end_times_seconds[].
  // Each index maps to one character of the input text.
  // v0.9.3 · b22 — response now carries voice-routing metadata so the client
  // (and DevTools / window.qaVoicePreviews) can verify that 4 preset requests
  // are actually resolving to 4 distinct voices, WITHOUT exposing raw
  // ElevenLabs voice IDs to the browser. voiceSignature is an 8-hex-char
  // SHA-256 prefix of the voiceId — irreversible, just a fingerprint.
  res.json({
    audioBase64:         data.audio_base64,
    alignment:           data.alignment,
    voicePreset:         resolved.preset,
    voiceSource:         resolved.source,
    voiceConfigVersion:  VOICE_CONFIG_VERSION,
    voiceSignature:      sig,
  });
};

// Pure-function exports for the QA harness Section 14 unit test.
module.exports.resolveVoice         = resolveVoice;
module.exports.VALID_PRESETS        = VALID_PRESETS;
module.exports.DEFAULT_PRESET       = DEFAULT_PRESET;
module.exports.VOICE_MAP            = VOICE_MAP;
module.exports.voiceSignature       = voiceSignature;       // v0.9.3 · b22
module.exports.detectVoiceCollapse  = detectVoiceCollapse;  // v0.9.3 · b22
module.exports.VOICE_CONFIG_VERSION = VOICE_CONFIG_VERSION; // v0.9.3 · b22
