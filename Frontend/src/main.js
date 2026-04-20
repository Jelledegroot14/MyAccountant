import { api } from './api.js';
import { auth } from './auth.js';

console.log("DEBUG - ¿Qué contiene auth?:", auth);
console.log("DEBUG - ¿Tiene isLogged?:", typeof auth.isLogged); 

document.getElementById('btn-ir-registro')?.addEventListener('click', () => {
    document.getElementById('seccion-login').style.display = 'none';
    document.getElementById('seccion-registro').style.display = 'block';
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {

const data = await api.login(email, password);

if (data && data.token) {
    auth.saveSession(data.token, data.user.id); 
    
    gestionarPantalla(); 
} else {
    alert("Login exitoso, pero no se recibió el token.");
}
    } catch (err) {
        console.error("Error de login:", err);
        alert("No se pudo conectar al servidor. Inténtalo más tarde.");
    }
});
const gestionarPantalla = () => {
    const authGroup = document.getElementById('auth-buttons');
    const logoutBtn = document.getElementById('btn-logout');
    const seccionLogin = document.getElementById('seccion-login');
    const seccionRegistro = document.getElementById('seccion-registro');
    const seccionMovimientos = document.getElementById('seccion-movimientos');

    [seccionLogin, seccionRegistro, seccionMovimientos].forEach(el => el.style.display = 'none');

    if (auth.isLogged()) {
        console.log("DEBUG: Renderizando vista de usuario logueado");
        authGroup.style.display = 'none';
        logoutBtn.style.display = 'block';
        seccionMovimientos.style.display = 'block'; 
        
        cargarTransacciones(); 
    } else {
        console.log("DEBUG: Renderizando vista de invitado");
        authGroup.style.display = 'flex';
        logoutBtn.style.display = 'none';
        seccionLogin.style.display = 'block'; 
    }
};
const cargarTransacciones = async () => {
    try {
        const datos = await api.getTransacciones(auth.getUsuarioId(), auth.getToken());
        console.log("Transacciones recibidas:", datos);

        const lista = document.getElementById('lista-transacciones');
        lista.innerHTML = ''; 

        let ingresos = 0;
        let gastos = 0;

        datos.forEach(t => {
            const monto = parseFloat(t.monto);
            if (t.tipo === 'ingreso') {
                ingresos += monto;
            } else {
                gastos += monto;
            }
            const li = document.createElement('li');
            li.innerHTML = `
            <span>${t.concepto} - <strong>${monto.toFixed(2)}€</strong></span>
            <button class="btn-eliminar" onclick="borrarMovimiento('${t.id}')">&times;</button>
        `;
            lista.appendChild(li);
        });

        const saldoTotal = ingresos - gastos;
        document.getElementById('total-ingresos').innerText = `${ingresos.toFixed(2)}€`;
        document.getElementById('total-gastos').innerText = `${gastos.toFixed(2)}€`;
        document.getElementById('saldo-total').innerText = `${saldoTotal.toFixed(2)}€`;

    } catch (err) { 
        console.error("Error cargando datos:", err); 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    gestionarPantalla();

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        gestionarPantalla(); 
    });

    window.borrarMovimiento = async (id) => {
        if (!confirm("¿Eliminar?")) return;
        const res = await api.eliminarTransaccion(id, auth.getToken());
        if (res.ok) cargarTransacciones();
        else alert("Error al borrar");
    };

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        auth.clearSession();
        window.location.reload();
    });
});