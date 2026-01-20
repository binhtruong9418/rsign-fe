import api from "../api";

export interface UpdateProfileData {
    fullName?: string;
    phoneNumber?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export const updateProfile = async (data: UpdateProfileData): Promise<any> => {
    const response = await api.put("/api/users/me", data);
    return response.data;
};

export const changePassword = async (
    data: ChangePasswordData,
): Promise<any> => {
    const response = await api.post("/api/users/change-password", data);
    return response.data;
};

const userService = {
    updateProfile,
    changePassword,
};

export default userService;
