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

   v0.9.3 · b18 — Silly Cartoon distinctiveness fix. The b17 default for
   `silly` (Gigi, `jBpfuIE2acCO8z3wKNLl`) read too close to Rachel (the Sunny
   default) when parents A/B-tested previews in production — both are calm
   American-female timbres despite Gigi's "childish character" label. b18
   swaps in Mimi (`zrHiDhphv9ZnVXBqCLjz`), an ElevenLabs stock voice
   explicitly labeled as a Swedish childish character with a noticeably
   higher pitch and quirky cadence. We also drop `stability` from 0.55 → 0.40
   and raise `style` from 0.70 → 0.85 to maximize playful expressiveness.

   Operator can still override per preset via the env vars; resolveVoice
   priority is (strongest → weakest):
     1. env[envVar]    (operator per-preset override)
     2. cfg.defaultId  (curated hardcoded default — happy path)
     3. env.ELEVENLABS_VOICE_ID  (legacy universal fallback)
     4. 'JBFqnCBsd6RMkjVDRZzb' (George — final backstop)
   Steps 3-4 are effectively unreachable when cfg.defaultId is set for every
   known preset. If a custom high-pitched/cartoon voice is wanted that beats
   Mimi for "silly", set `ELEVENLABS_VOICE_SILLY` in Vercel. */
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
    envVar:        'ELEVENLABS_VOICE_SILLY',       // quirky · cartoon / goofy / high-pitched
    // b18 — swapped from Gigi (`jBpfuIE2acCO8z3wKNLl`) to Mimi because Gigi's
    // timbre was too close to Rachel in production user testing. Mimi is an
    // ElevenLabs stock voice (childish character, Swedish-tinged) — explicitly
    // higher-pitched and quirkier than the other three defaults. Original Gigi
    // ID kept in code comments as a fallback option if Mimi ever gets
    // deprecated from the stock library.
    defaultId:     'zrHiDhphv9ZnVXBqCLjz',         // Mimi — childish character, higher-pitched, quirky cadence
    voice_settings:{ stability: 0.40, similarity_boost: 0.75, style: 0.85, use_speaker_boost: true },
  },
};
const DEFAULT_PRESET = 'sunny';
const VALID_PRESETS  = Object.keys(VOICE_MAP);

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
  // (envPerPreset or hardcodedPerPreset). Escalate to console.warn only when
  // the LEGACY chain fires (envUniversal or hardcodedFinal) — meaning the
  // curated per-preset default got bypassed, which on b17+ should be
  // unreachable for the 4 known presets. Seeing this warn in production
  // signals a code change that removed a defaultId.
  const logFn = resolved.usedFallback ? console.warn : console.log;
  logFn(`[TTS] chars=${text.length} preset=${resolved.preset} voice=${resolved.voiceId} source=${resolved.source} status=${response.status}`);
  if (resolved.usedFallback) {
    console.warn(`[TTS] preset "${resolved.preset}" resolved via legacy fallback (source=${resolved.source}). Curated per-preset defaultId is missing from VOICE_MAP — investigate api/tts.js.`);
  }
  if (!response.ok) return res.status(response.status).json({ error: 'ElevenLabs API error' });

  const data = await response.json();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  // alignment.characters[] is parallel to character_start_times_seconds[] / character_end_times_seconds[].
  // Each index maps to one character of the input text.
  res.json({
    audioBase64: data.audio_base64,
    alignment:   data.alignment,
  });
};

// Pure-function exports for the QA harness Section 14 unit test.
module.exports.resolveVoice    = resolveVoice;
module.exports.VALID_PRESETS   = VALID_PRESETS;
module.exports.DEFAULT_PRESET  = DEFAULT_PRESET;
module.exports.VOICE_MAP       = VOICE_MAP;
