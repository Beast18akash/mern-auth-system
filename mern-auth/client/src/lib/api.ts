import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/auth";

/**
 * Send password reset link to user email.
 * @param email User's email address
 */
export const forgotPassword = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
  return response.data;
};

/**
 * Reset user password with a secure token.
 * @param token Reset token received in email
 * @param password New password
 */
export const resetPassword = async (token: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/reset-password/${token}`, { password });
  return response.data;
};
