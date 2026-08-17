// Example backend route for src/services/tts.ts's synthesizeSpeech().
//
// REFERENCE ONLY -- this does not run inside the Expo/React Native app
// (same rule as tools/avatar-mocap/: no Node/Express runtime on mobile).
// Copy/adapt this into your actual backend repo, wherever that lives.
// Keep ELEVENLABS_API_KEY in that backend's env only -- it must never be
// shipped to or reachable from the client.
//
// POST /v1/tts/synthesize
// Body: { text: string, languageCode?: string, voiceId?: string }
// Auth: Bearer token (reuse whatever auth middleware your other routes use)
// Response: { audioUrl: string }

import express from 'express';

const router = express.Router();

router.post('/v1/tts/synthesize', async (req, res) => {
  try {
    // 1. Auth check (reuse your existing middleware) -- assume req.user
    //    is already set by the time this handler runs.

    const { text, languageCode = 'en', voiceId } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID;

    if (!ELEVEN_API_KEY || !VOICE_ID) {
      return res.status(500).json({ error: 'TTS not configured' });
    }

    // 2. Call ElevenLabs.
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // supports the app's non-English launch languages too
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.35, // gentle warmth, matching VOICE_DESCRIPTION in constants/appearance.ts
          use_speaker_boost: true,
        },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      console.error('ElevenLabs error:', errText);
      return res.status(502).json({ error: 'TTS provider failed' });
    }

    // 3a. Simplest: stream the audio straight through instead of storing it.
    //     res.set('Content-Type', 'audio/mpeg');
    //     elevenRes.body.pipe(res);
    //     (If you do this, synthesizeSpeech() in tts.ts needs to change --
    //     it currently expects a JSON { audioUrl } response, not a stream.)

    // 3b. Recommended: upload to your own storage and return a URL, so
    //     the client can retry/re-fetch without re-calling ElevenLabs.
    const audioBuffer = Buffer.from(await elevenRes.arrayBuffer());
    // TODO: upload audioBuffer to S3 / R2 / your storage of choice, e.g.
    //   const audioUrl = await uploadToStorage(audioBuffer, 'tts');
    const audioUrl = 'https://your-storage.example.com/path/to/audio.mp3'; // placeholder

    return res.json({ audioUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal TTS error' });
  }
});

export default router;
