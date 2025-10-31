import { formatTimeMMSS, formatDate } from '../formatters';

describe('formatTimeMMSS', () => {
    it('formats 0 seconds as 00:00', () => {
        expect(formatTimeMMSS(0)).toBe('00:00');
    });

    it('formats 65 seconds as 01:05', () => {
        expect(formatTimeMMSS(65)).toBe('01:05');
    });

    it('formats 3600 seconds as 60:00', () => {
        expect(formatTimeMMSS(3600)).toBe('60:00');
    });

    it('handles negative numbers by rounding to 00:00', () => {
        expect(formatTimeMMSS(-10)).toBe('00:00');
    });

    it('rounds float numbers', () => {
        expect(formatTimeMMSS(60.7)).toBe('01:01');
    });
});

describe('formatDate', () => {
    it('formats YYYY-MM-DD to DD.MM.YYYY', () => {
        expect(formatDate('2025-02-14')).toBe('14.02.2025');
    });

    it('returns empty string for empty input', () => {
        expect(formatDate('')).toBe('');
    });

    it('returns original string if format is unexpected', () => {
        expect(formatDate('14/02/2025')).toBe('14/02/2025');
    });
});
