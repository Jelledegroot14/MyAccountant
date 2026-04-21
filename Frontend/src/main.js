import { api } from './api.js';
import { auth } from './auth.js';
import { inicializarGrafico } from './chart-logic.js';
const cargarTransacciones = async () => {
    try {
        const datos = await api.getTransacciones(auth.getUsuarioId(), auth.getToken());
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
        document.getElementById('saldo-total').innerText = `${saldoFinal.toFixed(2)}€`;
        document.getElementById('total-ingresos').innerText = `${totalIngresos.toFixed(2)}€`;
        document.getElementById('total-gastos').innerText = `${totalGastos.toFixed(2)}€`;
        inicializarGrafico(datos, saldoFinal);

    } catch (err) { 
        console.error("Error al cargar:", err); 
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
        auth.logout();
        window.location.reload();
    });
});