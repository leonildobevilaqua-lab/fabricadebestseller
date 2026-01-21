import { BookMetadata, TitleOption, BookProject, Chapter } from '../types';

// Robust URL Resolution Strategy
export const getApiBase = () => {
    const env = (import.meta as any).env.VITE_API_URL;
    if (env) return env;
    const custom = localStorage.getItem('admin_api_url');
    if (custom) return custom.trim();
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '';
    return window.location.origin;
};

let BASE_URL = getApiBase();
if (BASE_URL.endsWith('/')) BASE_URL = BASE_URL.slice(0, -1);

const API_URL = `${BASE_URL}/api/projects`;
const PAYMENT_URL = `${BASE_URL}/api/payment`;

export const createProject = async (authorName: string, topic: string, language?: string, contact?: any, forceNew?: boolean): Promise<BookProject> => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, topic, language, contact, forceNew })
    });
    return res.json();
};

export const getProject = async (id: string): Promise<BookProject> => {
    const res = await fetch(`${API_URL}/${id}`);
    return res.json();
};

export const startResearch = async (id: string, language?: string): Promise<void> => {
    await fetch(`${API_URL}/${id}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
    });
};

export const selectTitle = async (id: string, title: string, subtitle: string): Promise<void> => {
    await fetch(`${API_URL}/${id}/select-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle })
    });
};

export const generateBookContent = async (id: string, language?: string): Promise<void> => {
    await fetch(`${API_URL}/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
    });
};

export const updateProject = async (id: string, data: any): Promise<void> => {
    await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
};

export const useCredit = async (email: string): Promise<boolean> => {
    try {
        const res = await fetch(`${PAYMENT_URL}/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        return data.success;
    } catch (e) {
        console.error("Failed to use credit", e);
        return false;
    }
};

export const createLead = async (data: any): Promise<any> => {
    const res = await fetch(`${PAYMENT_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};
