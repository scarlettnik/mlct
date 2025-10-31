import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChartSelector from '../ChartSelector';

// Mock global fetch
global.fetch = jest.fn();

describe('ChartSelector', () => {
    const mockSelectChart = jest.fn();
    const mockPatient = {
        id: 1,
        examinations: [
            {
                id: 101,
                metadata: { date: '2025-02-14', part_count: 1 }
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders placeholder when no examinations available', () => {
        render(<ChartSelector patient={{ ...mockPatient, examinations: [] }} />);
        expect(screen.getByText(/Нет доступных данных/)).toBeInTheDocument();
    });

    it('renders grouped examinations', () => {
        render(<ChartSelector patient={mockPatient} selectChart={mockSelectChart} />);
        expect(screen.getByText('14.02.2025')).toBeInTheDocument();
        expect(screen.getByText('Запись #')).toBeInTheDocument();
    });

    it('calls selectChart on mount if data exists', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: { bpm: [], uterus: [] } }),
        });

        render(<ChartSelector patient={mockPatient} selectChart={mockSelectChart} />);

        await waitFor(() => {
            expect(mockSelectChart).toHaveBeenCalled();
        });
    });

    it('handles record click', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: { bpm: [] } }),
        });

        render(<ChartSelector patient={mockPatient} selectChart={mockSelectChart} />);
        
        const record = screen.getByText('Запись #').parentElement;
        fireEvent.click(record);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });
    });
});
