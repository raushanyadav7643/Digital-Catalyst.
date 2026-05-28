"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axios.js';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        const tokenInfo = localStorage.getItem('token');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        if (tokenInfo) {
            setToken(tokenInfo);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            setToken(data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) throw error.response.data;
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            return data; // Returns { message, email }
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            setUser(data);
            setToken(data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'OTP verification failed';
        }
    };

    const forgotPassword = async (email) => {
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Failed to send reset OTP';
        }
    };

    const resetPassword = async (email, otp, newPassword) => {
        try {
            const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Password reset failed';
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, verifyOTP, logout, loading, forgotPassword, resetPassword }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};