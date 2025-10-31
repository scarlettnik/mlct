import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportBlock from '../ReportBlock';
import { generatePdfFromHtml } from "@/features/reports/lib/pdfGenerator";

// Mock pdfGenerator
jest.mock("@/features/reports/lib/pdfGenerator", () => ({
    generatePdfFromHtml: jest.fn(),
}));

describe('ReportBlock', () => {
    const mockReportData = {
        stats: {
            bpm_average: 140.5,
            uterus_average: 20.2,
            acceleration_count: 2,
            deceleration_count: 1,
            late_deceleration_count: 0,
            early_deceleration_count: 1,
            variable_deceleration_count: 0,
            condition: 'Normal'
        }
    };

    it('renders report statistics correctly', () => {
        render(<ReportBlock reportData={mockReportData as any} />);
        
        expect(screen.getByText('140.5 уд')).toBeInTheDocument();
        expect(screen.getByText('20.2')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Acceleration count
        expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('calls generatePdfFromHtml when download button is clicked', () => {
        render(<ReportBlock reportData={mockReportData as any} />);
        
        fireEvent.click(screen.getByText('Скачать отчет'));
        expect(generatePdfFromHtml).toHaveBeenCalled();
    });

    it('displays suspicious status with correct class', () => {
        const suspiciousData = {
            stats: { ...mockReportData.stats, condition: 'Suspicious' }
        };
        const { container } = render(<ReportBlock reportData={suspiciousData as any} />);
        
        const statusElement = container.querySelector('.path-suspicious');
        expect(statusElement).toBeInTheDocument();
    });
});
