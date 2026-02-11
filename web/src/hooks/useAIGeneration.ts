import { useState, useCallback } from 'react';

export interface LessonNoteRequest {
    subject: string;
    grade: string;
    strand: string;
    subStrand: string;
    additionalInstructions?: string;
}

export interface ExamRequest {
    type: 'MOCK' | 'BECE' | 'WASSCE' | 'TERM' | 'CLASS_TEST' | 'HOMEWORK';
    subject: string;
    grade: string;
    topics: string[];
    numQuestions: number;
}

export interface ExamResult {
    paper: string;
    markingScheme: string;
}

const API_URL = 'http://localhost:3001';

export const useAIGeneration = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedNote, setGeneratedNote] = useState<string | null>(null);
    const [generatedExam, setGeneratedExam] = useState<ExamResult | null>(null);

    const generateLessonNote = useCallback(async (params: LessonNoteRequest) => {
        setLoading(true);
        setError(null);
        setGeneratedNote(null);

        try {
            const res = await fetch(`${API_URL}/api/ai/generate-lesson-note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate lesson note');
            }

            const data = await res.json();
            setGeneratedNote(data.note);
            return data.note;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const generateExam = useCallback(async (params: ExamRequest) => {
        setLoading(true);
        setError(null);
        setGeneratedExam(null);

        try {
            const res = await fetch(`${API_URL}/api/ai/generate-exam`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate examination');
            }

            const data = await res.json();
            setGeneratedExam(data);
            return data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setGeneratedNote(null);
        setGeneratedExam(null);
    }, []);

    return {
        loading,
        error,
        generatedNote,
        generatedExam,
        generateLessonNote,
        generateExam,
        reset
    };
};
