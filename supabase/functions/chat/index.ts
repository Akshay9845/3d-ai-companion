// @ts-expect-error Deno import
import 'https://deno.land/std@0.168.0/dotenv/load.ts';
// @ts-expect-error Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// @ts-expect-error Deno env
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
// @ts-expect-error Deno env
const GOOGLE_GENAI_API_KEY = Deno.env.get('GOOGLE_GENAI_API_KEY');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, ApiKey',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Edge Function: received request');
    let body;
    try {
      body = await req.json();
      console.log('Edge Function: parsed body', body);
    } catch (parseError) {
      console.error('Edge Function: failed to parse JSON body', parseError);
      throw new Error('Invalid JSON body');
    }
    const { messages, model, provider } = body;
    if (provider === 'gemini') {
      if (!GOOGLE_GENAI_API_KEY) {
        console.error('Missing GOOGLE_GENAI_API_KEY');
        throw new Error('GOOGLE_GENAI_API_KEY is missing');
      }
      // Gemini API call
      const geminiRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' +
          GOOGLE_GENAI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: messages.map(m => ({ text: m.content })),
              },
            ],
          }),
        }
      );
      const geminiData = await geminiRes.json();
      console.log('Gemini API response:', geminiData);
      const geminiContent =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (geminiContent) {
        return new Response(JSON.stringify({ content: geminiContent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.error('Invalid Gemini response', geminiData);
        return new Response(
          JSON.stringify({ error: 'Invalid Gemini response' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      if (!GROQ_API_KEY) {
        console.error('Missing GROQ_API_KEY');
        throw new Error('GROQ_API_KEY is missing');
      }
      const modelName = model || 'llama-3-8b-8192';
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      const data = await response.json();
      console.log('Groq API response:', data);
      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log(
          'Edge Function: valid Groq response',
          data.choices[0].message.content
        );
        return new Response(
          JSON.stringify({
            content: data.choices[0].message.content,
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        console.error('Edge Function: invalid Groq response', data);
        return new Response(
          JSON.stringify({
            error: 'Invalid Groq response',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
