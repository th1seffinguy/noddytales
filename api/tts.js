module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TTS not configured' });
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';

  // Use the with-timestamps endpoint so karaoke highlighting can sync to actual word timing
  // (not proportional char-count estimation). Returns JSON: { audio_base64, alignment, ... }.
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.80, similarity_boost: 0.90, style: 0.20, use_speaker_boost: true },
    }),
  });
  console.log(`[TTS] chars=${text.length} voice=${voiceId} status=${response.status}`);
  if (!response.ok) return res.status(response.status).json({ error: 'ElevenLabs API error' });

  const data = await response.json();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  // alignment.characters[] is parallel to character_start_times_seconds[] / character_end_times_seconds[].
  // Each index maps to one character of the input text.
  res.json({
    audioBase64: data.audio_base64,
    alignment: data.alignment,
  });
};
