document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    const vistaCliente = document.getElementById("vista-cliente");
    const vistaAgencia = document.getElementById("vista-agencia");

    if (usuario && usuario.rol === "AGENCIA") {
        document.getElementById("titulo-panel").innerText = "Panel de Rendimiento Operativo";
        document.getElementById("subtitulo-panel").innerText = "Métricas consolidadas de ventas, solicitudes y gestión de calidad.";
        vistaAgencia.classList.remove("d-none");
        await cargarAnaliticaAgencia(token);
    } else {
        vistaCliente.classList.remove("d-none");
        await cargarAnaliticaCliente();
    }

    inicializarScrollStorytelling();
});

function inicializarScrollStorytelling() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll(".story-section").forEach(sec => observer.observe(sec));
}

async function cargarAnaliticaCliente() {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/analitica/cliente");
        const data = await res.json();

        document.getElementById("kpi-top-nacional").innerText = data.recomendado_nacional;
        document.getElementById("kpi-top-internacional").innerText = data.recomendado_internacional;

        const animacionAvanzada = {
            duration: 1800,
            easing: 'easeInOutQuart'
        };

        if (document.getElementById("chartTopNacionales") && data.top_nacionales) {
            new Chart(document.getElementById("chartTopNacionales"), {
                type: 'line',
                data: {
                    labels: data.top_nacionales.map(n => n.destino),
                    datasets: [{
                        label: 'Volumen de Viajeros',
                        data: data.top_nacionales.map(n => n.reservas_acumuladas),
                        borderColor: '#ff3838',
                        backgroundColor: 'rgba(255, 56, 56, 0.18)',
                        fill: true,
                        tension: 0.45,
                        pointRadius: 6,
                        pointBackgroundColor: '#ff3838',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: animacionAvanzada,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }
                    }
                }
            });
        }

        if (document.getElementById("chartTopInternacionales") && data.top_internacionales) {
            new Chart(document.getElementById("chartTopInternacionales"), {
                type: 'bar',
                data: {
                    labels: data.top_internacionales.map(i => i.destino),
                    datasets: [{
                        label: 'Preferencias Internacionales',
                        data: data.top_internacionales.map(i => i.reservas_acumuladas),
                        backgroundColor: '#1e90ff',
                        borderColor: '#1e90ff',
                        borderWidth: 3,
                        barThickness: 6,
                        borderRadius: 3,
                        pointStyle: 'circle'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: animacionAvanzada,
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.raw.toLocaleString('es-CO')} viajeros`
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }
                    }
                },
                plugins: [{
                    id: 'lollipopPoints',
                    afterDatasetsDraw(chart) {
                        const { ctx } = chart;
                        const meta = chart.getDatasetMeta(0);
                        meta.data.forEach((bar) => {
                            const { x, y } = bar;
                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(x, y, 9, 0, 2 * Math.PI);
                            ctx.fillStyle = '#1e90ff';
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 3;
                            ctx.fill();
                            ctx.stroke();
                            ctx.restore();
                        });
                    }
                }]
            });
        }

        if (document.getElementById("chartExperiencias") && data.experiencias_top) {
            new Chart(document.getElementById("chartExperiencias"), {
                type: 'polarArea',
                data: {
                    labels: data.experiencias_top.map(e => e.categoria),
                    datasets: [{
                        data: data.experiencias_top.map(e => e.total_reservas),
                        backgroundColor: [
                            'rgba(46, 213, 115, 0.85)',
                            'rgba(255, 165, 2, 0.85)',
                            'rgba(255, 71, 87, 0.85)',
                            'rgba(112, 161, 255, 0.85)',
                            'rgba(83, 82, 237, 0.85)'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: animacionAvanzada,
                    plugins: {
                        legend: { position: 'right', labels: { boxWidth: 14, font: { size: 12 } } }
                    },
                    scales: {
                        r: { ticks: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' } }
                    }
                }
            });
        }

    } catch (err) {
        console.error("Error al cargar analítica de cliente:", err);
    }
}

async function cargarAnaliticaAgencia(token) {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/analitica/agencia", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        document.getElementById("metric-total-reservas").innerText = data.resumen.total_reservas || 0;
        document.getElementById("metric-ingresos").innerText = `$${Number(data.resumen.ingresos_totales || 0).toLocaleString('es-CO')}`;
        document.getElementById("metric-pqrs-resueltas").innerText = `${data.resumen.pqrs_resueltas || 0} / ${data.resumen.total_pqrs || 0}`;

        if (document.getElementById("chartAgenciaIngresos") && data.historico_ingresos) {
            new Chart(document.getElementById("chartAgenciaIngresos"), {
                type: 'bar',
                data: {
                    labels: data.historico_ingresos.map(h => `Año ${h.anio_label}`),
                    datasets: [{
                        label: 'Ingresos Totales ($)',
                        data: data.historico_ingresos.map(h => Number(h.ingresos_anuales)),
                        backgroundColor: '#2ed573',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            ticks: { callback: (value) => `$${(value / 1000000).toLocaleString('es-CO')}M` }
                        }
                    }
                }
            });
        }

        const contCasos = document.getElementById("contenedor-casos-recientes");
        if (!data.casos_recientes || data.casos_recientes.length === 0) {
            contCasos.innerHTML = `<p class="text-muted small">No hay solicitudes recientes registradas.</p>`;
            return;
        }

        contCasos.innerHTML = data.casos_recientes.map(c => `
            <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                <div>
                    <span class="fw-bold text-dark">${c.codigo_radicado}</span> - <span class="small text-muted">${c.cliente_nombre}</span>
                    <p class="small text-muted mb-0">${c.descripcion}</p>
                </div>
                <span class="badge ${c.estado === 'RESUELTO' ? 'bg-success' : 'bg-warning text-dark'}">${c.estado}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error al cargar analítica de agencia:", err);
    }
}