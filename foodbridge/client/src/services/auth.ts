import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const register = async (userData: any): Promise<any> => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error: any) {
        throw error?.response?.data ?? error;
    }
};

export const login = async (credentials: any): Promise<any> => {
    try {
        const response = await axios.post(`${API_URL}/login`, credentials);
        return response.data;
    } catch (error: any) {
        throw error?.response?.data ?? error;
    }
};

export const logout = async (): Promise<void> => {
    try {
        await axios.post(`${API_URL}/logout`);
    } catch (error: any) {
        throw error?.response?.data ?? error;
    }
};