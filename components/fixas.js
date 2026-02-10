function fixasPage() {
    setTimeout(() => renderFixas(), 100);

    return `
        <div class="card">
            <h2>Nova Despesa Fixa</h2>

            <input id="nomeFixa" placeholder="Nome (Ex: Aluguel)">
            <input id="valorFixa" type="number" placeholder="Valor">
            <input id="diaFixa" type="number" placeholder="Dia do vencimento (1-31)">
            <button onclick="salvarFixa()">Salvar</button>
        </div>

        <div id="listaFixas"></div>
    `;
}
function salvarFixa() {
    const nome = document.getElementById("nomeFixa").value;
    const valor = parseFloat(document.getElementById("valorFixa").value);
    const dia = parseInt(document.getElementById("diaFixa").value);

    if(!nome || !valor || !dia) return;

    const fixas = JSON.parse(localStorage.getItem("fixas")) || [];

    fixas.push({
        id: Date.now(),
        nome,
        valor,
        dia,
        ativa: true
    });

    localStorage.setItem("fixas", JSON.stringify(fixas));
    renderFixas();
}
function renderFixas() {
    const fixas = JSON.parse(localStorage.getItem("fixas")) || [];
    const container = document.getElementById("listaFixas");

    container.innerHTML = "";

    fixas.forEach(f => {
        container.innerHTML += `
            <div class="card">
                <h3>${f.nome}</h3>
                <p>Valor: R$ ${f.valor.toFixed(2)}</p>
                <p>Vence dia: ${f.dia}</p>
                <button onclick="toggleFixa(${f.id})">
                    ${f.ativa ? "Desativar" : "Ativar"}
                </button>
            </div>
        `;
    });
}
function toggleFixa(id) {
    const fixas = JSON.parse(localStorage.getItem("fixas")) || [];

    const index = fixas.findIndex(f => f.id === id);
    fixas[index].ativa = !fixas[index].ativa;

    localStorage.setItem("fixas", JSON.stringify(fixas));
    renderFixas();
}
