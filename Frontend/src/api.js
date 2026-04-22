const API_URL = 'http://localhost:3000';

export const api = {
    getTransacciones: async (usuarioId, token) => {
        const timestamp = new Date().getTime();
        const res = await fetch(`${API_URL}/transacciones/${usuarioId}?t=${timestamp}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        return await res.json();
    },

    guardarTransaccion: async (transaccion, token) => {
        const response = await fetch(`${API_URL}/transacciones`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(transaccion)
        });
        if (!response.ok) throw new Error('Error al guardar');
        return await response.json();
    },

    eliminarTransaccion: async (id, token) => {
        await fetch(`${API_URL}/transacciones/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Email o contraseña incorrectos');
        return await response.json(); 
    }
};