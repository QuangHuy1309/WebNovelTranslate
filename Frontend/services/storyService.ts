import api from './api'; // Base Axios instance

export const getStories = () => api.get('/Stories');
export const getStoryById = (id: number) => api.get(`/Stories/${id}`);
export const createStory = (data: { title: string; author: string; description?: string }) => {
    // Ép tạo key viết hoa chữ cái đầu để khớp với Model của Backend C#
    const payload = {
        TitleEn: data.title,
        TitleVn: data.title,
        Author: data.author,
        Description: data.description || ""
    };
    
    return api.post('/Stories', payload);
};