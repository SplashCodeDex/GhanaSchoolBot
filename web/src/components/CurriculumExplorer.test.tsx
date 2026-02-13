import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CurriculumExplorer } from './CurriculumExplorer';
import { useCurriculum } from '../hooks/useCurriculum';

// Mock useCurriculum
vi.mock('../hooks/useCurriculum', () => ({
    useCurriculum: vi.fn()
}));

describe('CurriculumExplorer - Linked Resources', () => {
    const mockLevels = [
        {
            id: 'jhs',
            name: 'Junior High School',
            grades: [{ id: 'jhs1', name: 'JHS 1' }]
        }
    ];

    const mockStrands = [
        {
            id: 'm_jhs1_s1',
            name: 'Number',
            subStrands: [
                { id: 'm_jhs1_s1_ss1', name: 'Number and Numeration Systems', indicators: [] }
            ]
        }
    ];

    const mockMappings = [
        {
            filePath: 'Mathematics_Note.pdf',
            curriculumNodeId: 'm_jhs1_s1_ss1'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        
        (useCurriculum as any).mockReturnValue({
            getLevels: vi.fn().mockResolvedValue(mockLevels),
            getSubjectsByGrade: vi.fn().mockResolvedValue(['Mathematics']),
            getStructure: vi.fn().mockResolvedValue(mockStrands),
            getMappings: vi.fn().mockResolvedValue(mockMappings),
            searchCurriculum: vi.fn()
        });
    });

    it('should display linked resources when a sub-strand is selected', async () => {
        render(<CurriculumExplorer />);

        // Wait for levels to load
        await waitFor(() => expect(screen.getByText('Junior High School')).toBeDefined());

        // Expand Level
        fireEvent.click(screen.getByText('Junior High School'));
        
        // Expand Grade
        await waitFor(() => expect(screen.getByText('JHS 1')).toBeDefined());
        fireEvent.click(screen.getByText('JHS 1'));

        // Expand Subject
        await waitFor(() => expect(screen.getByText('Mathematics')).toBeDefined());
        fireEvent.click(screen.getByText('Mathematics'));

        // Expand Strand
        await waitFor(() => expect(screen.getByText('Number')).toBeDefined());
        fireEvent.click(screen.getByText('Number'));

        // Click Sub-strand
        await waitFor(() => expect(screen.getByText('Number and Numeration Systems')).toBeDefined());
        fireEvent.click(screen.getByText('Number and Numeration Systems'));

        // Check if linked resource is displayed
        await waitFor(() => {
            expect(screen.getByText('Mathematics_Note.pdf')).toBeDefined();
        });
    });
});
