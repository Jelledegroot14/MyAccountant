import { api } from './api.js';
import { auth } from './auth.js';

const gestionarPantalla = () => {
    const authGroup = document.getElementById('auth-buttons');
    const logoutBtn = document.getElementById('btn-logout');
    const seccionLogin = document.getElementById('seccion-login');
    const seccionMovimientos = document.getElementById('seccion-movimientos');

    [seccionLogin, seccionMovimientos].forEach(el => { if(el) el.style.display = 'none'; });

    if (auth.isLogged()) {
        if(authGroup) authGroup.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'block';
        if(seccionMovimientos) seccionMovimientos.style.display = 'grid';
        cargarTransacciones();
    } else {
        if(authGroup) authGroup.style.display = 'flex';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(seccionLogin) seccionLogin.style.display = 'block';
    }
};

const cargarTransacciones = async () => {
    try {
        const datos = await api.getTransacciones(auth.getUsuarioId(), auth.getToken());
        const lista = document.getElementById('lista-transacciones');
        if (!lista) return;
        lista.innerHTML = ''; 

        let ingresos = 0;
        let gastos = 0;

        datos.forEach(t => {
            const monto = parseFloat(t.monto);
            if (t.tipo === 'ingreso') ingresos += monto;
            else gastos += monto;
            
            const li = document.createElement('li');
            li.innerHTML = `<span>${t.concepto} - <strong>${monto.toFixed(2)}€</strong></span>`;
            lista.appendChild(li);
        });

        if(document.getElementById('total-ingresos')) document.getElementById('total-ingresos').innerText = `${ingresos.toFixed(2)}€`;
        if(document.getElementById('total-gastos')) document.getElementById('total-gastos').innerText = `${gastos.toFixed(2)}€`;
        if(document.getElementById('saldo-total')) document.getElementById('saldo-total').innerText = `${(ingresos - gastos).toFixed(2)}€`;
    } catch (err) { console.error("Error cargando datos:", err); }
};

document.addEventListener('DOMContentLoaded', () => {
    gestionarPantalla();

    const modal = document.getElementById('modal-transaccion');
    const btnOpen = document.getElementById('btn-open-modal');
    const btnClose = document.querySelector('.close-modal');

    btnOpen?.addEventListener('click', () => modal?.classList.add('active'));
    btnClose?.addEventListener('click', () => modal?.classList.remove('active'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const data = await api.login(email, password);
        if (data?.token) {
            auth.saveSession(data.token, data.user.id);
            gestionarPantalla(); 
        }
    });

    document.getElementById('transaccionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const transaccion = {
            concepto: document.getElementById('concepto').value,
            monto: document.getElementById('monto').value,
            tipo: document.getElementById('tipo').value
        };

        try {
            await api.guardarTransaccion(transaccion, auth.getToken()); 
            modal?.classList.remove('active'); 
            document.getElementById('transaccionForm').reset();
            cargarTransacciones(); 
        } catch (err) { alert("Error al guardar"); }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        auth.clearSession();
        window.location.reload();
    });
});