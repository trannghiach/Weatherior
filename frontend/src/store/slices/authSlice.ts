import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import authApi from "../../api/axios";
import { AxiosError } from "axios";


export interface User {
    name: string;
    email: string;
    password: string;
    [key: string]: any;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

interface Credentials {
    email: string;
    password: string;
}

interface RegisterCredentials extends Credentials {
    confirmPassword: string;
    playerName: string;
}

export const login = createAsyncThunk<User, Credentials, { rejectValue: string }>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const { data } = await authApi.post<{ user: User }>('/auth/login', credentials);
            return data.user;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data.message || "Login failed");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const register = createAsyncThunk<User, RegisterCredentials, { rejectValue: string }>(
    'auth/register',
    async (credentials, { rejectWithValue }) => {
        try {
            const { data } = await authApi.post<{ user: User }>('/auth/register', credentials);
            return data.user;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data.message || "Registration failed");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authApi.post('/auth/logout');
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data.message || "Logout failed");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

export const getUser = createAsyncThunk<User, void, { rejectValue: string }>(
    '/user',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await authApi.get<User>('/user');
            return data.user;
        } catch (error) {
            if (error instanceof AxiosError) {
                return rejectWithValue(error.response?.data.message || "Session expired");
            }
            return rejectWithValue("An unexpected error occurred");
        }
    }
);

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        updateUser(state, action: PayloadAction<Partial<User>>) {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        }
    },
    extraReducers: builder => {
        builder
            //login
            .addCase(login.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            //register
            .addCase(register.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            //logout
            .addCase(logout.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logout.fulfilled, state => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'An unexpected error occurred';
            });
    }
});

export const { updateUser } = authSlice.actions;
export default authSlice.reducer;