import { BookMetadata, TitleOption, BookProject, Chapter } from '../types';

const API_URL = 'http://localhost:3001/api/projects';

export const createProject = async (authorName: string, topic: string, language?: string, contact?: any): Promise<BookProject> => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, topic, language, contact })
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
