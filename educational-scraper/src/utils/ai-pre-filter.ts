import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Context information about a link for AI analysis
 */
export interface LinkContext {
    url: string;
    linkText?: string;
    surroundingText?: string;
    pageTitle?: string;
    anchorAttributes?: Record<string, string>;
}

/**
 * AI decision result for whether to download a file
 */
export interface FilterDecision {
    shouldDownload: boolean;
    confidence: number;
    reasoning: string;
    detectedSubject?: string;
    detectedGrade?: string;
}

/**
 * Configuration for AI pre-filtering
 */
export interface PreFilterConfig {
    targetSubjects?: string[];
    targetGrades?: string[];
    minConfidence?: number;
    enableCaching?: boolean;
}

/**
 * AI Pre-Filter Service
 * Analyzes links BEFORE downloading to determine relevance to target subjects
 */
export class AIPreFilter {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private cache: Map<string, FilterDecision> = new Map();
    private config: PreFilterConfig;
    private requestCount: number = 0;
    private lastRequestTime: number = Date.now();

    // Educational metadata
    private allSubjects = [
        // JHS Subjects
        "Career Technology", "Computing", "ICT", "Creative Arts", "Design",
        "English Language", "French", "Ghanaian Language", "Mathematics",
        "Physical Education", "Health Education", "Religious Education",
        "Moral Education", "Science", "Social Studies",
        // SHS Subjects
        "Applied Electricity", "Auto Mechanics", "Biology", "Building Construction",
        "Business Management", "Ceramics", "Chemistry", "Clothing and Textiles",
        "Cost Accounting", "Economics", "Electronics", "Financial Accounting",
        "Food and Nutrition", "Geography", "Government", "Graphic Design",
        "History", "Integrated Science", "Leatherwork", "Literature",
        "Management in Living", "Metalwork", "Music", "Physics",
        "Picture Making", "Sculpture", "Technical Drawing", "Textiles",
        "Woodwork", "Robotics", "Engineering"
    ];

    private allGrades = [
        "JHS1", "JHS2", "JHS3", "BECE",
        "SHS1", "SHS2", "SHS3", "WASSCE",
        "Basic 7", "Basic 8", "Basic 9",
        "Form 1", "Form 2", "Form 3"
    ];

