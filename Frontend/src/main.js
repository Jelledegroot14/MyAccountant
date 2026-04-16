import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const gestionarPantalla = () => {
        const token = localStorage.getItem('token');
        
        const authGroup = document.getElementById('auth-buttons');
        const logoutBtn = document.getElementById('btn-logout');
        const loginVista = document.querySelector('.login-container');
        const appVista = document.querySelector('.formulario');
    
        if (token) {
            authGroup.style.setProperty('display', 'none', 'important');
            logoutBtn.style.setProperty('display', 'block', 'important');
            if (loginVista) loginVista.style.display = 'none';
            if (appVista) appVista.style.display = 'block';
            cargarTransacciones(); 
        } else {
            authGroup.style.setProperty('display', 'flex', 'important');
            logoutBtn.style.setProperty('display', 'none', 'important');
            if (loginVista) loginVista.style.display = 'block';
            if (appVista) appVista.style.display = 'none';
        }
    };
    document.addEventListener('DOMContentLoaded', gestionarPantalla);
    
    const mensaje = document.getElementById('mensaje');

    window.cargarTransacciones = async () => {
        const uid = localStorage.getItem('usuarioId');
        const token = localStorage.getItem('token');
    
        if (!uid || !token) return;
    
        try {
            const res = await fetch(`http://localhost:3000/transacciones/${uid}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await res.json();
    
            if (!Array.isArray(data)) {
                console.error("El servidor no devolvió una lista:", data.error);
                return;
            }
    
            const lista = document.getElementById('lista-transacciones');
            lista.innerHTML = '';
    
            let ingresos = 0;
            let gastos = 0;
    
            data.forEach(t => {
                const valor = parseFloat(t.monto);
                if (t.tipo === 'ingreso') { ingresos += valor; } 
                else { gastos += valor; }
    
                const li = document.createElement('li');
                li.style.display = "flex";
                li.style.justifyContent = "space-between";
                li.style.padding = "10px";
                li.style.borderBottom = "1px solid #ddd";
    
                const color = t.tipo === 'gasto' ? 'red' : 'green';
                li.innerHTML = `
                    <span><strong>${t.concepto}</strong> (${t.categoria})</span>
                    <span style="color: ${color}">${t.monto}€ 
                        <button onclick="borrarMovimiento(${t.id})" style="border:none; background:none; cursor:pointer;">❌</button>
                    </span>
                `;
                lista.appendChild(li);
            });
    
            const saldoFinal = ingresos - gastos;
            document.getElementById('total-ingresos').innerText = `${ingresos.toFixed(2)}€`;
            document.getElementById('total-gastos').innerText = `${gastos.toFixed(2)}€`;
            const elementoSaldo = document.getElementById('saldo-total');
            elementoSaldo.innerText = `${saldoFinal.toFixed(2)}€`;
            elementoSaldo.style.color = saldoFinal >= 0 ? 'black' : 'red';
    
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    }
    window.mostrar = (id) => {
        document.querySelectorAll('.formulario').forEach(f => f.style.display = 'none');
        const seccion = document.getElementById(id);
        if (seccion) seccion.style.display = 'block';
    };

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token); 
                gestionarPantalla();
                localStorage.setItem('usuarioId', data.user.id);
                
                mensaje.style.color = "green";
                mensaje.innerText = "¡Sesión iniciada!";
                
                setTimeout(() => {
                    mostrar('seccion-movimientos');
                    cargarTransacciones();
                }, 1000);
            } else {
                mensaje.style.color = "red";
                mensaje.innerText = data.error;
            }
        } catch (err) { console.error(err); }
    });

    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: document.getElementById('reg-nombre').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value
            })
        });
        if (res.ok) { 
            mostrar('seccion-login'); 
            mensaje.innerText = "¡Registrado! Ya puedes entrar."; 
        }
    });

    document.getElementById('transaccionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        const res = await fetch('http://localhost:3000/transacciones', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                usuario_id: localStorage.getItem('usuarioId'),
                concepto: document.getElementById('concepto').value,
                monto: document.getElementById('monto').value,
                tipo: document.getElementById('tipo').value,
                categoria: document.getElementById('categoria').value
            })
        });
        if (res.ok) {
            document.getElementById('transaccionForm').reset();
            cargarTransacciones();
        }
    });

    window.borrarMovimiento = async (id) => {
        if (!confirm("¿Deseas eliminar este registro?")) return;
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`http://localhost:3000/transacciones/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (res.ok) {
                cargarTransacciones(); 
            } else {
                const data = await res.json();
                alert("Error: " + data.error);
            }
        } catch (error) { console.error("Error en borrar:", error); }
    };
});