'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from "@/shared/api/api";

const useUsers = (url = apiUrl("/v1/patients")) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                const responseData = await response.json();
                setUsers(responseData.items);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [url]);

    return { users, isLoading, error };
};

export default useUsers;
