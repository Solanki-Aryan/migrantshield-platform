'use strict';

const axios = require('axios');

const LANGFLOW_URL = process.env.LANGFLOW_URL || 'http://localhost:7860';
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY;

const FLOW_IDS = {
  welfare: process.env.LANGFLOW_WELFARE_FLOW_ID || 'welfare-agent-flow',
  wage: process.env.LANGFLOW_WAGE_FLOW_ID || 'wage-agent-flow',
  grievance: process.env.LANGFLOW_GRIEVANCE_FLOW_ID || 'grievance-agent-flow',
  chatbot: process.env.LANGFLOW_CHATBOT_FLOW_ID || 'chatbot-flow',
};

/**
 * Build Axios request headers, including optional API key.
 * @returns {Object} headers object
 */
function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (LANGFLOW_API_KEY) {
    headers['x-api-key'] = LANGFLOW_API_KEY;
  }
  return headers;
}

/**
 * Returns true when the error looks like Langflow is simply not running.
 * @param {Error} err
 * @returns {boolean}
 */
function isUnavailableError(err) {
  if (!err) return false;
  const code = err.code || '';
  const status = err.response ? err.response.status : null;
  return (
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    status === 503 ||
    status === 502
  );
}

/**
 * Extract the output text from a Langflow v1 run response.
 * @param {Object} responseData
 * @returns {string}
 */
function extractOutputText(responseData) {
  try {
    return responseData.outputs[0].outputs[0].results.message.text;
  } catch (_) {
    // Fallback: look for any text field in the response
    const raw = JSON.stringify(responseData);
    const match = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    return match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
  }
}

/**
 * Call a Langflow flow by ID with the given input string.
 *
 * @param {string} flowId  - Langflow flow UUID or slug
 * @param {string|Object} inputs - Input value (string) or inputs object
 * @param {Object} [tweaks={}] - Optional node tweaks
 * @returns {Promise<Object>} Parsed Langflow response
 * @throws {Error} If Langflow is unavailable or returns an error
 */
async function callLangflow(flowId, inputs, tweaks = {}) {
  const inputValue = typeof inputs === 'string' ? inputs : JSON.stringify(inputs);

  const payload = {
    input_value: inputValue,
    input_type: 'text',
    output_type: 'text',
    tweaks,
  };

  const response = await axios.post(
    `${LANGFLOW_URL}/api/v1/run/${flowId}`,
    payload,
    {
      headers: buildHeaders(),
      timeout: 60000, // 60-second timeout for LLM calls
    }
  );

  return response.data;
}

// ---------------------------------------------------------------------------
// Public helper functions
// ---------------------------------------------------------------------------

/**
 * Extract skills, occupation and experience from a free-text job description.
 * Uses the grievance flow (Granite is good at entity extraction).
 * Falls back to keyword-based extraction if Langflow is unavailable.
 *
 * @param {string} description - Worker's self-described job history / skills
 * @returns {Promise<{skills: Array<{name: string, level: string, sector: string}>, occupation: string, experience: string}>}
 */
async function extractSkills(description) {
  const extractionPrompt =
    `Extract skills from this worker description: "${description}". ` +
    'Return JSON with: skills (array of {name, level: beginner/intermediate/expert, sector}), ' +
    'occupation (primary occupation), experience (years estimate as string). JSON only.';

  try {
    const data = await callLangflow(FLOW_IDS.grievance, extractionPrompt);
    const text = extractOutputText(data);

    // Parse JSON — Granite should return clean JSON when asked
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in skill extraction response');
  } catch (err) {
    if (isUnavailableError(err)) {
      console.warn('[langflowHelper] Langflow unavailable — returning stub skill extraction');
    } else {
      console.error('[langflowHelper] extractSkills error:', err.message);
    }

    // Fallback: simple keyword-based extraction
    const occupationKeywords = ['construction', 'driver', 'welder', 'mason', 'carpenter', 'painter', 'plumber', 'electrician', 'domestic', 'agriculture', 'textile', 'factory'];
    const occupation = occupationKeywords.find((k) => description.toLowerCase().includes(k)) || 'general_labour';
    const skills = occupation !== 'general_labour' ? [{ name: occupation, level: 'intermediate', sector: 'informal' }] : [];

    return {
      skills,
      occupation,
      experience: 'unknown',
    };
  }
}

