import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditPatientModal from '../EditPatientModal';

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;

// Mock useParams
jest.mock('next/navigation', () => ({
    useParams: () => ({ id: '1' }),
}));

describe('EditPatientModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSuccess = jest.fn();
    const mockPatientData = {
        id: 1,
        name: 'John Doe',
        info: {
            parity: '1',
            last_menstrual_period: '2025-01-01',
            blood_gas: []
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with existing patient data', async () => {
        render(<EditPatientModal isOpen={true} patientData={mockPatientData as any} onClose={mockOnClose} />);
        
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('validates required fields before submission', async () => {
        window.alert = jest.fn();
        render(<EditPatientModal isOpen={true} patientData={undefined} onClose={mockOnClose} />);
        
        // Wait for modal to render
        await screen.findByText('Сохранить');
        
        // Find the form and submit it directly
        const form = screen.getByRole('button', { name: /Сохранить/i }).closest('form');
        if (form) fireEvent.submit(form);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('введите имя'));
        });
    });

    it('submits form data successfully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            text: async () => 'OK',
        } as any);

        render(<EditPatientModal isOpen={true} patientData={mockPatientData as any} onSuccess={mockOnSuccess} onClose={mockOnClose} />);
        
        fireEvent.click(screen.getByText('Сохранить'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/patients/1'),
                expect.objectContaining({ method: 'PATCH' })
            );
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    it('handles API errors', async () => {
        window.alert = jest.fn();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => 'Bad Request',
        } as any);

        render(<EditPatientModal isOpen={true} patientData={mockPatientData as any} onClose={mockOnClose} />);
        
        fireEvent.click(screen.getByText('Сохранить'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Не удалось сохранить'));
        });
    });
});
