import axios from 'axios';
//import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { UNAUTHORIZED } from '../constants/http.mts';
import queryClient from '../clients/queryClient';
import { navigate } from '../lib/navigate';
//import { AppDispatch } from "../store";

const options = {
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
}

const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use(response => response.data?.data || response.data);

const authApi = axios.create(options);

authApi.interceptors.response.use(
    response => response.data?.data || response.data,
    async (error) => {
        const { config, response } = error;
        const { status, data } = response || {};

        if( status === UNAUTHORIZED && data?.errorCode === "InvalidAccessToken") {
            try {
                await TokenRefreshClient.post("/auth/refresh");
                return TokenRefreshClient(config);
            } catch (error) {
                queryClient.clear();
                navigate("/login", {
                    state: {
                        redirectUrl: window.location.pathname
                    }
                });
            }
        }

        return Promise.reject({ status, ...data });
    }
)


// export const setUpAxiosInterceptors = (dispatch: AppDispatch) => {
//     authApi.interceptors.response.use(
//         response => response,
//         async (error: AxiosError) => {
//             const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
//             if(error.response?.status === UNAUTHORIZED && !originalRequest._retry) {
//                 originalRequest._retry = true;
//                 try {
//                     await authApi.post('/auth/refresh');
//                     return authApi(originalRequest);
//                 } catch (refreshError) {
//                     dispatch({ type: "auth/logout" });
//                     return Promise.reject(refreshError);
//                 }
//             }
//             return Promise.reject(error);
//         }
//     );
// };


export default authApi;