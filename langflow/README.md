# MigrantShield — Langflow AI Flows

This directory contains Langflow flow configurations for MigrantShield's AI-powered features. All flows use **IBM Granite 13B Chat (ibm/granite-13b-chat-v2)** via **Watsonx.ai** for language understanding and **MongoDB Atlas Vector Search** for document retrieval.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10 or higher |
| pip | 22+ |
| Langflow | 1.0+ |
| MongoDB Atlas | M10+ cluster (for vector search) |
| IBM Watsonx.ai account | Active with Granite model access |

Install Langflow:

```bash
pip install langflow
```

Or install with extras for full component support:

```bash
pip install langflow[all]
```

---

## Starting Langflow

```bash
python -m langflow run
```

Langflow will be available at `http://localhost:7860` by default.

To bind to a different host/port:

```bash
python -m langflow run --host 0.0.0.0 --port 7860
```

To run with an API key (recommended for production):

```bash
python -m langflow run --env-file /path/to/.env
```

---

## Importing the Flows

1. Open Langflow UI at `http://localhost:7860`
2. Click **"New Flow"** → **"Upload"** (or drag-and-drop)
3. Select a JSON file from `migrantshield/langflow/flows/`
4. The flow opens in the canvas editor

Alternatively, import via Langflow REST API:

```bash
curl -X POST http://localhost:7860/api/v1/flows/ \
  -H "Content-Type: application/json" \
  -H "x-api-key: $LANGFLOW_API_KEY" \
  -d @migrantshield/langflow/flows/welfare_agent.json
```

After import, copy the **flow ID** from the Langflow UI (visible in the URL or flow settings) and set it in the backend `.env` file.

---

## Environment Variables

Set these in `migrantshield/backend/.env` (see `.env.example`):

```env
# Langflow connection
LANGFLOW_URL=http://localhost:7860
LANGFLOW_API_KEY=your_langflow_api_key

# Flow IDs — copy from Langflow UI after importing each flow
LANGFLOW_WELFARE_FLOW_ID=welfare-agent-flow-id
LANGFLOW_WAGE_FLOW_ID=wage-agent-flow-id
LANGFLOW_GRIEVANCE_FLOW_ID=grievance-agent-flow-id
LANGFLOW_CHATBOT_FLOW_ID=chatbot-flow-id

# IBM Watsonx.ai
WATSONX_API_KEY=your_watsonx_api_key
WATSONX_PROJECT_ID=your_watsonx_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
GRANITE_MODEL_ID=ibm/granite-13b-chat-v2

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/migrantshield
```

---

## Configuring IBM Granite (Watsonx.ai)

Each flow has a **CustomComponent** node labelled `IBM Granite LLM (Watsonx.ai)`. Configure these fields in the node settings:

| Field | Value |
|---|---|
| Model ID | `ibm/granite-13b-chat-v2` |
| Watsonx API Key | Your IBM Cloud API key |
| Watsonx Project ID | Your Watsonx.ai project ID |
| Watsonx URL | `https://us-south.ml.cloud.ibm.com` (or your region) |

**Getting Watsonx credentials:**

