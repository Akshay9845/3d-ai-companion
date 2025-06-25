// @ts-expect-error Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// @ts-expect-error Deno env
const VISION_API_KEY = Deno.env.get('VISION_API_KEY');
// @ts-expect-error Deno env
const FACE_API_KEY = Deno.env.get('FACE_API_KEY');

serve(async req => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 204,
    });
  }

  // Check request method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const { image, processType } = await req.json();

    // Validate input
    if (!image) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check which API to use
    if (processType === 'face') {
      return await processFaceAPI(image);
    } else if (processType === 'vision') {
      return await processVisionAPI(image);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid process type' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Process image with Face API
async function processFaceAPI(imageData) {
  if (!FACE_API_KEY) {
    console.log('No Face API key found in environment. Using mock data.');
    // For development without API access, return mock data
    return new Response(
      JSON.stringify({
        faceDetected: true,
        emotions: {
          angry: 0.01,
          disgusted: 0.01,
          fearful: 0.01,
          happy: 0.85,
          neutral: 0.1,
          sad: 0.01,
          surprised: 0.01,
        },
        dominantEmotion: 'happy',
        age: 28,
        gender: 'male',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  try {
    // Get Face API endpoint from env or use default
    const faceApiEndpoint =
      Deno.env.get('FACE_API_ENDPOINT') ||
      'https://akshayapi.cognitiveservices.azure.com/';

    // Call the Azure Face API with proper authentication
    const response = await fetch(
      `${faceApiEndpoint}face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true&returnFaceAttributes=age,gender,emotion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': FACE_API_KEY,
        },
        body: Uint8Array.from(
          atob(imageData.replace(/^data:image\/\w+;base64,/, '')),
          c => c.charCodeAt(0)
        ),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Face API error:', response.status, errorText);
      throw new Error(`Face API returned ${response.status}: ${errorText}`);
    }

    const faceData = await response.json();

    // If no faces detected
    if (!faceData || faceData.length === 0) {
      return new Response(
        JSON.stringify({
          faceDetected: false,
          emotions: null,
          dominantEmotion: null,
          age: null,
          gender: null,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Process the first face detected
    const face = faceData[0];
    const emotions = face.faceAttributes.emotion;
    const emotionEntries = Object.entries(emotions);
    const dominantEmotion = emotionEntries.reduce((prev, current) =>
      prev[1] > current[1] ? prev : current
    )[0];

    const result = {
      faceDetected: true,
      emotions: emotions,
      dominantEmotion: dominantEmotion,
      age: face.faceAttributes.age,
      gender: face.faceAttributes.gender,
      landmarks: face.faceLandmarks,
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error calling Face API:', error);
    return new Response(
      JSON.stringify({ error: 'Face API error', details: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// Process image with Vision API
async function processVisionAPI(imageData) {
  if (!VISION_API_KEY) {
    console.log('No Vision API key found in environment. Using mock data.');
    // For development without API access, return mock data
    return new Response(
      JSON.stringify({
        objects: [
          {
            label: 'person',
            confidence: 0.95,
            bbox: { x: 10, y: 10, width: 100, height: 200 },
          },
          {
            label: 'laptop',
            confidence: 0.88,
            bbox: { x: 150, y: 80, width: 120, height: 90 },
          },
        ],
        text: null,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  try {
    // Get Vision API endpoint from env or use default
    const visionApiEndpoint =
      Deno.env.get('VISION_API_ENDPOINT') ||
      'https://visionapi.cognitiveservices.azure.com/';

    // Decode the base64 image for sending to Vision API
    const imageBuffer = Uint8Array.from(
      atob(imageData.replace(/^data:image\/\w+;base64,/, '')),
      c => c.charCodeAt(0)
    );

    // Call the Azure Computer Vision API
    const response = await fetch(
      `${visionApiEndpoint}vision/v3.2/analyze?visualFeatures=Objects,Text&language=en`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': VISION_API_KEY,
        },
        body: imageBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error:', response.status, errorText);
      throw new Error(`Vision API returned ${response.status}: ${errorText}`);
    }

    const visionData = await response.json();

    // Process detected objects
    const objects = visionData.objects
      ? visionData.objects.map(obj => ({
          label: obj.object,
          confidence: obj.confidence,
          bbox: {
            x: obj.rectangle.x,
            y: obj.rectangle.y,
            width: obj.rectangle.w,
            height: obj.rectangle.h,
          },
        }))
      : [];

    // Extract detected text
    let detectedText = null;
    if (
      visionData.text &&
      visionData.text.lines &&
      visionData.text.lines.length > 0
    ) {
      detectedText = visionData.text.lines.map(line => line.text).join(' ');
    }

    const result = {
      objects: objects,
      text: detectedText,
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error calling Vision API:', error);
    return new Response(
      JSON.stringify({ error: 'Vision API error', details: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}
