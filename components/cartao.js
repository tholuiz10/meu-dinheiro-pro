function cartaoPage() {
  setTimeout(() => {
    renderCadastroCartao();
    renderCartoes();
  }, 100);

  return `
    <div class="page-header-hero">
      <div class="hero-title">💳 <span>Gastos por</span> Cartão de Crédito</div>
      <div class="hero-sub">Gerencie seus cartões, limites, fechamento e compras parceladas.</div>
    </div>

    <div class="card">
      <h2>Novo Cartão</h2>
      <div class="form-grid">
        <input id="nomeNovoCartao" placeholder="Nome do banco (Ex: Nubank, Itaú, C6)">
        <input id="limiteNovoCartao" type="number" placeholder="Limite do cartão">
        <input id="fechamentoNovoCartao" type="number" placeholder="Dia de fechamento (1-31)">
        <input id="vencimentoNovoCartao" type="number" placeholder="Dia de vencimento (1-31)">
      </div>
      <button onclick="salvarCartao()">Salvar Cartão</button>
    </div>

    <div class="card">
      <h2>Nova Compra</h2>
      <div class="form-grid">
        <input id="descricaoCompra" placeholder="Descrição">
        <input id="valorCompra" type="number" placeholder="Valor Total">
        <input id="parcelasCompra" type="number" placeholder="Parcelas" value="1">
        <input id="dataCompra" type="date">
        <select id="cartaoCompra"></select>
      </div>

      <button onclick="salvarCompra()">Salvar Compra</button>
    </div>

    <div class="card">
      <h2>Seus Cartões</h2>
      <div id="listaCartoes" class="grid-cartoes-premium"></div>
    </div>

    <div id="detalheCartao"></div>
  `;
}

/* =========================
   HELPERS VISUAIS
========================= */

function bancoMeta(nome) {
  const n = (nome || "").toLowerCase();

  const metas = [
    { key: "nubank", match: ["nubank", "nu"], cor: "#6a00ff", logo: "nu" },
    { key: "itau", match: ["itaú", "itau"], cor: "#ff6a00", logo: "itaú" },
    { key: "santander", match: ["santander"], cor: "#d6001c", logo: "Santander" },
    { key: "bradesco", match: ["bradesco"], cor: "#cc0022", logo: "Bradesco" },
    { key: "c6", match: ["c6"], cor: "#111111", logo: "C6" },
    { key: "bb", match: ["banco do brasil", "bb"], cor: "#f3c200", logo: "BB" },
    { key: "caixa", match: ["caixa"], cor: "#0067c7", logo: "caixa" }
  ];

  for (const m of metas) {
    if (m.match.some(x => n.includes(x))) return m;
  }
  // fallback
  return { cor: "#2d2d2d", logo: (nome || "Cartão").slice(0, 2).toUpperCase() };
}

/* =========================
   CADASTRO SELECT
========================= */
function renderCadastroCartao() {
  const select = document.getElementById("cartaoCompra");
  const cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
  if (!select) return;

  select.innerHTML = "";

  cartoes.forEach(c => {
    select.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
  });

  if (cartoes.length === 0) {
    select.innerHTML = `<option value="">Cadastre um cartão primeiro</option>`;
  }
}

/* =========================
   COMPRAS (parcelas)
========================= */
function salvarCompra() {
  const descricao = document.getElementById("descricaoCompra").value;
  const valorTotal = parseFloat(document.getElementById("valorCompra").value);
  const parcelas = parseInt(document.getElementById("parcelasCompra").value);
  const data = document.getElementById("dataCompra").value;
  const cartao = document.getElementById("cartaoCompra").value;

  if (!descricao || !valorTotal || !parcelas || !data || !cartao) {
    alert("Preencha todos os campos da compra!");
    return;
  }

  const valorParcela = valorTotal / parcelas;
  const compras = JSON.parse(localStorage.getItem("comprasCartao")) || [];

  for (let i = 0; i < parcelas; i++) {
    const dataParcela = new Date(data);
    dataParcela.setMonth(dataParcela.getMonth() + i);

    compras.push({
      descricao,
      valorParcela,
      data: dataParcela.toISOString(),
      cartao
    });
  }

  localStorage.setItem("comprasCartao", JSON.stringify(compras));

  alert("Compra salva!");
  renderCartoes();
}

