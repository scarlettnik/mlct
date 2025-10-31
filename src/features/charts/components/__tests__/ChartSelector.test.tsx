import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartSelector from '../ChartSelector';

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;

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
        render(<ChartSelector patient={{ ...mockPatient, examinations: [] } as any} selectChart={mockSelectChart} data={[]} loading={false} />);
        expect(screen.getByText(/Нет доступных данных/)).toBeInTheDocument();
    });

    it('renders grouped examinations', () => {
        render(<ChartSelector patient={mockPatient as any} selectChart={mockSelectChart} data={[]} loading={false} />);
        expect(screen.getByText('14.02.2025')).toBeInTheDocument();
        expect(screen.getByText('Запись #')).toBeInTheDocument();
    });

    it('calls selectChart on mount if data exists', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: { bpm: [], uterus: [] } }),
        } as any);

        render(<ChartSelector patient={mockPatient as any} selectChart={mockSelectChart} data={[]} loading={false} />);

        await waitFor(() => {
            expect(mockSelectChart).toHaveBeenCalled();
        });
    });

    it('handles record click', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: { bpm: [] } }),
        } as any);

        render(<ChartSelector patient={mockPatient as any} selectChart={mockSelectChart} data={[]} loading={false} />);
        
        const record = screen.getByText('Запись #').parentElement;
        if (record) {
            fireEvent.click(record);
        }

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});
