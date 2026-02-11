import { useState, useCallback } from 'react';

export interface Table {
    title: string;
    headers: string[];
    rows: string[][];
}

export interface AnalysisData {
    summary: string;
    topics: string[];
    tables: Table[];
    imageDescriptions: string[];
    gradeLevel: string;
    subject: string;
    pageCount: number;
    analyzedAt: string;
}

const API_URL = 'http://localhost:3001';

export const useAnalysis = () => {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState<string | null>(null);

    const triggerAnalysis = useCallback(async (filePath: string) => {
        setLoading(true);
        setData(null);
        setError(null);
        setProgress('Starting analysis...');

        try {
            const res = await fetch(`${API_URL}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Analysis failed');
            }

            const analysisResult = await res.json();
            setData(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error during analysis');
        } finally {
            setLoading(false);
        }
    }, []);

    const resetAnalysis = useCallback(() => {
        setData(null);
        setLoading(false);
        setProgress('');
        setError(null);
    }, []);

    return {
        data,
        loading,
        progress,
        error,
        triggerAnalysis,
        resetAnalysis
    };
};
