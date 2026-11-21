/**
 * ValuVid Automated C2PA & Synthetic Media Provenance Detector
 * Inspects binary file headers, XMP provenance blocks, C2PA manifests,
 * and generator signatures (Sora, Midjourney, OpenAI, Runway, Pika, Kling, ElevenLabs, etc.)
 */

export interface AIDetectionResult {
  isAiDetected: boolean;
  confidence: 'high' | 'medium' | 'low';
  generatorName?: string;
  detectedSignatures: string[];
  disclosureType: 'generated' | 'assisted';
}

const AI_SIGNATURES: { pattern: RegExp; name: string; type: 'generated' | 'assisted' }[] = [
  // C2PA & Content Credentials standards
  { pattern: /c2pa(?:\.manifest|\.claim|\.assertions)?/i, name: 'C2PA Provenance Manifest', type: 'generated' },
  { pattern: /contentcredentials\.org/i, name: 'Content Credentials', type: 'generated' },
  { pattern: /adobe:c2pa/i, name: 'Adobe C2PA Metadata', type: 'generated' },
  
  // Major Generative Video / Image / Audio platforms
  { pattern: /sora(?:\.openai)?/i, name: 'OpenAI Sora', type: 'generated' },
  { pattern: /openai(?:\/dall-e|\/sora|\/tts)?/i, name: 'OpenAI Engine', type: 'generated' },
  { pattern: /midjourney/i, name: 'Midjourney', type: 'generated' },
  { pattern: /runway(?:ml)?|gen-?2|gen-?3/i, name: 'Runway Gen', type: 'generated' },
  { pattern: /pika(?:\.art|labs)?/i, name: 'Pika Labs', type: 'generated' },
  { pattern: /luma(?:labs)?|dream\s*machine/i, name: 'Luma Dream Machine', type: 'generated' },
  { pattern: /kling(?:ai)?/i, name: 'Kling AI', type: 'generated' },
  { pattern: /elevenlabs/i, name: 'ElevenLabs Voice AI', type: 'assisted' },
  { pattern: /synthesia/i, name: 'Synthesia AI Avatar', type: 'generated' },
  { pattern: /heygen/i, name: 'HeyGen AI Avatar', type: 'generated' },
  { pattern: /d-id(?:\.com)?/i, name: 'D-ID Talking Face', type: 'generated' },
  { pattern: /deepfacelab|faceswap/i, name: 'Deepfake Swap Tool', type: 'generated' },
  { pattern: /comfyui|automatic1111|stablediffusion|novelai/i, name: 'Stable Diffusion / ComfyUI', type: 'generated' },
];

export async function detectAiInMediaFile(file: File): Promise<AIDetectionResult> {
  const detectedSignatures: string[] = [];
  let primaryGenerator: string | undefined;
  let disclosureType: 'generated' | 'assisted' = 'generated';

  // 1. Check filename heuristics
  const lowerName = file.name.toLowerCase();
  for (const sig of AI_SIGNATURES) {
    if (sig.pattern.test(lowerName)) {
      detectedSignatures.push(sig.name);
      primaryGenerator = sig.name;
      disclosureType = sig.type;
      break;
    }
  }

  // 2. Read file header (first 128KB) and footer (last 64KB where MP4 moov metadata lives)
  try {
    const headerChunk = await readFileSliceAsText(file, 0, Math.min(file.size, 131072));
    let footerChunk = '';
    if (file.size > 131072) {
      footerChunk = await readFileSliceAsText(file, Math.max(0, file.size - 65536), file.size);
    }
    const combined = headerChunk + ' ' + footerChunk;

    for (const sig of AI_SIGNATURES) {
      if (sig.pattern.test(combined)) {
        if (!detectedSignatures.includes(sig.name)) {
          detectedSignatures.push(sig.name);
        }
        if (!primaryGenerator) {
          primaryGenerator = sig.name;
          disclosureType = sig.type;
        }
      }
    }
  } catch (err) {
    console.debug('[AIDetector] Header inspection warning:', err);
  }

  return {
    isAiDetected: detectedSignatures.length > 0,
    confidence: detectedSignatures.length > 1 ? 'high' : detectedSignatures.length === 1 ? 'medium' : 'low',
    generatorName: primaryGenerator,
    detectedSignatures,
    disclosureType,
  };
}

function readFileSliceAsText(file: File, start: number, end: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const slice = file.slice(start, end);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else if (result instanceof ArrayBuffer) {
        // Decode bytes to latin1/ascii string to preserve binary markers
        const bytes = new Uint8Array(result);
        let str = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          str += String.fromCharCode(bytes[i]);
        }
        resolve(str);
      } else {
        resolve('');
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(slice);
  });
}
