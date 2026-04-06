import './style.css';
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const mensaje = document.getElementById('mensaje');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    mensaje.style.color = "green";
                    mensaje.innerText = `¡Bienvenido, ${data.user.nombre}!`;

                    localStorage.setItem('token', data.token);
                } else {
                    mensaje.style.color = "red";
                    mensaje.innerText = data.error || "Error al iniciar sesión";
                }
            } catch (error) {
                mensaje.style.color = "red";
                mensaje.innerText = "Error: El servidor no responde";
            }
        });
    }
window.mostrar = (id) => {
    document.querySelectorAll('.formulario').forEach(f => f.style.display = 'none');
    document.getElementById(id).style.display = 'block';
};

const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
    });
    
    const data = await res.json();
    if (res.ok) {
        document.getElementById('mensaje').innerText = "Usuario creado. ¡Ya puedes loguearte!";
        mostrar('seccion-login');
    } else {
        document.getElementById('mensaje').innerText = data.error;
    }
});
});