/* NoddyTales TTS proxy (Vercel serverless).
   POST /api/tts  body: { text: string, voicePreset?: string }
   Returns: { audioBase64, alignment }

   v0.9.3 · b8 — Narrator Voice Selector MVP.
   v0.9.3 · b16 — Lineup refresh: 1 British storybook narrator + 3 American voices
   (warm / energetic / cartoon). The four preset env vars below MUST point to four
   DISTINCT ElevenLabs voice IDs in production — if any are unset, that preset
   falls back to ELEVENLABS_VOICE_ID and a per-request console.warn fires so the
   identical-previews misconfig is visible in Vercel logs.

   Intended lineup:
     sunny      → American · warm, clear, everyday read-aloud
     cozy       → British  · classic storybook narrator
     adventure  → American · energetic + expressive
     silly      → American · goofy, bouncy, kid-favorite cartoon

   The client picks a friendly preset key. The browser never sees ElevenLabs
   voice IDs — they live only in server env vars. This proxy:
     1. Validates voicePreset against an allowlist; rejects unknown values 400.
     2. Resolves preset → voice ID via env vars, with ELEVENLABS_VOICE_ID as
        the universal fallback for any preset whose specific env var is unset.
     3. Logs a console.warn per request when a preset falls back so the
        operator notices when production env is misconfigured (all previews
        otherwise sound identical, which is worse than offering one voice
        transparently).
     4. Applies per-preset ElevenLabs voice_settings (stability / similarity /
        style) so even when all four resolve to the same fallback voice the
        moods land distinctly.
     5. Keeps the /with-timestamps endpoint so karaoke highlighting still works.
*/

/* v0.9.3 · b17 — per-preset hardcoded `defaultId` so the 4 presets sound
   genuinely distinct out-of-the-box without requiring the operator to paste 4
   ElevenLabs voice IDs into Vercel. All four IDs below are ElevenLabs
   first-party STOCK voices, available on every ElevenLabs account — NOT
   celebrity / real-person impersonations. Operator can still override per
   preset via the env vars; resolveVoice priority is:
     1. env[envVar]    (operator per-preset override — strongest)
     2. cfg.defaultId  (curated hardcoded default — new)
     3. env.ELEVENLABS_VOICE_ID  (legacy universal fallback)
     4. 'JBFqnCBsd6RMkjVDRZzb' (George — final backstop) */
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
    envVar:        'ELEVENLABS_VOICE_SILLY',       // American · cartoon / goofy
    defaultId:     'jBpfuIE2acCO8z3wKNLl',         // Gigi — American female, childish character
    voice_settings:{ stability: 0.55, similarity_boost: 0.80, style: 0.70, use_speaker_boost: true },
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
  // v0.9.3 · b16 — escalate to console.warn when a preset falls back to
  // ELEVENLABS_VOICE_ID so the identical-previews misconfig is visible in
  // Vercel logs (otherwise every preset just silently sounds the same).
  const logFn = resolved.usedFallback ? console.warn : console.log;
  logFn(`[TTS] chars=${text.length} preset=${resolved.preset} voice=${resolved.voiceId} fallback=${resolved.usedFallback} status=${response.status}`);
  if (resolved.usedFallback) {
    console.warn(`[TTS] preset "${resolved.preset}" fell back to ELEVENLABS_VOICE_ID — set ${VOICE_MAP[resolved.preset].envVar} in Vercel for a distinct voice.`);
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
