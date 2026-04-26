const API_URL = 'http://localhost:3000';
const BASE_URL = 'http://localhost:3000';
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
    actualizarTransaccion: async (id, transaccion, token) => {
        const response = await fetch(`${API_URL}/transacciones/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(transaccion)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            console.error("Detalle del error del servidor:", errorData);
            throw new Error(errorData.message || 'Error al actualizar');
        }
        return await response.json();
    },
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Email o contraseña incorrectos');
        return await response.json(); 
    },
    register: async (nombre, email, password) => {
        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });
        if (!res.ok) throw new Error("Error en el registro");
        return await res.json();
    },

    eliminarUsuario: async (id, token) => {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Error al eliminar el usuario");
        return await response.json();
    },

    getUsuarios: async (token) => {
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Error al obtener usuarios");
        return await response.json();
    },

    actualizarRol: async (id, rol, token) => {

        const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rol }) 
        });

        if (!response.ok) {
            throw new Error("Error al actualizar el rol");
        }
        return response.json();
    },
guardarTransaccion: async (formData, token) => {
    const response = await fetch(`${API_URL}/transacciones`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}` 
        },
        body: formData 
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Error al guardar: ' + errorText);
    }
    return await response.json();
},
};