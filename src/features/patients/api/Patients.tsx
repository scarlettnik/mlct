'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from "@/shared/api/api";
import type { Patient } from "@/shared/api/types";

interface UseUsersResult {
    users: Patient[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useUsers = (url: string = apiUrl("/v1/patients")): UseUsersResult => {
    const [users, setUsers] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const responseData = await response.json();
            setUsers(responseData.items);

        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, isLoading, error, refetch: fetchUsers };
};

export default useUsers;
