import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FileManager } from './FileManager';
import { useCurriculum } from '../hooks/useCurriculum';

// Mock useCurriculum
vi.mock('../hooks/useCurriculum', () => ({
    useCurriculum: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('FileManager - Curriculum Mapping', () => {
    const mockFiles = [
        {
            name: 'Mathematics_Note.pdf',
            path: 'Grade7_JHS1/Mathematics/Mathematics_Note.pdf',
            size: 1024,
            date: '2026-02-13',
            type: 'file'
        }
    ];

    const mockMappings = [
        {
            filePath: 'Grade7_JHS1/Mathematics/Mathematics_Note.pdf',
            curriculumNodeId: 'm_jhs1_s1'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        
        (useCurriculum as any).mockReturnValue({
            getMappings: vi.fn().mockResolvedValue(mockMappings),
            predictMapping: vi.fn(),
            confirmMapping: vi.fn()
        });

        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockFiles
        });
    });

    it('should display "LINKED TO CURRICULUM" badge for mapped files', async () => {
        render(
            <FileManager 
                onPreview={() => {}} 
                onAnalyze={() => {}} 
                isAnalyzing={false} 
                analysisData={null} 
                analysisProgress="" 
                analysisError={null} 
            />
        );

        await waitFor(() => {
            expect(screen.getByText('LINKED TO CURRICULUM')).toBeDefined();
        });
    });

    it('should show "Re-link" button for already mapped files', async () => {
        render(
            <FileManager 
                onPreview={() => {}} 
                onAnalyze={() => {}} 
                isAnalyzing={false} 
                analysisData={null} 
                analysisProgress="" 
                analysisError={null} 
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Re-link')).toBeDefined();
        });
    });
});
