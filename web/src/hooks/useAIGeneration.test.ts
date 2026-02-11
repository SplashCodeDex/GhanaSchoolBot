import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIGeneration } from './useAIGeneration';

describe('useAIGeneration', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Mock global fetch
        global.fetch = vi.fn();
    });

    it('should initialize with default states', () => {
        const { result } = renderHook(() => useAIGeneration());
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.generatedNote).toBe(null);
        expect(result.current.generatedExam).toBe(null);
    });

    it('should handle successful lesson note generation', async () => {
        const mockNote = "Generated lesson note content";
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ note: mockNote }),
        });

        const { result } = renderHook(() => useAIGeneration());

        await act(async () => {
            const note = await result.current.generateLessonNote({
                subject: 'Math',
                grade: 'JHS1',
                strand: 'Strand',
                subStrand: 'Sub'
            });
            expect(note).toBe(mockNote);
        });

        expect(result.current.generatedNote).toBe(mockNote);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should handle error during generation', async () => {
        const errorMsg = "API Error";
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: errorMsg }),
        });

        const { result } = renderHook(() => useAIGeneration());

        await act(async () => {
            try {
                await result.current.generateLessonNote({
                    subject: 'Math',
                    grade: 'JHS1',
                    strand: 'Strand',
                    subStrand: 'Sub'
                });
            } catch (e) {
                // expected
            }
        });

        expect(result.current.error).toBe(errorMsg);
        expect(result.current.loading).toBe(false);
        expect(result.current.generatedNote).toBe(null);
    });
});