/* =========================
   LISTAGEM PREMIUM
========================= */
function renderCartoes() {
  const compras = JSON.parse(localStorage.getItem("comprasCartao")) || [];
  const cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
  const container = document.getElementById("listaCartoes");
  if (!container) return;

  container.innerHTML = "";

  if (cartoes.length === 0) {
    container.innerHTML = `<div style="opacity:.7">Nenhum cartão cadastrado ainda.</div>`;
    return;
  }

  cartoes.forEach(cartao => {
    let totalUsado = 0;

    compras.forEach(c => {
      if (c.cartao === cartao.nome) totalUsado += Number(c.valorParcela) || 0;
    });

    const percentual = cartao.limite > 0 ? (totalUsado / cartao.limite) * 100 : 0;
    const meta = bancoMeta(cartao.nome);

    container.innerHTML += `
      <div class="cc-card-wrap" onclick="abrirCartao('${escapeHtml(cartao.nome)}')">
        
        <div class="cc-card-top" style="background:${meta.cor}">
          <button class="cc-trash" onclick="event.stopPropagation(); excluirCartao('${escapeHtml(cartao.nome)}')">🗑</button>
          <div class="cc-logo">${meta.logo}</div>
          <div class="cc-nome">${escapeHtml(cartao.nome)}</div>
        </div>

        <div class="cc-card-bottom">
          <div class="cc-row">
            <div class="cc-title">${escapeHtml(cartao.nome)}</div>
            <div class="cc-sub">Limite: <strong>R$ ${Number(cartao.limite).toFixed(2)}</strong></div>
          </div>

          <div class="cc-sub" style="margin-top:10px;">
            Usado: <strong>R$ ${totalUsado.toFixed(2)}</strong>
          </div>

          <div class="cc-progress">
            <div class="cc-progress-fill" style="width:${Math.min(100, percentual)}%;"></div>
          </div>

          <div class="cc-pills">
            <div class="cc-pill">📅 Fechamento: <strong>${cartao.fechamento}</strong></div>
            <div class="cc-pill">🧾 Vencimento: <strong>${cartao.vencimento}</strong></div>
          </div>
        </div>
      </div>
    `;
  });

  renderCadastroCartao();
}

/* =========================
   EXCLUIR CARTÃO
========================= */
function excluirCartao(nome) {
  if (!confirm(`Excluir o cartão "${nome}"? (as compras permanecerão no histórico)`)) return;

  const cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
  const novos = cartoes.filter(c => c.nome !== nome);
  localStorage.setItem("cartoes", JSON.stringify(novos));

  renderCadastroCartao();
  renderCartoes();
}

/* =========================
   SALVAR CARTÃO
========================= */
function salvarCartao() {
  const nome = document.getElementById("nomeNovoCartao").value;
  const limite = parseFloat(document.getElementById("limiteNovoCartao").value);
  const fechamento = parseInt(document.getElementById("fechamentoNovoCartao").value);
  const vencimento = parseInt(document.getElementById("vencimentoNovoCartao").value);

  if (!nome || !limite || !fechamento || !vencimento) {
    alert("Preencha todos os campos!");
    return;
  }

  const cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];
  cartoes.push({ nome, limite, fechamento, vencimento });

  localStorage.setItem("cartoes", JSON.stringify(cartoes));

  alert("Cartão salvo com sucesso!");

  document.getElementById("nomeNovoCartao").value = "";
  document.getElementById("limiteNovoCartao").value = "";
  document.getElementById("fechamentoNovoCartao").value = "";
  document.getElementById("vencimentoNovoCartao").value = "";

  renderCadastroCartao();
  renderCartoes();
}

/* =========================
   DETALHE (placeholder)
   você já tem/terá abrirCartao
========================= */
function abrirCartao(nomeCartao) {
  const container = document.getElementById("detalheCartao");
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <h2>Detalhes: ${escapeHtml(nomeCartao)}</h2>
      <p style="opacity:.75">Próximo passo: lista de compras desse cartão + gráfico por categoria.</p>
    </div>
  `;
}

/* =========================
   UTIL
========================= */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