    constructor(apiKey: string, config: PreFilterConfig = {}) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.3  // Lower temperature for more consistent decisions
            }
        });
        
        this.config = {
            minConfidence: config.minConfidence || 0.6,
            enableCaching: config.enableCaching !== false,
            targetSubjects: config.targetSubjects || [],
            targetGrades: config.targetGrades || []
        };
    }

    /**
     * Rate limiting to avoid API quota issues
     */
    private async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // Allow max 15 requests per minute (conservative for Gemini free tier)
        if (this.requestCount >= 15 && timeSinceLastRequest < 60000) {
            const waitTime = 60000 - timeSinceLastRequest;
            console.log(`[AI Pre-Filter] Rate limit approaching. Waiting ${waitTime}ms...`);
            await this.sleep(waitTime);
            this.requestCount = 0;
        }
        
        if (timeSinceLastRequest > 60000) {
            this.requestCount = 0;
        }
        
        this.requestCount++;
        this.lastRequestTime = Date.now();
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate cache key from link context
     */
    private getCacheKey(context: LinkContext): string {
        return `${context.url}|${context.linkText}|${context.surroundingText?.slice(0, 50)}`;
    }

    /**
     * Main method: Analyze a link and decide if it should be downloaded
     */
    async shouldDownload(context: LinkContext, retries: number = 3): Promise<FilterDecision> {
        // Check cache first
        if (this.config.enableCaching) {
            const cacheKey = this.getCacheKey(context);
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.log(`[AI Pre-Filter] ✅ Cache hit for: ${context.url}`);
                return cached;
            }
        }

        // Apply rate limiting
        await this.rateLimit();

        const prompt = this.buildPrompt(context);

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const data = JSON.parse(response.text());

                const decision: FilterDecision = {
                    shouldDownload: data.shouldDownload === true,
                    confidence: Math.max(0, Math.min(1, data.confidence || 0.5)),
                    reasoning: data.reasoning || "No reasoning provided",
                    detectedSubject: data.detectedSubject,
                    detectedGrade: data.detectedGrade
                };

                // Apply confidence threshold
                const minConf = this.config.minConfidence ?? 0.6;
                if (decision.confidence < minConf) {
                    decision.shouldDownload = false;
                    decision.reasoning += ` (Confidence ${decision.confidence.toFixed(2)} below threshold ${minConf})`;
                }

                // Cache the result
                if (this.config.enableCaching) {
                    const cacheKey = this.getCacheKey(context);
                    this.cache.set(cacheKey, decision);
                }

                return decision;

            } catch (error: any) {
                if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
                    const waitTime = (attempt + 1) * 10000; // Exponential backoff
                    console.warn(`[AI Pre-Filter] ⚠️ Rate limit hit. Retrying in ${waitTime / 1000}s... (Attempt ${attempt + 1}/${retries})`);
                    await this.sleep(waitTime);
                    continue;
                }
                
                console.error(`[AI Pre-Filter] ❌ Error analyzing link:`, error.message);
                
                // On error, use fallback heuristic
                if (attempt === retries - 1) {
                    return this.fallbackHeuristic(context);
                }
            }
        }

        // If all retries failed, use fallback
        return this.fallbackHeuristic(context);
    }

    /**
     * Build the AI prompt for link analysis
     */
    private buildPrompt(context: LinkContext): string {
        const targetSubjectsStr = this.config.targetSubjects && this.config.targetSubjects.length > 0
            ? this.config.targetSubjects.join(", ")
            : "ANY educational subject";

        const targetGradesStr = this.config.targetGrades && this.config.targetGrades.length > 0
            ? this.config.targetGrades.join(", ")
            : "ANY grade level";

        return `
You are an expert educational content analyzer for Ghana's education system.

TASK: Analyze this link and determine if the resource is relevant to download.

LINK INFORMATION:
- URL: ${context.url}
- Link Text: ${context.linkText || "N/A"}
- Surrounding Text: ${context.surroundingText || "N/A"}
- Page Title: ${context.pageTitle || "N/A"}
${context.anchorAttributes ? `- Attributes: ${JSON.stringify(context.anchorAttributes)}` : ""}

TARGET FILTERS:
- Target Subjects: ${targetSubjectsStr}
- Target Grades: ${targetGradesStr}

VALID SUBJECTS:
${this.allSubjects.join(", ")}

VALID GRADES:
${this.allGrades.join(", ")}

ANALYSIS CRITERIA:
1. Does the link point to an educational resource (PDF, document, presentation, etc.)?
2. Is it relevant to the target subjects? ${this.config.targetSubjects?.length ? "(STRICT: Must match target subjects)" : "(Any educational subject acceptable)"}
3. Is it relevant to the target grade levels? ${this.config.targetGrades?.length ? "(STRICT: Must match target grades)" : "(Any grade level acceptable)"}
4. Does it contain curriculum materials, textbooks, syllabi, past questions, or teaching resources?
5. Is it specifically for Ghana's educational system (JHS/SHS/BECE/WASSCE)?

RESPONSE FORMAT (JSON only):
{
    "shouldDownload": boolean,
    "confidence": number (0.0 to 1.0),
    "reasoning": "Brief explanation of decision (max 100 chars)",
    "detectedSubject": "Detected subject or null",
    "detectedGrade": "Detected grade level or null"
}

RULES:
- If URL extension is .pdf, .doc, .docx, .ppt, .pptx → likely downloadable resource
- If link text contains subject keywords → higher relevance
- If surrounding text mentions curriculum/syllabus/past questions → higher relevance
- If URL/text contains irrelevant content (ads, navigation, contact) → shouldDownload: false
- Be conservative: When uncertain, set confidence < 0.7
- If no target subjects specified, accept any valid educational subject
- If no target grades specified, accept any valid grade level
        `.trim();
    }

    /**
     * Fallback heuristic when AI is unavailable
     * Uses simple keyword matching as backup
     */
    private fallbackHeuristic(context: LinkContext): FilterDecision {
        const url = context.url.toLowerCase();
        const text = (context.linkText || "").toLowerCase();
        const surrounding = (context.surroundingText || "").toLowerCase();
        const combined = `${url} ${text} ${surrounding}`;

        // Check if it's a downloadable file
        const isDownloadable = /\.(pdf|docx?|pptx?|xlsx?|zip)$/i.test(url);
        
        // Check for subject keywords
        let subjectMatch = false;
        if (this.config.targetSubjects && this.config.targetSubjects.length > 0) {
            subjectMatch = this.config.targetSubjects.some(subject => 
                combined.includes(subject.toLowerCase())
            );
        } else {
            subjectMatch = this.allSubjects.some(subject =>
                combined.includes(subject.toLowerCase())
            );
        }

        // Check for grade keywords
        let gradeMatch = false;
        if (this.config.targetGrades && this.config.targetGrades.length > 0) {
            gradeMatch = this.config.targetGrades.some(grade =>
                combined.includes(grade.toLowerCase())
            );
        } else {
            gradeMatch = this.allGrades.some(grade =>
                combined.includes(grade.toLowerCase())
            );
        }

        const shouldDownload = isDownloadable && (subjectMatch || gradeMatch);

        return {
            shouldDownload,
            confidence: shouldDownload ? 0.5 : 0.3,
            reasoning: "Fallback heuristic (AI unavailable)",
            detectedSubject: undefined,
            detectedGrade: undefined
        };
    }

    /**
     * Batch analyze multiple links for efficiency
     */
    async batchShouldDownload(contexts: LinkContext[]): Promise<FilterDecision[]> {
        const results: FilterDecision[] = [];
        
        // Process in batches to respect rate limits
        const batchSize = 5;
        for (let i = 0; i < contexts.length; i += batchSize) {
            const batch = contexts.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(context => this.shouldDownload(context))
            );
            results.push(...batchResults);
            
            // Small delay between batches
            if (i + batchSize < contexts.length) {
                await this.sleep(1000);
            }
        }
        
        return results;
    }

    /**
     * Update configuration dynamically
     */
    updateConfig(config: Partial<PreFilterConfig>) {
        this.config = { ...this.config, ...config };
        console.log(`[AI Pre-Filter] Configuration updated:`, this.config);
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            requestCount: this.requestCount,
            cacheEnabled: this.config.enableCaching
        };
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
        console.log(`[AI Pre-Filter] Cache cleared`);
    }
}
