import api from './api'; // Base Axios instance

export const getStories = () => api.get('/Stories');
export const getStoryById = (id: number) => api.get(`/Stories/${id}`);

export const deleteStory = (id: number) => api.delete(`/Stories/${id}`);