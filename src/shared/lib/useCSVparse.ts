import { useState, useEffect } from 'react';
import Papa from 'papaparse';

interface CSVItem {
    time_sec: number;
    value: number;
}

interface UseCSVDataResult {
    data: CSVItem[];
    loading: boolean;
    error: string | null;
}

const useCSVData = (filePath: string): UseCSVDataResult => {
    const [data, setData] = useState<CSVItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
                }
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsedData = (results.data as any[]).map((item) => ({
                            time_sec: item.time_sec,
                            value: item.value,
                        }));
                        setData(parsedData);
                        setLoading(false);
                    },
                    error: (err: Error) => {
                        setError(err.message);
                        setLoading(false);
                    }
                });

            } catch (e: any) {
                setError(e.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [filePath]);

    return { data, loading, error };
};

export default useCSVData;
