import { api } from './api.js';
import { auth } from './auth.js';
import { inicializarGrafico } from './chart-logic.js';

const cargarTransacciones = async () => {
    const userId = auth.getUsuarioId();
    const token = auth.getToken();

    if (!userId || userId === 'undefined' || !token) {
        console.warn("No hay usuario o token disponible. Esperando login...");
        return;
    }

    try {
        const datos = await api.getTransacciones(userId, token);
        
        if (!Array.isArray(datos)) {
            console.error("El servidor no devolvió una lista de transacciones:", datos);
            return;
        }

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
                <span class="${esGasto ? 'text-gasto' : 'text-ingreso'}">
                    ${esGasto ? '-' : '+'}${monto.toFixed(2)}€
                </span>
                <button class="btn-eliminar" data-id="${t.id}">×</button>
            `;
            lista.appendChild(li);
        });
        const saldoFinal = totalIngresos - totalGastos;
        const elementoSaldo = document.getElementById('saldo-total');

        if (elementoSaldo) {
            elementoSaldo.innerText = `${saldoFinal.toFixed(2)}€`;
            elementoSaldo.style.color = saldoFinal >= 0 ? '#2ecc71' : '#e74c3c';
        }
        
        document.getElementById('total-ingresos').innerText = `${totalIngresos.toFixed(2)}€`;
        document.getElementById('total-gastos').innerText = `${totalGastos.toFixed(2)}€`;
        
        inicializarGrafico(datos);

    } catch (err) { 
        console.error("Error al cargar transacciones:", err); 
    }
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

    document.getElementById('btn-open-modal')?.addEventListener('click', () => modalTrans?.classList.add('active'));
    document.querySelectorAll('.close-modal').forEach(btn => 
        btn.addEventListener('click', () => {
            modalTrans?.classList.remove('active');
            modalHist?.classList.remove('active');
        })
    );
    document.getElementById('btn-open-historial')?.addEventListener('click', () => modalHist?.classList.add('active'));

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
    
        try {
            console.log("--- Iniciando petición de login ---");
            const data = await api.login(email, password);
            
            console.log("RESPUESTA COMPLETA DEL SERVIDOR:", data); 
    
            if (!data || typeof data !== 'object') {
                console.error("El servidor devolvió algo que no es un objeto:", data);
                alert("Error: El formato de respuesta del servidor no es válido.");
                return;
            }

            const token = data.token || data.access_token || data.jwt || data.accessToken;
            
            const userId = data.usuarioId || data.userId || data.id || data.user_id || data._id || (data.user ? data.user.id : null);
            
            if (token && userId) {
                auth.saveSession(token, userId);
                gestionarUI();
            } else {
                console.error("FALLO EN ESTRUCTURA: Los campos esperados no existen en:", data);
                alert("El servidor respondió, pero no encontramos 'token' o 'ID'. Mira la consola (pestaña Console) para ver qué campos llegaron.");
            }
        } catch (err) {
            console.error("ERROR CAPTURADO EN LOGIN:", err);
            alert("Error en el login: " + err.message);
        }
    });

    document.getElementById('transaccionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevaTrans = {
            usuario_id: auth.getUsuarioId(),
            concepto: document.getElementById('concepto').value,
            monto: document.getElementById('monto').value,
            tipo: document.getElementById('tipo').value,
            categoria: document.getElementById('categoria').value
        };

        try {
            await api.guardarTransaccion(nuevaTrans, auth.getToken());
            modalTrans?.classList.remove('active');
            document.getElementById('transaccionForm').reset();
            await cargarTransacciones(); 
        } catch (err) { alert("Error al guardar: " + err.message); }
    });

    document.getElementById('lista-transacciones')?.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-eliminar')) {
            const id = e.target.getAttribute('data-id');
            if (confirm("¿Eliminar este movimiento?")) {
                await api.eliminarTransaccion(id, auth.getToken());
                await cargarTransacciones();
            }
        }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        auth.clearSession(); 
        window.location.reload();
    });
});