const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = localStorage.getItem('token');
    if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[API] Fetching: ${API_URL}${endpoint}`);
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            console.error('[API] Error:', error);
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('[API] Network/Fetch Error:', error);
        throw error;
    }
}
