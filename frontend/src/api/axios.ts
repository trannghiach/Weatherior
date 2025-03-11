import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { UNAUTHORIZED } from '../constants/http.mts';
import { AppDispatch } from "../store";


const authApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
})

export const setUpAxiosInterceptors = (dispatch: AppDispatch) => {
    authApi.interceptors.response.use(
        response => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
            if(error.response?.status === UNAUTHORIZED && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    await authApi.post('/auth/refresh');
                    return authApi(originalRequest);
                } catch (refreshError) {
                    dispatch({ type: "auth/logout" });
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
};


export default authApi;