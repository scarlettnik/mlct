import { renderHook, waitFor } from '@testing-library/react';
import useUsers from '../Patients';

// Mock global fetch
global.fetch = jest.fn();

describe('useUsers hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches users successfully', async () => {
        const mockUsers = {
            items: [
                { id: 1, name: 'John Doe' },
                { id: 2, name: 'Jane Doe' }
            ]
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUsers,
        });

        const { result } = renderHook(() => useUsers());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.users).toEqual(mockUsers.items);
        expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const { result } = renderHook(() => useUsers());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.users).toEqual([]);
        expect(result.current.error).toBeDefined();
    });

    it('handles network failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useUsers());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.users).toEqual([]);
        expect(result.current.error).toBeDefined();
    });
});
