import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { User } from "../store/slices/authSlice";
import authApi from "../api/axios";


export const useUserProfile = (): UseQueryResult<User, Error> => {
    return useQuery({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const { data } = await authApi.get<User>('/user');
            return data;
        },
        staleTime: 1000 * 60 * 5,
    })
}

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();
    return async (updatedData: Partial<User>): Promise<void> => {
        await authApi.put(`/user/profile`, updatedData);
        queryClient.invalidateQueries({ queryKey: ["userProfile"]});
    }
}