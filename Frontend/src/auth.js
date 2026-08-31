export const auth = {
    isLogged() {
        return !!localStorage.getItem('token');
    },

    saveSession(token, usuarioId, rol) {
        localStorage.setItem('token', token);
        localStorage.setItem('usuarioId', usuarioId);
        localStorage.setItem('rol', rol);
    },
    isAdmin() {
        return localStorage.getItem('rol') === 'admin';
    },
    getToken() {
        return localStorage.getItem('token');
    },

    getUsuarioId() {
        return localStorage.getItem('usuarioId');
    },

    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioId');
        localStorage.removeItem('rol');
        localStorage.removeItem('nombre');
    },
};
