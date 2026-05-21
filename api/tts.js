/* NoddyTales TTS proxy (Vercel serverless).
   POST /api/tts  body: { text: string, voicePreset?: string }
   Returns: { audioBase64, alignment }

   v0.9.3 · b8 — Narrator Voice Selector MVP.
   The client picks a friendly preset key (sunny / cozy / adventure / silly). The
   browser never sees ElevenLabs voice IDs — they live only in server env vars.
   This proxy:
     1. Validates voicePreset against an allowlist; rejects unknown values 400.
     2. Resolves preset → voice ID via env vars, with ELEVENLABS_VOICE_ID as
        the universal fallback for any preset whose specific env var is unset.
     3. Applies per-preset ElevenLabs voice_settings (stability / similarity /
        style) so the same fallback voice can still convey different narrator
        moods if the operator hasn't provisioned separate voice IDs yet.
     4. Keeps the /with-timestamps endpoint so karaoke highlighting still works.
*/

const VOICE_MAP = {
  sunny: {
    envVar:        'ELEVENLABS_VOICE_SUNNY',
    voice_settings:{ stability: 0.80, similarity_boost: 0.90, style: 0.20, use_speaker_boost: true },
  },
  cozy: {
    envVar:        'ELEVENLABS_VOICE_COZY',
    voice_settings:{ stability: 0.85, similarity_boost: 0.92, style: 0.10, use_speaker_boost: true },
  },
  adventure: {
    envVar:        'ELEVENLABS_VOICE_ADVENTURE',
    voice_settings:{ stability: 0.65, similarity_boost: 0.85, style: 0.50, use_speaker_boost: true },
  },
  silly: {
    envVar:        'ELEVENLABS_VOICE_SILLY',
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
  const cfg     = VOICE_MAP[preset];
  // Per-preset env var first; fall back to ELEVENLABS_VOICE_ID; finally the
  // historical default (George — British narrator) so first-time deploys still
  // produce audio.
  const voiceId = env[cfg.envVar] || env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
  return {
    ok: true,
    preset,
    voiceId,
    voice_settings: cfg.voice_settings,
    usedFallback: !env[cfg.envVar],
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
  console.log(`[TTS] chars=${text.length} preset=${resolved.preset} voice=${resolved.voiceId} fallback=${resolved.usedFallback} status=${response.status}`);
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
