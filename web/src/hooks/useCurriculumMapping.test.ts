import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurriculum } from './useCurriculum';

// Mock fetch globally
global.fetch = vi.fn();

describe('useCurriculum - Mapping Extensions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch mappings correctly', async () => {
        const mockMappings = [{ filePath: 'test.pdf', curriculumNodeId: 'node1' }];
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockMappings,
        });

        const { result } = renderHook(() => useCurriculum());
        const mappings = await result.current.getMappings();

        expect(mappings).toEqual(mockMappings);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/mapping'));
    });

    it('should predict mapping for a file', async () => {
        const mockPrediction = 'node_suggested';
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ prediction: mockPrediction }),
        });

        const { result } = renderHook(() => useCurriculum());
        const prediction = await result.current.predictMapping('file.pdf');

        expect(prediction).toBe(mockPrediction);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/mapping/predict'), expect.any(Object));
    });

    it('should confirm a mapping', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
        });

        const { result } = renderHook(() => useCurriculum());
        const success = await result.current.confirmMapping('file.pdf', 'node1');

        expect(success).toBe(true);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/mapping/confirm'), expect.any(Object));
    });
});
