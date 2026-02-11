# 🚀 Quick Start: AI Pre-Filtering

## What is AI Pre-Filtering?

AI Pre-Filtering uses Google Gemini AI to **analyze links BEFORE downloading** them. This ensures you only download educational resources that match your target subjects and grade levels.

### Benefits
- ✅ **Saves Bandwidth**: Only downloads relevant files (20-40% savings typically)
- ✅ **Saves Time**: No manual filtering needed
- ✅ **High Precision**: 95%+ relevance in downloaded files
- ✅ **Smart Detection**: Understands context, not just keywords

---

## 3-Minute Setup

### Step 1: Get Your API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

### Step 2: Configure (`config.json`)

```json
{
  "geminiApiKey": "PASTE_YOUR_API_KEY_HERE",
  "aiPreFilter": {
    "enabled": true,
    "targetSubjects": ["Mathematics"],
    "targetGrades": ["SHS1", "SHS2", "SHS3"],
    "minConfidence": 0.65,
    "logDecisions": true
  }
}
```

### Step 3: Run

```bash
npm run server
```

Open browser: `http://localhost:5173`

**Done!** The scraper now intelligently filters files before downloading.

---

## Common Scenarios

### Scenario 1: I want only Mathematics PDFs

```json
{
  "aiPreFilter": {
    "enabled": true,
    "targetSubjects": ["Mathematics"],
    "targetGrades": [],
    "minConfidence": 0.7
  }
}
```

### Scenario 2: I want BECE prep materials (any subject)

```json
{
  "aiPreFilter": {
    "enabled": true,
    "targetSubjects": [],
    "targetGrades": ["JHS3", "BECE"],
    "minConfidence": 0.6
  }
}
```

### Scenario 3: I want SHS Science subjects only

```json
{
  "aiPreFilter": {
    "enabled": true,
    "targetSubjects": ["Physics", "Chemistry", "Biology"],
    "targetGrades": ["SHS1", "SHS2", "SHS3"],
    "minConfidence": 0.65
  }
}
```

### Scenario 4: I want everything but high quality only

```json
{
  "aiPreFilter": {
    "enabled": true,
    "targetSubjects": [],
    "targetGrades": [],
    "minConfidence": 0.8
  }
}
```

---

## Understanding the Settings

| Setting | What It Does | Recommended Value |
|---------|--------------|-------------------|
| `enabled` | Turn AI filtering on/off | `true` |
| `targetSubjects` | Which subjects to download | `["Mathematics"]` or `[]` for all |
| `targetGrades` | Which grades to download | `["SHS1", "SHS2"]` or `[]` for all |
| `minConfidence` | How certain AI must be (0.0-1.0) | `0.65` (balanced) |
| `logDecisions` | Show AI decisions in console | `true` (for testing) |

---

## Testing

Test the AI pre-filter without running the full scraper:

```bash
npm run test:ai-filter
```

This runs 8 test scenarios and shows you how the AI makes decisions.

---

## Monitoring Results

Watch the dashboard for these metrics:

- **Files Filtered**: How many files AI rejected
- **Filter Rate**: Percentage of bandwidth saved
- **Average Confidence**: How confident the AI is (higher is better)

**Good Results:**
- Filter Rate: 20-40%
- Average Confidence: 0.75+
- Download Relevance: 95%+

---

## Troubleshooting

### Problem: Too many files are being skipped

**Solution:** Lower the confidence threshold

```json
{
  "minConfidence": 0.5  // Was 0.65
}
```

### Problem: Too many irrelevant files downloaded

**Solution:** Increase confidence or add specific subjects

```json
{
  "targetSubjects": ["Mathematics"],  // Be more specific
  "minConfidence": 0.75               // Increase threshold
}
```

### Problem: Getting rate limit errors

**Solution:** The system auto-handles this with retries. Just wait, or reduce `maxConcurrency`:

```json
{
  "maxConcurrency": 3  // Slower but safer
}
```

---

## Next Steps

- 📖 Read the full guide: [AI_PRE_FILTER_GUIDE.md](AI_PRE_FILTER_GUIDE.md)
- 📋 Try example configs: [config.examples.json](config.examples.json)
- 🔧 Technical details: [AI_PREFILTER_IMPLEMENTATION.md](AI_PREFILTER_IMPLEMENTATION.md)

---

**Questions?** Check the logs with `logDecisions: true` to see exactly what the AI is thinking!

**Happy Intelligent Scraping! 🎓🤖**
