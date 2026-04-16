import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const mensaje = document.getElementById('mensaje');

    async function cargarTransacciones() {
        const uid = localStorage.getItem('usuarioId');
        if (!uid) return;
    
        try {
            const res = await fetch(`http://localhost:3000/transacciones/${uid}`);
            const transacciones = await res.json();
            
            const lista = document.getElementById('lista-transacciones');
            lista.innerHTML = '';
    
            let ingresos = 0;
            let gastos = 0;
    
            transacciones.forEach(t => {
                const valor = parseFloat(t.monto);
                if (t.tipo === 'ingreso') {
                    ingresos += valor;
                } else {
                    gastos += valor;
                }
    
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
        document.getElementById(id).style.display = 'block';
    };


    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const res = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('usuarioId', data.user.id);
            mensaje.innerText = "Bienvenido...";
            setTimeout(() => {
                mostrar('seccion-movimientos');
                cargarTransacciones();
            }, 1000);
        } else {
            mensaje.innerText = data.error;
        }
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
        if (res.ok) { mostrar('seccion-login'); mensaje.innerText = "¡Registrado!"; }
    });


    document.getElementById('transaccionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:3000/transacciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        console.log("Intentando borrar la transacción con ID:", id); 
        
        if (!confirm("¿Deseas eliminar este registro?")) return;
    
        try {
            const res = await fetch(`http://localhost:3000/transacciones/${id}`, {
                method: 'DELETE'
            });
    
            const data = await res.json();
            console.log("Respuesta del servidor:", data);
    
            if (res.ok) {
                cargarTransacciones(); 
            } else {
                alert("El servidor dice: " + data.error);
            }
        } catch (error) {
            console.error("Error en la petición FETCH:", error);
        }
    };
});