/**
 * Classify a labor complaint and extract structured information.
 * Falls back to a stub classification if Langflow is unavailable.
 *
 * @param {string} description - Free-text complaint description
 * @returns {Promise<{category: string, severity: string, intent: string, entities: Object, recommendedAuthority: string, immediateActionRequired: boolean}>}
 */
async function classifyComplaint(description) {
  try {
    const data = await callLangflow(FLOW_IDS.grievance, description);
    const text = extractOutputText(data);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || 'other',
        severity: parsed.severity || 'medium',
        intent: parsed.intent || '',
        entities: parsed.key_entities || {},
        recommendedAuthority: parsed.recommended_authority || 'Labour Department',
        immediateActionRequired: Boolean(parsed.immediate_action_required),
      };
    }
    throw new Error('No JSON found in grievance classification response');
  } catch (err) {
    if (isUnavailableError(err)) {
      console.warn('[langflowHelper] Langflow unavailable — returning stub complaint classification');
    } else {
      console.error('[langflowHelper] classifyComplaint error:', err.message);
    }

    // Fallback: keyword-based category detection
    const lowerDesc = description.toLowerCase();
    let category = 'other';
    let severity = 'medium';
    let immediateActionRequired = false;

    if (lowerDesc.includes('wage') || lowerDesc.includes('salary') || lowerDesc.includes('pay')) {
      category = 'wage_dispute';
    } else if (lowerDesc.includes('unsafe') || lowerDesc.includes('accident') || lowerDesc.includes('injury')) {
      category = 'workplace_injury';
      severity = 'high';
      immediateActionRequired = true;
    } else if (lowerDesc.includes('harass') || lowerDesc.includes('abuse') || lowerDesc.includes('threat')) {
      category = 'harassment';
      severity = 'high';
    } else if (lowerDesc.includes('hours') || lowerDesc.includes('overtime')) {
      category = 'excessive_hours';
    } else if (lowerDesc.includes('forced') || lowerDesc.includes('bonded')) {
      category = 'forced_labor';
      severity = 'emergency';
      immediateActionRequired = true;
    }

    return {
      category,
      severity,
      intent: 'Seek resolution',
      entities: {},
      recommendedAuthority: 'Labour Department',
      immediateActionRequired,
    };
  }
}

/**
 * Get welfare scheme recommendations for a worker profile.
 * Falls back to a stub response if Langflow is unavailable.
 *
 * @param {Object} workerProfile - Worker profile object
 * @returns {Promise<{schemes: Array<{schemeName: string, eligibility: string, reason: string, requiredDocuments: string[]}>}>}
 */
async function getWelfareRecommendation(workerProfile) {
  const profileString = typeof workerProfile === 'string' ? workerProfile : JSON.stringify(workerProfile);

  try {
    const data = await callLangflow(FLOW_IDS.welfare, profileString);
    const text = extractOutputText(data);

    // Try to parse structured JSON if the model returned it; otherwise wrap raw text
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? { schemes: parsed } : parsed;
    }

    // Return raw text wrapped as a single scheme entry
    return {
      schemes: [
        {
          schemeName: 'Analysis Result',
          eligibility: 'potentially_eligible',
          reason: text,
          requiredDocuments: [],
        },
      ],
    };
  } catch (err) {
    if (isUnavailableError(err)) {
      console.warn('[langflowHelper] Langflow unavailable — returning stub welfare recommendation');
    } else {
      console.error('[langflowHelper] getWelfareRecommendation error:', err.message);
    }

    return {
      schemes: [
        {
          schemeName: 'e-Shram Registration',
          eligibility: 'potentially_eligible',
          reason: 'Most unorganised migrant workers are eligible for e-Shram. Detailed analysis requires Langflow.',
          requiredDocuments: ['Aadhaar card', 'Bank account details', 'Mobile number'],
        },
        {
          schemeName: 'PMJAY (Ayushman Bharat)',
          eligibility: 'potentially_eligible',
          reason: 'Workers from economically weaker sections may qualify. Detailed analysis requires Langflow.',
          requiredDocuments: ['Aadhaar card', 'Ration card or BPL certificate'],
        },
      ],
    };
  }
}

