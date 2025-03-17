import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CustomSocket {
    connected: boolean;
    id?: string;
    emit: (event: string, data: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    disconnect: () => void;
}

interface SocketState {
    socket: CustomSocket | null;
    isConnected: boolean;
}

const initialState: SocketState = {
    socket: null,
    isConnected: false,
}

const socketSlice = createSlice({
    name: "socket",
    initialState,
    reducers: {
        setSocket: (state, action: PayloadAction<CustomSocket | null>) => {
            state.socket = action.payload; 
        },
        setConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
    },
});

export const { setSocket, setConnected } = socketSlice.actions;

export default socketSlice.reducer;