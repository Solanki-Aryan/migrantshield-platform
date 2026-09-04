'use strict';

const axios = require('axios');

const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token';
const WATSONX_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID;
const GRANITE_MODEL_ID = process.env.GRANITE_MODEL_ID || 'ibm/granite-13b-chat-v2';

// Simple in-process token cache to avoid fetching a new IAM token for every request
let _cachedToken = null;
let _tokenExpiresAt = 0; // Unix timestamp (ms)
const TOKEN_BUFFER_MS = 60 * 1000; // Refresh 60 s before expiry

/**
 * Fetch an IAM access token from IBM Cloud using an API key.
 * Results are cached in-process until close to expiry.
 *
 * @param {string} apiKey - IBM Cloud API key
 * @returns {Promise<string>} IAM access token
 */
async function getIAMToken(apiKey) {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiresAt - TOKEN_BUFFER_MS) {
    return _cachedToken;
  }

  const response = await axios.post(
    IAM_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    }
  );

  const { access_token, expires_in } = response.data;
  _cachedToken = access_token;
  // expires_in is in seconds
  _tokenExpiresAt = now + (expires_in || 3600) * 1000;

  return _cachedToken;
}

/**
 * Call IBM Watsonx.ai Granite model for text generation.
 *
 * @param {string} prompt - The full prompt string to send to the model
 * @param {Object} [options={}] - Optional generation parameters
 * @param {number} [options.max_new_tokens=512] - Maximum tokens to generate
 * @param {number} [options.temperature=0.2] - Sampling temperature (0.0 = deterministic)
 * @param {number} [options.top_p=1] - Nucleus sampling probability
 * @param {number} [options.repetition_penalty=1.1] - Penalty for repeated tokens
 * @param {string} [options.model_id] - Override the model ID
 * @param {string} [options.project_id] - Override the Watsonx project ID
 * @returns {Promise<string>} Generated text from Granite
 * @throws {Error} If the Watsonx.ai API call fails
 */
async function callGranite(prompt, options = {}) {
  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) {
    throw new Error('WATSONX_API_KEY environment variable is not set');
  }

  const projectId = options.project_id || WATSONX_PROJECT_ID;
  if (!projectId) {
    throw new Error('WATSONX_PROJECT_ID environment variable is not set');
  }

  const token = await getIAMToken(apiKey);

  const payload = {
    model_id: options.model_id || GRANITE_MODEL_ID,
    input: prompt,
    project_id: projectId,
    parameters: {
      decoding_method: options.temperature === 0 ? 'greedy' : 'sample',
      max_new_tokens: options.max_new_tokens ?? 512,
      temperature: options.temperature ?? 0.2,
      top_p: options.top_p ?? 1,
      repetition_penalty: options.repetition_penalty ?? 1.1,
    },
  };

  const response = await axios.post(
    `${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 60000,
    }
  );

  // Watsonx.ai response: { results: [{ generated_text: "..." }] }
  const results = response.data && response.data.results;
  if (!results || results.length === 0) {
    throw new Error('Watsonx.ai returned an empty results array');
  }

  return results[0].generated_text || '';
}

/**
 * Classify complaint text using Granite directly (bypasses Langflow).
 * Useful as a direct fallback or standalone classification call.
 *
 * @param {string} complaintText
 * @returns {Promise<Object>} Parsed classification object
 */
async function classifyComplaintDirect(complaintText) {
  const prompt =
    'You are a labor complaint classifier. Analyze this complaint: ' +
    `"${complaintText}". ` +
    'Return JSON only with: category (wage_dispute/unsafe_workplace/harassment/' +
    'excessive_hours/no_safety_equipment/workplace_injury/forced_labor/accommodation/other), ' +
    'severity (low/medium/high/emergency), intent (string), ' +
    'key_entities (object), recommended_authority (string), immediate_action_required (boolean).';

  const text = await callGranite(prompt, { temperature: 0, max_new_tokens: 512 });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Granite did not return valid JSON for complaint classification');
}

/**
 * Get welfare scheme eligibility using Granite directly (bypasses Langflow).
 *
 * @param {Object|string} workerProfile
 * @param {string} [schemeContext=''] - Optional scheme information to include
 * @returns {Promise<Object>} Eligibility result
 */
async function getWelfareEligibilityDirect(workerProfile, schemeContext = '') {
  const profileString =
    typeof workerProfile === 'string' ? workerProfile : JSON.stringify(workerProfile);

  const contextSection = schemeContext
    ? `Relevant welfare scheme documents: ${schemeContext}.`
    : 'Use your knowledge of Indian government welfare schemes for unorganised workers.';

  const prompt =
    `You are a welfare eligibility assistant. Worker profile: ${profileString}. ` +
    `${contextSection} ` +
    'Determine which schemes the worker is eligible for. Return JSON array where each item has: ' +
    'schemeName, eligibility (eligible/potentially_eligible/not_eligible), reason, requiredDocuments (array).';

  const text = await callGranite(prompt, { temperature: 0.1, max_new_tokens: 1024 });
  const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return { schemes: Array.isArray(parsed) ? parsed : [parsed] };
  }
  return {
    schemes: [{ schemeName: 'Analysis', eligibility: 'potentially_eligible', reason: text, requiredDocuments: [] }],
  };
}

module.exports = {
  getIAMToken,
  callGranite,
  classifyComplaintDirect,
  getWelfareEligibilityDirect,
};
