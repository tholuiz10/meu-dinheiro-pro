function mesesPage() {
    return `
        <div class="card">
            <h2>Meses</h2>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px;">
                ${gerarBotoesMeses()}
            </div>
        </div>

        <div id="detalheMes"></div>
    `;
}

function gerarBotoesMeses() {
    const nomes = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];

    return nomes.map((nome, index) => `
        <button onclick="abrirMes(${index})">
            ${nome}
        </button>
    `).join("");
}
function abrirMes(mesIndex) {

    const compras = JSON.parse(localStorage.getItem("comprasCartao")) || [];
    const fixas = JSON.parse(localStorage.getItem("fixas")) || [];

    const anoAtual = new Date().getFullYear();

    let html = `<div class="card"><h3>Detalhamento</h3>`;
    let total = 0;

    html += `<h4>Compras Cartão</h4>`;

    compras.forEach(c => {
        const data = new Date(c.data);

        if(data.getMonth() === mesIndex && data.getFullYear() === anoAtual) {
            total += c.valorParcela;
            html += `
                <p>${c.descricao || "Compra"} - R$ ${c.valorParcela.toFixed(2)}</p>
            `;
        }
    });

    html += `<h4>Despesas Fixas</h4>`;

    fixas.forEach(f => {
        if(f.ativa) {
            total += f.valor;
            html += `
                <p>${f.nome} - R$ ${f.valor.toFixed(2)}</p>
            `;
        }
    });

    html += `<hr>
        <h3>Total do Mês: R$ ${total.toFixed(2)}</h3>
    </div>`;

    document.getElementById("detalheMes").innerHTML = html;
}
