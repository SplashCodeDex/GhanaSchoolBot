import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurriculum } from './useCurriculum';

// Mock fetch globally
global.fetch = vi.fn();

describe('useCurriculum', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch levels correctly', async () => {
        const mockLevels = [{ id: 'jhs', name: 'JHS', grades: [] }];
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockLevels,
        });

        const { result } = renderHook(() => useCurriculum());
        const levels = await result.current.getLevels();

        expect(levels).toEqual(mockLevels);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/curriculum/levels'));
    });

    it('should handle fetch errors gracefully', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
        });

        const { result } = renderHook(() => useCurriculum());
        const levels = await result.current.getLevels();

        expect(levels).toEqual([]);
        await waitFor(() => {
            expect(result.current.error).toBe('Failed to fetch levels');
        });
    });

    it('should fetch subjects for a grade', async () => {
        const mockSubjects = ['Mathematics', 'Science'];
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockSubjects,
        });

        const { result } = renderHook(() => useCurriculum());
        const subjects = await result.current.getSubjectsByGrade('jhs1');

        expect(subjects).toEqual(mockSubjects);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/curriculum/subjects?gradeId=jhs1'));
    });
});
