// @ts-expect-error Deno import
import 'https://deno.land/std@0.168.0/dotenv/load.ts';
// @ts-expect-error Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// @ts-expect-error Deno env
const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY');
// @ts-expect-error Deno env
const AZURE_REGION = Deno.env.get('AZURE_REGION');
const AZURE_TTS_ENDPOINT = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, ApiKey',
};

// Map Azure viseme IDs to your model's blendshape names
const visemeToBlendshape: Record<string, string> = {
  '0': 'sil',
  '1': 'pp',
  '2': 'ff',
  '3': 'th',
  '4': 'dd',
  '5': 'kk',
  '6': 'ch',
  '7': 'ss',
  '8': 'nn',
  '9': 'rr',
  '10': 'aa',
  '11': 'e',
  '12': 'ih',
  '13': 'oh',
  '14': 'ou',
  '15': 'sil',
  '16': 'pp',
  '17': 'ff',
  '18': 'th',
  '19': 'dd',
  '20': 'kk',
  '21': 'ch',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  try {
    const { text } = await req.json();
    if (!AZURE_SPEECH_KEY || !AZURE_REGION)
      throw new Error('Azure Speech credentials missing');

    // 1. Request TTS audio + viseme events from Azure
    const ssml = `<?xml version='1.0'?><speak version='1.0' xml:lang='en-US'><voice name='en-US-JennyNeural'>${text}</voice></speak>`;
    const ttsRes = await fetch(AZURE_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        'User-Agent': 'Supabase-Edge-Lipsync',
      },
      body: ssml,
    });
    if (!ttsRes.ok) throw new Error('Azure TTS failed');
    const audioBuffer = new Uint8Array(await ttsRes.arrayBuffer());
    // (In production, upload audioBuffer to storage and get a URL)
    // For demo, return as base64
    const audioBase64 = btoa(String.fromCharCode(...audioBuffer));
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    // 2. Request viseme events (streaming, but here as a second call for demo)
    const visemeRes = await fetch(AZURE_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'json',
        'User-Agent': 'Supabase-Edge-Lipsync',
      },
      body: ssml,
    });
    if (!visemeRes.ok) throw new Error('Azure viseme request failed');
    const visemeJson = await visemeRes.json();
    // Example visemeJson: { "AudioOffset": 0, "VisemeId": 0 }
    // 3. Map viseme events to blendshape timeline
    const timeline = (visemeJson?.VisemeEvents || []).map((v: any) => ({
      time: v.AudioOffset / 10000000, // ticks to seconds
      blendshape: visemeToBlendshape[String(v.VisemeId)] || 'sil',
      weight: 100,
    }));
    // Optionally add reset steps for smooth transitions
    // 4. Return audio and lipsync timeline
    return new Response(
      JSON.stringify({
        audio_url: audioUrl,
        lip_sync: timeline,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(error); // Log error to Supabase logs
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
