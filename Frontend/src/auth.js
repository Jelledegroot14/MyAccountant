export const auth = {
    isLogged() {
        return !!localStorage.getItem('token');
    },

    saveSession(token, usuarioId) {
        localStorage.setItem('token', token);
        localStorage.setItem('usuarioId', usuarioId);
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getUsuarioId() {
        return localStorage.getItem('usuarioId');
    },

    clearSession() {
        localStorage.clear();
    }
};