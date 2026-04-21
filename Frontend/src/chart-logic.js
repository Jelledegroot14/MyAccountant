const COLORES_CATEGORIAS = {
    Vivienda: '#4361ee',
    Comida: '#4cc9f0',
    Ocio: '#f72585',
    Otros: '#4895ef'
};

const ICONOS_CATEGORIAS = {
    Vivienda: 'fa-solid fa-house',
    Comida: 'fa-solid fa-utensils',
    Ocio: 'fa-solid fa-gamepad',
    Otros: 'fa-solid fa-ellipsis'
};

let miGrafico = null; 

export const inicializarGrafico = (datosTransacciones) => {
    const ctx = document.getElementById('chartGastos');
    if (!ctx) return;

    const gastosPorCategoria = datosTransacciones
        .filter(t => t.tipo === 'gasto')
        .reduce((acumulador, t) => {
            let cat = t.categoria || 'Otros';
            if (cat === 'Alimentación') cat = 'Comida'; 
            
            const monto = parseFloat(t.monto) || 0;
            acumulador[cat] = (acumulador[cat] || 0) + monto;
            return acumulador;
        }, {});

    const labels = Object.keys(gastosPorCategoria);
    const dataValues = Object.values(gastosPorCategoria);
    const backgroundColors = labels.map(label => COLORES_CATEGORIAS[label] || '#ccc');

    if (miGrafico) {
        miGrafico.destroy();
    }

    miGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw.toFixed(2)}€`
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });


    crearLeyendaPersonalizada(gastosPorCategoria);
};

const crearLeyendaPersonalizada = (gastosPorCategoria) => {
    const container = document.querySelector('.chart-card');
    if (!container) return;


    let leyendaHTML = '<div class="custom-legend">';

    Object.entries(gastosPorCategoria).forEach(([cat, monto]) => {
        const color = COLORES_CATEGORIAS[cat] || '#ccc';
        const iconoClase = ICONOS_CATEGORIAS[cat] || 'fa-solid fa-question';
        
        leyendaHTML += `
            <div class="legend-item">
                <span class="legend-icon" style="color: ${color}">
                    <i class="${iconoClase}"></i>
                </span>
                <span class="legend-label">${cat}</span>
                <span class="legend-value">${monto.toFixed(2)}€</span>
            </div>
        `;
    });
    leyendaHTML += '</div>';

    const leyendaAntigua = container.querySelector('.custom-legend');
    if (leyendaAntigua) leyendaAntigua.remove();
    container.insertAdjacentHTML('beforeend', leyendaHTML);
};