1. Log in to [IBM Cloud](https://cloud.ibm.com)
2. Navigate to **Watsonx.ai** → your project
3. Go to **Project Settings** → copy the **Project ID**
4. Go to **Manage** → **API keys** → create an API key

The Watsonx.ai text generation endpoint used internally:

```
POST {WATSONX_URL}/ml/v1/text/generation?version=2023-05-29
```

---

## Configuring MongoDB Atlas Vector Search

Each flow with retrieval has a **VectorStoreRetriever** node. Configure:

| Field | Value |
|---|---|
| MongoDB Atlas URI | Your Atlas connection string |
| Collection Name | See per-flow details below |
| Vector Index Name | See per-flow details below |
| Embedding Model | `ibm/slate-125m-english-rtrvr` |
| Top K | 4–5 results |

**Creating vector indexes in MongoDB Atlas:**

1. Open Atlas UI → your cluster → **Browse Collections**
2. Select the target collection → **Search Indexes** tab
3. Click **Create Search Index** → **Atlas Vector Search** → JSON editor
4. Use this index definition template:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

---

## Flow Descriptions

### 1. Welfare Eligibility Agent (`welfare_agent.json`)

**Purpose:** Determines which government welfare schemes a migrant worker is eligible for.

**Flow:** Worker Profile JSON → Vector Search (`welfare_schemes` collection) → Granite 13B → Eligibility Report

**Input:** Worker profile JSON (name, age, occupation, state, income, documents held)

**Output:** Per-scheme eligibility status (`eligible` / `potentially_eligible` / `not_eligible`), reason, and list of required documents

**MongoDB collection:** `welfare_schemes` | **Vector index:** `welfare_vector_index`

---

### 2. Wage Fairness Agent (`wage_agent.json`)

**Purpose:** Compares a worker's current wage against applicable state minimum wage notifications.

**Flow:** Worker Wage Data JSON → Vector Search (`wage_regulations` collection) → Granite 13B → Wage Fairness Report

**Input:** Worker wage data JSON (occupation, state, current daily wage, hours, employer sector)

**Output:** Fairness verdict (`Fair` / `Potentially Low` / `High Risk`), percentage difference from legal minimum, plain-language explanation, recommended action

**MongoDB collection:** `wage_regulations` | **Vector index:** `wage_vector_index`

---

### 3. Grievance Classification Agent (`grievance_agent.json`)

**Purpose:** Extracts structured information from free-text labor complaints. No RAG — relies entirely on Granite's classification capability.

**Flow:** Complaint Text → Granite 13B (classifier) → Structured JSON

**Input:** Free-text complaint description (any language)

**Output:** JSON with `category`, `severity`, `intent`, `key_entities`, `recommended_authority`, `immediate_action_required`

**Categories:** `wage_dispute` / `unsafe_workplace` / `harassment` / `excessive_hours` / `no_safety_equipment` / `workplace_injury` / `forced_labor` / `accommodation` / `other`

---

### 4. Worker AI Chatbot (`chatbot_flow.json`)

**Purpose:** Answers general worker questions about welfare, wages, complaints, and job information, grounded exclusively in retrieved official government documents.

**Flow:** User Message + Worker Context → Intent Detection (Granite) → Vector Search (`government_documents` collection) → Main Answer (Granite) → Response with Sources

**Input:** User question (any Indian language supported) + optional worker context JSON

**Output:** Grounded answer in simple language; responds in Hindi/regional language if question is in that language

**MongoDB collection:** `government_documents` | **Vector index:** `documents_vector_index`

**Fallback:** If no relevant documents are found, the model replies: *"I don't have verified information about this. Please contact your nearest labor office."*

---

## API Usage — Calling Flows from the Backend

The backend uses `migrantshield/backend/utils/langflowHelper.js` to call flows via the Langflow REST API.

**Langflow run endpoint:**

```
POST http://localhost:7860/api/v1/run/{flow_id}
```

**Example request body:**

```json
{
  "input_value": "<your input string>",
  "input_type": "text",
  "output_type": "text",
  "tweaks": {}
}
```

**Example response:**

```json
{
  "outputs": [
    {
      "outputs": [
        {
          "results": {
            "message": {
              "text": "The worker is eligible for PM-KISAN scheme because..."
            }
          }
        }
      ]
    }
  ]
}
```

**Backend helper functions:**

| Function | Flow Used | Description |
|---|---|---|
| `getWelfareRecommendation(workerProfile)` | welfare_agent | Scheme eligibility check |
| `analyzeWage(workerData)` | wage_agent | Wage fairness analysis |
| `classifyComplaint(description)` | grievance_agent | Complaint classification |
| `chatWithWorker(message, context)` | chatbot_flow | Worker Q&A |
| `extractSkills(description)` | grievance_agent | Skill/occupation extraction |

All functions include fallback stub responses so the platform continues to work even if Langflow is unavailable.

---

## Troubleshooting

**Langflow won't start:**
```bash
# Upgrade langflow
pip install --upgrade langflow
# Check Python version (must be 3.10+)
python --version
```

**MongoDB Atlas connection fails:**
- Ensure your Atlas cluster IP access list includes the Langflow host IP
- Check your connection string includes the database name

**Granite model not responding:**
- Verify `WATSONX_API_KEY` is valid and not expired
- Confirm the model `ibm/granite-13b-chat-v2` is enabled in your Watsonx.ai project
- Check the region — use `eu-de.ml.cloud.ibm.com` for Frankfurt, `jp-tok.ml.cloud.ibm.com` for Tokyo

**Flow ID not found:**
- After importing a flow in the Langflow UI, the URL changes to `/flow/{uuid}`
- Copy that UUID and set it as the appropriate `LANGFLOW_*_FLOW_ID` in `.env`
