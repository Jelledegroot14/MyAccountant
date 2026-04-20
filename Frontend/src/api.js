const API_URL = 'http://localhost:3000';

export const api = {
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await res.json();
    },

    getTransacciones: async (usuarioId, token) => {
        const res = await fetch(`${API_URL}/transacciones/${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },

    eliminarTransaccion: async (id, token) => {
        const res = await fetch(`${API_URL}/transacciones/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res;
    },
    guardarTransaccion: async (transaccion, token) => {
        const response = await fetch('TU_URL_API/transacciones', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(transaccion)
        });
        return response.json();
    }
};