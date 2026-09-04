const express = require('express');
const axios = require('axios');
const Skill = require('../models/Skill');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/skills — public list of skills
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.sector) filter.sector = req.query.sector;
    if (req.query.level) filter.level = req.query.level;

    const skills = await Skill.find(filter).sort({ skillName: 1 });
    res.json({ success: true, count: skills.length, skills });
  } catch (error) {
    next(error);
  }
});

// POST /api/skills — admin only
router.post('/', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ success: true, message: 'Skill created.', skill });
  } catch (error) {
    next(error);
  }
});

// POST /api/skills/extract — extract skills from free-text description
router.post('/extract', verifyToken, async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    // Try Langflow skill extraction flow
    const langflowUrl = process.env.LANGFLOW_URL;
    const langflowKey = process.env.LANGFLOW_API_KEY;

    if (langflowUrl && langflowKey) {
      try {
        const response = await axios.post(
          `${langflowUrl}/api/v1/run/skill-extraction`,
          { input_value: description, input_type: 'chat', output_type: 'chat' },
          {
            headers: {
              Authorization: `Bearer ${langflowKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );
        const result = response.data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;
        return res.json({ success: true, source: 'langflow', extractedSkills: result });
      } catch (langflowErr) {
        console.warn('Langflow unavailable, using stub:', langflowErr.message);
      }
    }

    // Stub fallback: keyword-based extraction
    const keywords = [
      'mason', 'welder', 'electrician', 'plumber', 'carpenter', 'painter',
      'diamond polishing', 'textile', 'machine operator', 'helper', 'driver',
      'cook', 'tailor', 'embroidery', 'security guard',
    ];
    const found = keywords.filter((kw) =>
      description.toLowerCase().includes(kw.toLowerCase())
    );

    res.json({
      success: true,
      source: 'stub',
      extractedSkills: found.length > 0 ? found : ['general labor'],
      message: 'Langflow not available — used keyword extraction.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
