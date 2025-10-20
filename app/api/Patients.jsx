'use client';

import { useState, useEffect } from 'react';
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;

const useUsers = (url = `${baseUrl}/v1/patients`) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const responseData = await response.json();
            console.log("Received data:", responseData);
            setUsers(responseData.items);
            console.log(users);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [url]);

    return { users, isLoading, error, refetch: fetchUsers };
};

export default useUsers;