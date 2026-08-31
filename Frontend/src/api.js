import { auth } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class SesionExpiradaError extends Error {
    constructor() {
        super('Tu sesión ha expirado. Inicia sesión de nuevo.');
        this.name = 'SesionExpiradaError';
    }
}

// 401 = token missing/invalid/expired -> force logout.
// 403 stays a normal app error (e.g. "not your transaction", "admin only") and must not log the user out.
const manejarNoAutorizado = (response) => {
    if (response.status === 401) {
        auth.clearSession();
        window.dispatchEvent(new CustomEvent('sesion-expirada'));
        throw new SesionExpiradaError();
    }
};

export const api = {
    getTransacciones: async (usuarioId, token) => {
        const timestamp = new Date().getTime();
        const res = await fetch(`${API_URL}/transacciones/${usuarioId}?t=${timestamp}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
        manejarNoAutorizado(res);
        return await res.json();
    },

    getRecibo: async (transaccionId, token) => {
        const res = await fetch(`${API_URL}/transacciones/${transaccionId}/recibo`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        manejarNoAutorizado(res);
        if (!res.ok) throw new Error('No se pudo cargar el recibo');
        return await res.blob();
    },

    eliminarTransaccion: async (id, token) => {
        const res = await fetch(`${API_URL}/transacciones/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        manejarNoAutorizado(res);
        if (!res.ok) throw new Error('Error al eliminar');
    },

    actualizarTransaccion: async (id, formData, token) => {
        const response = await fetch(`${API_URL}/transacciones/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        manejarNoAutorizado(response);
        if (!response.ok) throw new Error('No se pudo actualizar');
        return await response.json();
    },

    login: async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Email o contraseña incorrectos');
        }
        return await response.json();
    },

    register: async (nombre, email, password) => {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password }),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error en el registro');
        }
        return await res.json();
    },

    eliminarUsuario: async (id, token) => {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        manejarNoAutorizado(response);
        if (!response.ok) throw new Error('Error al eliminar el usuario');
        return await response.json();
    },

    getUsuarios: async (token) => {
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        manejarNoAutorizado(response);
        if (!response.ok) throw new Error('Error al obtener usuarios');
        return await response.json();
    },

    actualizarRol: async (id, rol, token) => {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ rol }),
        });

        manejarNoAutorizado(response);
        if (!response.ok) throw new Error('Error al actualizar el rol');
        return response.json();
    },

    guardarTransaccion: async (formData, token) => {
        const response = await fetch(`${API_URL}/transacciones`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        manejarNoAutorizado(response);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Error al guardar: ' + errorText);
        }
        return await response.json();
    },
};
