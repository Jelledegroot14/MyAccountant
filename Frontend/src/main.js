import { api } from './api.js';
import { auth } from './auth.js';
import { inicializarGrafico } from './chart-logic.js';

let transaccionEditandoId = null; 

const cargarUsuarios = async () => {
    const listaUsuarios = document.getElementById('lista-usuarios');
    const token = auth.getToken();
    if (!listaUsuarios) return;

    try {
        const usuarios = await api.getUsuarios(token);
        listaUsuarios.innerHTML = ''; 
        usuarios.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td>
                    <select class="rol-select" data-id="${u.id}">
                        <option value="user" ${u.rol === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td><button class="btn-eliminar-usuario" data-id="${u.id}">×</button></td>
            `;
            listaUsuarios.appendChild(tr);
        });
    } catch (err) { alert("Error al cargar usuarios: " + err.message); }
};

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
            
            let iconoRecibo = '';
            if (t.imagen_path) {
                const rutaLimpia = t.imagen_path.replace(/^\/+/, '');
                const urlImagen = `http://localhost:3000/${rutaLimpia}`;
                
                iconoRecibo = `
                    <a href="${urlImagen}" target="_blank" class="btn-recibo" title="Ver recibo">
                        <i class="fas fa-receipt"></i>
                    </a>
                `;
            }
        
            const li = document.createElement('li');
            li.innerHTML = `
            <span>${t.concepto} (${t.categoria || 'N/A'})</span>
            <span class="monto-valor ${esGasto ? 'text-gasto' : 'text-ingreso'}">
                ${esGasto ? '-' : '+'}${monto.toFixed(2)}€
            </span>
            <div class="acciones-fila" style="display: flex; gap: 10px; align-items: center;">
                ${iconoRecibo} 
                <button class="btn-editar" data-id="${t.id}" data-concepto="${t.concepto}" data-monto="${t.monto}" data-tipo="${t.tipo}" data-categoria="${t.categoria}">✎</button>
                <button class="btn-eliminar" data-id="${t.id}">×</button>
            </div>
        `;
            lista.appendChild(li);
        });
        const saldoFinal = totalIngresos - totalGastos;
        const saldoElement = document.getElementById('saldo-total');
        saldoElement.innerText = `${saldoFinal.toFixed(2)}€`;
        if (saldoFinal >= 0) {
            saldoElement.classList.add('balance-positivo');
            saldoElement.classList.remove('balance-negativo');
        } else {
            saldoElement.classList.add('balance-negativo');
            saldoElement.classList.remove('balance-positivo');
        }
        
        document.getElementById('total-ingresos').innerText = `${totalIngresos.toFixed(2)}€`;
        document.getElementById('total-gastos').innerText = `${totalGastos.toFixed(2)}€`;
        
        inicializarGrafico(datos);
    } catch (err) { console.error("Error al cargar:", err); }
};

const gestionarUI = () => {
    const seccionAuth = document.getElementById('auth-screen');
    const seccionMovimientos = document.getElementById('seccion-movimientos');
    const btnLogout = document.getElementById('btn-logout');
    const btnAdminView = document.getElementById('btn-admin-view');

    if (auth.isLogged()) {
        seccionAuth.style.display = 'none';
        seccionMovimientos.style.display = 'grid'; 
        if(btnLogout) btnLogout.style.display = 'block';
        actualizarInfoUsuario();
        if(btnAdminView) btnAdminView.style.display = auth.isAdmin() ? 'block' : 'none';
        cargarTransacciones();
    } else {
        seccionAuth.style.display = 'flex'; 
        seccionMovimientos.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'none';
        if(btnAdminView) btnAdminView.style.display = 'none';
    }
};
const actualizarInfoUsuario = () => {
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    
    const nombre = localStorage.getItem('nombre') || 'Usuario';
    const rol = localStorage.getItem('rol') || 'user';

    if (userNameElement && userRoleElement) {
        userNameElement.textContent = nombre;
        userRoleElement.textContent = rol.toUpperCase();
        
        userRoleElement.style.backgroundColor = (rol === 'admin') ? '#9333ea' : '#64748b';
    }
};

    window.mostrarRegistro = () => {
        document.getElementById('login-form-box').style.display = 'none';
        document.getElementById('register-form-box').style.display = 'block';
    };

    window.mostrarLogin = () => {
        document.getElementById('login-form-box').style.display = 'block';
        document.getElementById('register-form-box').style.display = 'none';
    };

document.addEventListener('DOMContentLoaded', () => {
    gestionarUI();

    document.getElementById('btn-admin-view')?.addEventListener('click', () => {
        document.getElementById('seccion-movimientos').style.display = 'none';
        const seccionAdmin = document.getElementById('seccion-admin');
        if (seccionAdmin) seccionAdmin.style.display = 'block';
        cargarUsuarios();
    });

    document.getElementById('btn-cerrar-admin')?.addEventListener('click', () => {
        document.getElementById('seccion-admin').style.display = 'none';
        document.getElementById('seccion-movimientos').style.display = 'grid';
    });

    document.getElementById('lista-usuarios')?.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-eliminar-usuario')) {
            const id = e.target.getAttribute('data-id');
            
            if (confirm("¿Estás seguro de eliminar este usuario?")) {
                try {
                    await api.eliminarUsuario(id, auth.getToken());
                    
                    alert("Usuario eliminado correctamente.");
                    await cargarUsuarios(); 
                    
                } catch (err) {
                    alert("Error al eliminar: " + err.message);
                }
            }
        }
    });

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
            
            if (data && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('nombre', data.user.nombre); 
                localStorage.setItem('rol', data.user.rol);     
                localStorage.setItem('usuarioId', data.user.id); 

                console.log("Sesión guardada:", { 
                    nombre: localStorage.getItem('nombre'), 
                    rol: localStorage.getItem('rol') 
                });

                gestionarUI(); 
            }
        } catch (err) { 
            alert("Error al iniciar sesión: " + err.message); 
        }
    });

    document.getElementById('lista-usuarios')?.addEventListener('change', async (e) => {
        if (e.target.classList.contains('rol-select')) {
            const id = e.target.getAttribute('data-id');
            const nuevoRol = e.target.value;
            
            try {

                await api.actualizarRol(id, nuevoRol, auth.getToken());
                
                alert("Rol actualizado correctamente.");
            } catch (err) {
                alert("Error al actualizar el rol: " + err.message);
                cargarUsuarios(); 
            }
        }
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
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('reg-nombre').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            await api.register(nombre, email, password);
            
            alert("¡Registro exitoso! Ya puedes iniciar sesión.");
            document.getElementById('registerForm').reset(); 
            mostrarLogin(); 
        } catch (err) { 
            alert("Error al registrar: " + err.message); 
        }
    });
    document.getElementById('transaccionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('usuario_id', auth.getUsuarioId());
        formData.append('concepto', document.getElementById('concepto').value);
        formData.append('monto', document.getElementById('monto').value);
        formData.append('tipo', document.getElementById('tipo').value);
        formData.append('categoria', document.getElementById('categoria').value);
        
        const fileInput = document.getElementById('recibo');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            formData.append('imagen', fileInput.files[0]); 
        }
    
        try {
            if (transaccionEditandoId) {
                await api.actualizarTransaccion(transaccionEditandoId, formData, auth.getToken());
                alert("Actualizado con éxito");
            } else {
                await api.guardarTransaccion(formData, auth.getToken());
                alert("Guardado con éxito");
            }            
            cerrarModalTransaccion();
            await cargarTransacciones(); 
        } catch (err) { 
            alert("Error: " + err.message); 
        }
    });
});