/**
 * Analyze a worker's wage for fairness against minimum wage regulations.
 * Falls back to a stub response if Langflow is unavailable.
 *
 * @param {Object} workerData - Worker wage data object
 * @returns {Promise<{verdict: string, percentageDiff: number|null, explanation: string, recommendedAction: string}>}
 */
async function analyzeWage(workerData) {
  const dataString = typeof workerData === 'string' ? workerData : JSON.stringify(workerData);

  try {
    const data = await callLangflow(FLOW_IDS.wage, dataString);
    const text = extractOutputText(data);

    // Try structured JSON first
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        verdict: parsed.verdict || parsed.fairness_verdict || 'Unknown',
        percentageDiff: parsed.percentage_difference ?? parsed.percentageDiff ?? null,
        explanation: parsed.explanation || '',
        recommendedAction: parsed.recommended_action || parsed.recommendedAction || '',
      };
    }

    // Parse plain-text response
    const verdictMatch = text.match(/verdict[:\s]+(Fair|Potentially Low|High Risk)/i);
    const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);

    return {
      verdict: verdictMatch ? verdictMatch[1] : 'Analysis Complete',
      percentageDiff: pctMatch ? parseFloat(pctMatch[1]) : null,
      explanation: text,
      recommendedAction: 'Review the full analysis above.',
    };
  } catch (err) {
    if (isUnavailableError(err)) {
      console.warn('[langflowHelper] Langflow unavailable — returning stub wage analysis');
    } else {
      console.error('[langflowHelper] analyzeWage error:', err.message);
    }

    return {
      verdict: 'Pending Analysis',
      percentageDiff: null,
      explanation: 'Wage analysis requires Langflow to be running. Please ensure Langflow is started and the wage agent flow is imported.',
      recommendedAction: 'Start Langflow and retry, or contact the Labour Department for manual verification.',
    };
  }
}

/**
 * Chat with a migrant worker via the AI chatbot flow.
 * Falls back to a stub response if Langflow is unavailable.
 *
 * @param {string} message - Worker's question
 * @param {Object|null} [workerContext=null] - Optional worker profile context
 * @returns {Promise<{response: string, sources: string[]}>}
 */
async function chatWithWorker(message, workerContext = null) {
  // Combine message and context into a single input string that the chatbot flow can parse
  const contextString = workerContext ? JSON.stringify(workerContext) : 'No context provided';
  const inputPayload = JSON.stringify({
    message,
    worker_context: contextString,
  });

  try {
    const data = await callLangflow(FLOW_IDS.chatbot, inputPayload);
    const text = extractOutputText(data);

    // Extract source citations if the model included them (format: [Source: ...])
    const sourcePattern = /\[Source:\s*([^\]]+)\]/g;
    const sources = [];
    let match;
    while ((match = sourcePattern.exec(text)) !== null) {
      sources.push(match[1].trim());
    }

    // Clean citations from the main response text
    const response = text.replace(sourcePattern, '').trim();

    return { response, sources };
  } catch (err) {
    if (isUnavailableError(err)) {
      console.warn('[langflowHelper] Langflow unavailable — returning stub chatbot response');
    } else {
      console.error('[langflowHelper] chatWithWorker error:', err.message);
    }

    return {
      response:
        "I'm currently unable to process your question as the AI service is temporarily unavailable. " +
        'For urgent assistance, please contact your nearest Labour Department office or call the ' +
        'national helpline at 14434. You can also visit the e-Shram portal at eshram.gov.in.',
      sources: [],
    };
  }
}

module.exports = {
  callLangflow,
  extractSkills,
  classifyComplaint,
  getWelfareRecommendation,
  analyzeWage,
  chatWithWorker,
};
