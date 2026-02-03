import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

/**
 * Service to classify educational resources using Gemini AI
 */
export class AISorter {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private categories = ["Grade7_JHS1", "Grade8_JHS2", "Grade9_JHS3", "SHS1", "SHS2", "SHS3"];

    private jhsSubjects = [
        "Career Technology", "Computing_ICT", "Creative Arts and Design_CAD",
        "English Language", "French", "Ghanaian Language", "Mathematics",
        "Physical and Health Education_PHE", "Religious and Moral Education_RME",
        "Science", "Social Studies"
    ];

    private shsSubjects = [
        "Applied Electricity", "Auto Mechanics", "Biology", "Building Construction",
        "Business Management", "Ceramics", "Chemistry", "Clothing and Textiles",
        "Computing", "Cost Accounting", "Economics", "Electronics", "English Language",
        "Financial Accounting", "Food and Nutrition", "French", "General Knowledge in Art",
        "Geography", "Government", "Graphic Design", "History",
        "Information and Communication Technology_ICT", "Integrated Science",
        "Leatherwork", "Literature-in-English", "Management in Living",
        "Mathematics_Core", "Mathematics_Elective", "Metalwork", "Music",
        "Physical Education_PHE", "Physics", "Picture Making",
        "Religious and Moral Education_RME", "Sculpture", "Social Studies",
        "Technical Drawing", "Textiles", "Woodwork"
    ];

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    async getClassification(filename: string, context?: string): Promise<{ grade: string, subject: string, confidence: number }> {
        const prompt = `
            You are an educational resource expert in Ghana.
            Classify the file into a Grade and a Subject.

            Filename: "${filename}"
            ${context ? `Extra Content: "${context}"` : ""}

            Available Grades: ${this.categories.join(", ")}
            JHS Subjects: ${this.jhsSubjects.join(", ")}
            SHS Subjects: ${this.shsSubjects.join(", ")}

            Rules for Grade Mapping:
            - "Grade7_JHS1": Covers JHS 1, Basic 7, Form 1, Year 1 (JHS).
            - "Grade8_JHS2": Covers JHS 2, Basic 8, Form 2, Year 2 (JHS).
            - "Grade9_JHS3": Covers JHS 3, Basic 9, Form 3, Year 3 (JHS), BECE.
            - "SHS1": Senior High 1, Year 1 (SHS), Form 1 (SHS).
            - "SHS2": Senior High 2, Year 2 (SHS), Form 2 (SHS).
            - "SHS3": Senior High 3, Year 3 (SHS), Form 3 (SHS), WASSCE.

            Steps:
            1. Determine the Grade first using the mapping rules.
            2. Choose the BEST matching Subject from the specific list.
            3. Return ONLY a JSON object: {"grade": "Grade_Name", "subject": "Subject_Name", "confidence": 0.0-1.0}
            4. If unsure, use "Uncategorized".
        `.trim();

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const data = JSON.parse(response.text());

            let grade = this.categories.includes(data.grade) ? data.grade : "Uncategorized";
            let subject = data.subject || "Uncategorized";
            const confidence = data.confidence || 0.5;

            // Scenario 1: Strict Subject Validation
            const allowedSubjects = grade.startsWith("SHS") ? this.shsSubjects : this.jhsSubjects;
            if (grade !== "Uncategorized" && !allowedSubjects.includes(subject)) {
                console.warn(`[AI] Hallucinated subject "${subject}". Reverting to Uncategorized.`);
                subject = "Uncategorized";
            }

            return { grade, subject, confidence };
        } catch (error: any) {
            console.error(`[AI] Categorization failed for ${filename}:`, error.message);
            return { grade: "Uncategorized", subject: "Uncategorized", confidence: 0 };
        }
    }
}
