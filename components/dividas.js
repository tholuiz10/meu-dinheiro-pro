function dividasPage() {
    setTimeout(() => renderDividas(), 100);

    return `
        <div class="card">
            <h2>Nova Dívida</h2>

            <input id="nomeDivida" placeholder="Nome da dívida (Ex: Empréstimo Nubank)">
            <input id="valorDivida" type="number" placeholder="Valor total">
            <input id="jurosDivida" type="number" placeholder="Juros mensal (%)">
            <input id="parcelasDivida" type="number" placeholder="Quantidade de parcelas">
            <button onclick="salvarDivida()">Salvar</button>
        </div>

        <div id="listaDividas"></div>
    `;
}
function salvarDivida() {
    const nome = document.getElementById("nomeDivida").value;
    const valor = parseFloat(document.getElementById("valorDivida").value);
    const juros = parseFloat(document.getElementById("jurosDivida").value) / 100;
    const parcelas = parseInt(document.getElementById("parcelasDivida").value);

    if(!nome || !valor || !parcelas) return;

    const parcelaMensal = (valor * (1 + juros * parcelas)) / parcelas;
    const totalComJuros = parcelaMensal * parcelas;

    const dividas = JSON.parse(localStorage.getItem("dividas")) || [];

    dividas.push({
        id: Date.now(),
        nome,
        valor,
        juros,
        parcelas,
        parcelaMensal,
        totalComJuros,
        parcelasPagas: 0
    });

    localStorage.setItem("dividas", JSON.stringify(dividas));

    renderDividas();
}
function renderDividas() {
    const dividas = JSON.parse(localStorage.getItem("dividas")) || [];
    const container = document.getElementById("listaDividas");

    container.innerHTML = "";

    dividas.forEach(d => {
        const saldoRestante = d.totalComJuros - (d.parcelaMensal * d.parcelasPagas);
        const progresso = (d.parcelasPagas / d.parcelas) * 100;

        container.innerHTML += `
            <div class="card">
                <h3>${d.nome}</h3>
                <p>Parcela: R$ ${d.parcelaMensal.toFixed(2)}</p>
                <p>Total com juros: R$ ${d.totalComJuros.toFixed(2)}</p>
                <p>Saldo restante: R$ ${saldoRestante.toFixed(2)}</p>
                <p>Parcelas pagas: ${d.parcelasPagas}/${d.parcelas}</p>

                <div style="background:#333; border-radius:8px; height:10px;">
                    <div style="
                        width:${progresso}%;
                        background:limegreen;
                        height:10px;
                        border-radius:8px;">
                    </div>
                </div>

                <button onclick="pagarParcela(${d.id})">Pagar Parcela</button>
            </div>
        `;
    });
}
function pagarParcela(id) {
    const dividas = JSON.parse(localStorage.getItem("dividas")) || [];

    const index = dividas.findIndex(d => d.id === id);

    if(dividas[index].parcelasPagas < dividas[index].parcelas) {
        dividas[index].parcelasPagas++;
    }

    localStorage.setItem("dividas", JSON.stringify(dividas));
    renderDividas();
}
