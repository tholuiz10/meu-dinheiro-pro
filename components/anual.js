function gastoAnualPage() {
    setTimeout(() => {
        gerarGraficoGastoAnual();
    }, 100);

    return `
        <div class="card">
            <h2>Gasto Anual</h2>
            <canvas id="graficoGastoAnual"></canvas>
        </div>
    `;
}

function gerarGraficoGastoAnual() {

    const compras = JSON.parse(localStorage.getItem("comprasCartao")) || [];

    const meses = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];

    const totais = new Array(12).fill(0);

    compras.forEach(c => {
        if (c.data) {
            const data = new Date(c.data);
            const mes = data.getMonth();
            totais[mes] += c.valorParcela;
        }
    });

    const ctx = document.getElementById("graficoGastoAnual");

    if (!ctx) return;

    if (window.graficoAnualAtual)
        window.graficoAnualAtual.destroy();

    window.graficoAnualAtual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Total por Mês',
                data: totais
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}
