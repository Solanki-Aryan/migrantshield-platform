const express = require('express');
const axios = require('axios');
const Worker = require('../models/Worker');
const WelfareScheme = require('../models/WelfareScheme');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper: POST to a Langflow flow endpoint.
 * Falls back gracefully if Langflow is unavailable.
 */
const callLangflow = async (flowId, inputs) => {
  const langflowUrl = process.env.LANGFLOW_URL;
  const langflowKey = process.env.LANGFLOW_API_KEY;

  if (!langflowUrl || !langflowKey) {
    throw new Error('Langflow not configured');
  }

  const response = await axios.post(
    `${langflowUrl}/api/v1/run/${flowId}`,
    {
      input_value: inputs.message || JSON.stringify(inputs),
      input_type: 'chat',
      output_type: 'chat',
      tweaks: inputs.tweaks || {},
    },
    {
      headers: {
        Authorization: `Bearer ${langflowKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text || null;
};

// POST /api/ai/chat — general chatbot
router.post('/chat', verifyToken, async (req, res, next) => {
  try {
    const { message, workerId } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    let workerContext = null;
    if (workerId) {
      const worker = await Worker.findById(workerId).populate('skills.skillId');
      if (worker) {
        workerContext = {
          sector: worker.sector,
          occupation: worker.occupation,
          currentState: worker.currentState,
        };
      }
    }

    let reply;
    try {
      reply = await callLangflow('chatbot_flow', { message, workerContext });
    } catch {
      // Stub response when Langflow is unavailable
      reply =
        'Namaste! I am MigrantShield AI Assistant. I can help you with welfare scheme information, wage queries, and grievance guidance. Langflow service is currently unavailable — please try again later or contact your labor officer directly.';
    }

    res.json({ success: true, reply, source: reply ? 'langflow' : 'stub' });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/extract-skills — forward to Langflow skill extraction
router.post('/extract-skills', verifyToken, async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    let result;
    try {
      result = await callLangflow('skill-extraction', { message: description });
    } catch {
      // Keyword-based stub
      const keywords = [
        'mason', 'welder', 'electrician', 'plumber', 'carpenter', 'painter',
        'diamond polishing', 'textile', 'machine operator', 'helper', 'driver',
        'cook', 'tailor', 'embroidery', 'security guard',
      ];
      const found = keywords.filter((kw) =>
        description.toLowerCase().includes(kw.toLowerCase())
      );
      result = found.length > 0 ? found.join(', ') : 'general labor';
    }

    res.json({ success: true, extractedSkills: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/classify-complaint — classify a grievance using AI
router.post('/classify-complaint', verifyToken, async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    let classification;
    try {
      const raw = await callLangflow('grievance_agent', { message: description });
      classification = raw;
    } catch {
      // Stub classification based on keyword detection
      const lc = description.toLowerCase();
      let category = 'other';
      let severity = 'medium';

      if (lc.includes('wage') || lc.includes('salary') || lc.includes('pay')) {
        category = 'wage_dispute';
      } else if (lc.includes('unsafe') || lc.includes('accident') || lc.includes('injury')) {
        category = 'unsafe_workplace';
        severity = 'high';
      } else if (lc.includes('harass') || lc.includes('abuse') || lc.includes('assault')) {
        category = 'harassment';
        severity = 'high';
      } else if (lc.includes('overtime') || lc.includes('hours') || lc.includes('work time')) {
        category = 'excessive_hours';
      } else if (lc.includes('forced') || lc.includes('bonded') || lc.includes('locked')) {
        category = 'forced_labor';
        severity = 'emergency';
      }

      classification = JSON.stringify({ category, severity, intent: 'grievance', entities: [] });
    }

    res.json({ success: true, classification });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/welfare-recommendation — eligibility + RAG recommendation
router.post('/welfare-recommendation', verifyToken, async (req, res, next) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId is required.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    // Compute local eligibility
    const schemes = await WelfareScheme.find({ isActive: true });
    const workerAge = worker.personalDetails?.dob
      ? Math.floor(
          (Date.now() - new Date(worker.personalDetails.dob).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;

    const eligible = schemes.filter((s) => {
      const e = s.eligibility;
      if (workerAge !== null) {
        if (e.minAge && workerAge < e.minAge) return false;
        if (e.maxAge && workerAge > e.maxAge) return false;
      }
      if (e.sectors && e.sectors.length > 0 && !e.sectors.includes('all')) {
        if (worker.sector && !e.sectors.includes(worker.sector)) return false;
      }
      return true;
    });

    let aiRecommendation;
    try {
      const context = {
        message: `Worker sector: ${worker.sector}, state: ${worker.currentState}, age: ${workerAge}. Eligible schemes: ${eligible.map((s) => s.schemeName).join(', ')}`,
      };
      aiRecommendation = await callLangflow('welfare_agent', context);
    } catch {
      aiRecommendation =
        eligible.length > 0
          ? `Based on your profile, you may be eligible for: ${eligible.map((s) => s.schemeName).join(', ')}. Please apply through the official government portals.`
          : 'No matching welfare schemes found for your current profile. Please update your profile or contact your labor officer.';
    }

    res.json({
      success: true,
      workerId,
      eligibleSchemes: eligible,
      aiRecommendation,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
