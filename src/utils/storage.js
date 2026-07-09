import * as SecureStore from 'expo-secure-store';

let authToken = null;

export const saveToken = async (token) => {
    try {
        const cleanToken = typeof token === 'string' ? token.trim() : token;
        authToken = cleanToken;
        await SecureStore.setItemAsync('authToken', cleanToken);
    } catch (error) {
        console.error('STORAGE: Error saving token to SecureStore:', error);
    }
};

export const getToken = async () => {
    try {
        if (authToken) {
            return authToken;
        }
        const token = await SecureStore.getItemAsync('authToken');
        authToken = token;
        return token;
    } catch (error) {
        console.error('STORAGE: Error getting token from SecureStore:', error);
        return authToken;
    }
};

export const removeToken = async () => {
    try {
        console.log('STORAGE: Removing token');
        authToken = null;
        await SecureStore.deleteItemAsync('authToken');
    } catch (error) {
        console.error('STORAGE: Error removing token from SecureStore:', error);
    }
};
