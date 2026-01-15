import { BookMetadata, TitleOption, BookProject, Chapter } from '../types';

const API_URL = '/api/projects';

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
        const res = await fetch('/api/payment/use', {
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
    const res = await fetch('/api/payment/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};
