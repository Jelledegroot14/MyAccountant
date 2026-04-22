import { api } from './api.js';
import { auth } from './auth.js';
import { inicializarGrafico } from './chart-logic.js';

let transaccionEditandoId = null; 

const cargarTransacciones = async () => {
    const userId = auth.getUsuarioId();
    const token = auth.getToken();

    if (!userId || userId === 'undefined' || !token) return;

    try {
        const datos = await api.getTransacciones(userId, token);
        if (!Array.isArray(datos)) return;

        const lista = document.getElementById('lista-transacciones');
        if (!lista) return;

        lista.innerHTML = ''; 
        let totalIngresos = 0;
        let totalGastos = 0;

        datos.forEach(t => {
            const monto = parseFloat(t.monto) || 0;
            const esGasto = (t.tipo === 'gasto');
            if (esGasto) totalGastos += monto; 
            else totalIngresos += monto;
            
            const li = document.createElement('li');
            li.innerHTML = `
            <span>${t.concepto} (${t.categoria || 'N/A'})</span>
            <span class="monto-valor ${esGasto ? 'text-gasto' : 'text-ingreso'}">
                ${esGasto ? '-' : '+'}${monto.toFixed(2)}€
            </span>
            <div>
                <button class="btn-editar" data-id="${t.id}" data-concepto="${t.concepto}" data-monto="${t.monto}" data-tipo="${t.tipo}" data-categoria="${t.categoria}">✎</button>
                <button class="btn-eliminar" data-id="${t.id}">×</button>
            </div>
        `;
            lista.appendChild(li);
        });

        const saldoFinal = totalIngresos - totalGastos;
        document.getElementById('saldo-total').innerText = `${saldoFinal.toFixed(2)}€`;
        document.getElementById('total-ingresos').innerText = `${totalIngresos.toFixed(2)}€`;
        document.getElementById('total-gastos').innerText = `${totalGastos.toFixed(2)}€`;
        
        inicializarGrafico(datos);
    } catch (err) { console.error("Error al cargar:", err); }
};

const gestionarUI = () => {
    const seccionLogin = document.getElementById('seccion-login');
    const seccionMovimientos = document.getElementById('seccion-movimientos');
    const btnLogout = document.getElementById('btn-logout');

    if (auth.isLogged()) {
        seccionLogin.style.display = 'none';
        seccionMovimientos.style.display = 'grid';
        if(btnLogout) btnLogout.style.display = 'block';
        cargarTransacciones();
    } else {
        seccionLogin.style.display = 'block';
        seccionMovimientos.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    gestionarUI();

    const modalTrans = document.getElementById('modal-transaccion');
    const modalHist = document.getElementById('modal-historial');
    const modalTitulo = document.getElementById('modal-titulo'); 

    const cerrarModalTransaccion = () => {
        transaccionEditandoId = null;
        document.getElementById('transaccionForm').reset();
        modalTrans?.classList.remove('active');
    };

    const cerrarModalHistorial = () => {
        modalHist?.classList.remove('active');
    };

    document.getElementById('btn-open-modal')?.addEventListener('click', () => {
        transaccionEditandoId = null;
        if(modalTitulo) modalTitulo.innerText = "Nueva Transacción";
        modalTrans?.classList.add('active');
    });

    document.getElementById('btn-open-historial')?.addEventListener('click', () => modalHist?.classList.add('active'));
    document.getElementById('close-transaccion')?.addEventListener('click', cerrarModalTransaccion);
    document.getElementById('close-historial')?.addEventListener('click', cerrarModalHistorial);

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const data = await api.login(email, password);
            const token = data.token || data.access_token;
            const userId = data.usuarioId || data.userId || (data.user ? data.user.id : null);
            if (token && userId) {
                auth.saveSession(token, userId);
                gestionarUI();
            }
        } catch (err) { alert("Error: " + err.message); }
    });

    document.getElementById('transaccionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const transData = {
            usuario_id: auth.getUsuarioId(),
            concepto: document.getElementById('concepto').value,
            monto: document.getElementById('monto').value,
            tipo: document.getElementById('tipo').value,
            categoria: document.getElementById('categoria').value
        };

        try {
            if (transaccionEditandoId) {
                await api.actualizarTransaccion(transaccionEditandoId, transData, auth.getToken());
            } else {
                await api.guardarTransaccion(transData, auth.getToken());
            }
            cerrarModalTransaccion();
            await cargarTransacciones(); 
        } catch (err) { alert("Error: " + err.message); }
    });

    document.getElementById('lista-transacciones')?.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        
        if (e.target.classList.contains('btn-eliminar')) {
            if (confirm("¿Eliminar este movimiento?")) {
                await api.eliminarTransaccion(id, auth.getToken());
                await cargarTransacciones();
            }
        }
        
        if (e.target.classList.contains('btn-editar')) {
            transaccionEditandoId = id;
            if(modalTitulo) modalTitulo.innerText = "Editar Transacción";
            document.getElementById('concepto').value = e.target.getAttribute('data-concepto');
            document.getElementById('monto').value = e.target.getAttribute('data-monto');
            document.getElementById('tipo').value = e.target.getAttribute('data-tipo');
            document.getElementById('categoria').value = e.target.getAttribute('data-categoria');
            modalTrans?.classList.add('active');
        }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        auth.clearSession(); 
        window.location.reload();
    });
});