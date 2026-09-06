import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysis, IssueCategory, IssueSeverity } from '../types';

// Heuristic fallback in case Gemini API key is not configured or network drops
export function generateFallbackAnalysis(
  title: string,
  description: string,
  userCategory?: string
): AIAnalysis {
  const combined = `${title} ${description}`.toLowerCase();

  let severity: IssueSeverity = 'medium';
  let category: IssueCategory = (userCategory as IssueCategory) || 'other';

  // Category detection
  if (combined.includes('pothole') || combined.includes('road') || combined.includes('crack') || combined.includes('asphalt')) {
    category = 'road_damage';
  } else if (combined.includes('light') || combined.includes('lamp') || combined.includes('dark')) {
    category = 'streetlight';
  } else if (combined.includes('garbage') || combined.includes('trash') || combined.includes('waste') || combined.includes('bin')) {
    category = 'garbage';
  } else if (combined.includes('water') || combined.includes('pipe') || combined.includes('gush') || combined.includes('leak')) {
    category = 'water_leakage';
  } else if (combined.includes('drain') || combined.includes('sewer') || combined.includes('flooding') || combined.includes('waterlog')) {
    category = 'drainage';
  } else if (combined.includes('electric') || combined.includes('wire') || combined.includes('signal') || combined.includes('spark')) {
    category = 'electricity';
  }

  // Severity classification
  if (
    combined.includes('danger') ||
    combined.includes('fire') ||
    combined.includes('shock') ||
    combined.includes('fall') ||
    combined.includes('collapse') ||
    combined.includes('emergency') ||
    combined.includes('severe flooding')
  ) {
    severity = 'critical';
  } else if (
    combined.includes('deep') ||
    combined.includes('large') ||
    combined.includes('overflow') ||
    combined.includes('hazard') ||
    combined.includes('blocked')
  ) {
    severity = 'high';
  } else if (
    combined.includes('minor') ||
    combined.includes('bench') ||
    combined.includes('cosmetic') ||
    combined.includes('faint')
  ) {
    severity = 'low';
  }

  // Build clean summary adhering to: concise, no repetition, never claims confirmed
  const cleanTitle = title.trim().replace(/[.!]+$/, '');
  const summary = `${cleanTitle} reported, requiring municipal inspection and assessment.`;

  return {
    summary,
    category,
    severity,
    confidence: 0.88,
    reason: `Automated rule-based heuristic detected keyword indicators relating to ${category.replace('_', ' ')} with ${severity} urgency.`,
    recommended_action: `Dispatch civic field technician to verify reported site conditions and schedule appropriate crew remediation.`,
  };
}

export async function analyzeIssueWithGemini(
  title: string,
  description: string,
  category?: string,
  location?: string,
  photoBase64?: string
): Promise<AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return generateFallbackAnalysis(title, description, category);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `
You are an AI Civic Intelligence and Safety Classifier for Citypulse, an official community reporting platform.
Evaluate this citizen report carefully.
Guidelines:
1. Summary: Must be 1-2 concise sentences. Remove unnecessary repetition. Preserve key facts. Never invent unmentioned facts. Never claim an issue is confirmed when it is only reported (e.g. "Pothole reported near...").
2. Category: Choose strictly from: "road_damage", "streetlight", "garbage", "water_leakage", "drainage", "electricity", "public_space", "infrastructure", "other".
3. Severity: Classify strictly into one of:
   - "low": Minor inconvenience, cosmetic issue, or slightly damaged pavement.
   - "medium": Noticeable community inconvenience (broken streetlight, moderate trash).
   - "high": Significant safety, health, accessibility, or infrastructure concern (large pothole, heavy water leak, blocked storm drain).
   - "critical": Potential immediate serious danger (active fire, major electrical hazard, high risk falling sewer pit, severe flooding).
4. Confidence: A decimal number between 0.70 and 0.99 indicating classification certainty.
5. Reason: Objective explanation of why this severity and category was chosen based on reported facts.
6. Recommended Action: Concrete municipal or public works action to resolve or contain the issue.

Citizen Report Details:
- Title: ${title}
- Description: ${description}
- User Selected Category: ${category || 'None provided'}
- Location / Address: ${location || 'None provided'}
`;

    const contents: any[] = [];
    if (photoBase64 && photoBase64.startsWith('data:')) {
      const commaIdx = photoBase64.indexOf(',');
      const mime = photoBase64.substring(5, photoBase64.indexOf(';'));
      const rawBase64 = photoBase64.substring(commaIdx + 1);
      contents.push({
        inlineData: {
          mimeType: mime,
          data: rawBase64,
        },
      });
    }

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Concise 1-2 sentence factual summary of reported issue.',
            },
            category: {
              type: Type.STRING,
              description: 'Issue category code.',
            },
            severity: {
              type: Type.STRING,
              description: 'Predicted severity level: low, medium, high, or critical.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.7 and 0.99.',
            },
            reason: {
              type: Type.STRING,
              description: 'Objective explanation for severity determination.',
            },
            recommended_action: {
              type: Type.STRING,
              description: 'Actionable recommendation for public works / civic response.',
            },
          },
          required: ['summary', 'category', 'severity', 'confidence', 'reason', 'recommended_action'],
        },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      return generateFallbackAnalysis(title, description, category);
    }

    const parsed = JSON.parse(jsonText);

    // Validate category & severity enum bounds
    const validCategories: IssueCategory[] = [
      'road_damage',
      'streetlight',
      'garbage',
      'water_leakage',
      'drainage',
      'electricity',
      'public_space',
      'infrastructure',
      'other',
    ];
    const validSeverities: IssueSeverity[] = ['low', 'medium', 'high', 'critical'];

    const normalizedCategory = validCategories.includes(parsed.category)
      ? parsed.category
      : (category as IssueCategory) || 'other';

    const normalizedSeverity = validSeverities.includes(parsed.severity)
      ? parsed.severity
      : 'medium';

    return {
      summary: parsed.summary || `${title} reported for municipal evaluation.`,
      category: normalizedCategory,
      severity: normalizedSeverity,
      confidence: typeof parsed.confidence === 'number' ? Math.min(0.99, Math.max(0.7, parsed.confidence)) : 0.91,
      reason: parsed.reason || 'Report evaluated for civic safety impact and community urgency.',
      recommended_action: parsed.recommended_action || 'Inspect reported site conditions and schedule appropriate response.',
    };
  } catch (error) {
    console.error('Error invoking Gemini AI, falling back to local heuristic analysis:', error);
    return generateFallbackAnalysis(title, description, category);
  }
}
