import { useState, useCallback } from 'react';

export interface Grade {
    id: string;
    name: string;
}

export interface Level {
    id: string;
    name: string;
    grades: Grade[];
}

export interface SubStrand {
    id: string;
    name: string;
    indicators: string[];
    description?: string;
}

export interface Strand {
    id: string;
    name: string;
    subStrands: SubStrand[];
}

const API_URL = 'http://localhost:3001';

export const useCurriculum = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getLevels = useCallback(async (): Promise<Level[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/curriculum/levels`);
            if (!res.ok) throw new Error('Failed to fetch levels');
            return await res.json();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getSubjectsByGrade = useCallback(async (gradeId: string): Promise<string[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/curriculum/subjects?gradeId=${gradeId}`);
            if (!res.ok) throw new Error('Failed to fetch subjects');
            return await res.json();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getStructure = useCallback(async (gradeId: string, subject: string): Promise<Strand[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/curriculum/structure?gradeId=${gradeId}&subject=${subject}`);
            if (!res.ok) throw new Error('Failed to fetch structure');
            const data = await res.json();
            return data.strands;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const searchCurriculum = useCallback(async (query: string): Promise<any[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/curriculum/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            return data.results;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getLevels,
        getSubjectsByGrade,
        getStructure,
        searchCurriculum
    };
};
