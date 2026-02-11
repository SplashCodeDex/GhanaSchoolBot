import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface AnalysisResult {
    summary: string;
    topics: string[];
    tables: Array<{ title: string; headers: string[]; rows: string[][] }>;
    imageDescriptions: string[];
    gradeLevel: string;
    subject: string;
    pageCount: number;
    analyzedAt: string;
}

/**
 * AI-Powered PDF Analyzer using Gemini's native PDF support.
 * Uploads the PDF directly to Gemini — handles tables, images,
 * special characters, and scanned documents natively.
 */
export class AIPdfAnalyzer {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private cacheDir: string;

    constructor(apiKey: string, downloadsPath: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        this.cacheDir = path.join(downloadsPath, '.analysis-cache');

        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Generate a cache key from the file path and its last modified time.
     * If the file changes, the cache is invalidated automatically.
     */
    private getCacheKey(filePath: string): string {
        const stat = fs.statSync(filePath);
        const hash = crypto.createHash('md5')
            .update(`${filePath}:${stat.mtimeMs}:${stat.size}`)
            .digest('hex');
        return hash;
    }

    /**
     * Check if a cached analysis exists for this file.
     */
    private getCachedResult(filePath: string): AnalysisResult | null {
        try {
            const cacheKey = this.getCacheKey(filePath);
            const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);

            if (fs.existsSync(cachePath)) {
                const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
                console.log(`[AI Analyzer] Cache hit for: ${path.basename(filePath)}`);
                return cached;
            }
        } catch (error) {
            console.warn('[AI Analyzer] Cache read error:', error);
        }
        return null;
    }

    /**
     * Save analysis result to cache.
     */
    private saveToCache(filePath: string, result: AnalysisResult): void {
        try {
            const cacheKey = this.getCacheKey(filePath);
            const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
            fs.writeFileSync(cachePath, JSON.stringify(result, null, 2));
            console.log(`[AI Analyzer] Cached result for: ${path.basename(filePath)}`);
        } catch (error) {
            console.warn('[AI Analyzer] Cache write error:', error);
        }
    }

    /**
     * Analyze a PDF file using Gemini's native PDF understanding.
     * Handles text, tables, images, special characters, and scanned docs.
     */
    async analyze(filePath: string, onProgress?: (msg: string) => void): Promise<AnalysisResult> {
        const filename = path.basename(filePath);

        // Step 1: Check cache
        const cached = this.getCachedResult(filePath);
        if (cached) {
            onProgress?.(`✅ Loaded cached analysis for "${filename}"`);
            return cached;
        }

        // Step 2: Validate file
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stat = fs.statSync(filePath);
        const fileSizeMB = stat.size / (1024 * 1024);

        if (fileSizeMB > 50) {
            throw new Error(`File too large (${fileSizeMB.toFixed(1)} MB). Gemini limit is 50 MB.`);
        }

        onProgress?.(`📤 Uploading "${filename}" (${fileSizeMB.toFixed(1)} MB) to Gemini...`);

        // Step 3: Read PDF as base64 for inline upload
        const pdfBuffer = fs.readFileSync(filePath);
        const base64Data = pdfBuffer.toString('base64');

        onProgress?.(`🧠 Analyzing with AI... This may take a moment for large documents.`);

        // Step 4: Send to Gemini with structured prompt
        const prompt = `
You are an expert educational document analyzer specializing in Ghanaian curriculum materials.
Analyze this PDF document thoroughly and return a JSON object with the following structure:

{
  "summary": "A comprehensive 3-5 sentence summary of the document's content and purpose.",
  "topics": ["List", "of", "key", "topics", "covered"],
  "tables": [
    {
      "title": "Description of what the table contains",
      "headers": ["Column1", "Column2"],
      "rows": [["data1", "data2"], ["data3", "data4"]]
    }
  ],
  "imageDescriptions": ["Description of each significant diagram, chart, or image found"],
  "gradeLevel": "JHS1/JHS2/JHS3/SHS1/SHS2/SHS3/General/Unknown",
  "subject": "The academic subject this document covers",
  "pageCount": <estimated number of pages>
}

Rules:
- For "tables": Extract up to 5 most important tables. If no tables exist, return an empty array.
- For "imageDescriptions": Describe up to 10 significant images/diagrams. If none, return an empty array.
- For "gradeLevel": Use Ghanaian education levels (JHS = Junior High School, SHS = Senior High School).
- For "topics": List 5-15 key topics or concepts covered.
- Be thorough but concise. Focus on educational value.
`.trim();

        try {
            const result = await this.model.generateContent([
                {
                    inlineData: {
                        mimeType: "application/pdf",
                        data: base64Data
                    }
                },
                { text: prompt }
            ]);

            const response = await result.response;
            const rawText = response.text();
            const data = JSON.parse(rawText);

            const analysisResult: AnalysisResult = {
                summary: data.summary || "No summary available.",
                topics: Array.isArray(data.topics) ? data.topics : [],
                tables: Array.isArray(data.tables) ? data.tables : [],
                imageDescriptions: Array.isArray(data.imageDescriptions) ? data.imageDescriptions : [],
                gradeLevel: data.gradeLevel || "Unknown",
                subject: data.subject || "Unknown",
                pageCount: data.pageCount || 0,
                analyzedAt: new Date().toISOString()
            };

            // Step 5: Cache the result
            this.saveToCache(filePath, analysisResult);

            onProgress?.(`✅ Analysis complete for "${filename}"!`);
            return analysisResult;

        } catch (error: any) {
            if (error.message?.includes('429') || error.message?.includes('Quota')) {
                throw new Error('Rate limit reached. Please wait a moment and try again.');
            }
            if (error.message?.includes('SAFETY')) {
                throw new Error('Content was flagged by safety filters. Try a different document.');
            }
            console.error('[AI Analyzer] Error:', error.message);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }
}
