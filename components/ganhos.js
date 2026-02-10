function ganhosPage() {
  setTimeout(() => {
    initGanhosUI();
    renderGanhos();
    renderGraficoGanhos();
  }, 50);

  return `
    <div class="page-header-hero">
      <div class="hero-title">💸 <span>Ganhos</span></div>
      <div class="hero-sub">Acompanhe suas entradas e filtre por mês.</div>
    </div>

    <div class="page-toolbar">
      <div class="tabs">
        <button class="tab" onclick="navigate('dashboard')">Gerais</button>
        <button class="tab tab-active">Ganhos</button>
        <button class="tab" onclick="navigate('fixos')">Fixas</button>
        <button class="tab" onclick="navigate('meses')">Variáveis</button>
        <button class="tab" onclick="navigate('dividas')">Dívidas</button>
        <button class="tab" onclick="navigate('metas')">Economias</button>
      </div>

      <div class="toolbar-right">
        <button class="btn-round" onclick="abrirModalGanho()">＋</button>
        <select id="mesRefGanhos" class="select-pill"></select>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Ganhos</h3>
        <button class="btn-ghost" onclick="toggleFiltroGanhos()">Filtrar por</button>
      </div>

      <div id="filtroGanhos" style="display:none; margin-top:10px;">
        <input id="filtroTextoGanhos" placeholder="Buscar por descrição ou pessoa..." oninput="renderGanhos(); renderGraficoGanhos();">
      </div>

      <div style="overflow:auto; margin-top:12px;">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Recebido em</th>
              <th>Valor</th>
              <th>Corresponde</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="listaGanhos"></tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Ganhos por pessoa (mês selecionado)</h3>
      <canvas id="graficoGanhosPessoas"></canvas>
    </div>

    <!-- Modal simples -->
    <div id="modalGanho" class="modal" style="display:none;">
      <div class="modal-box">
        <div class="modal-head">
          <h3>Novo ganho</h3>
          <button class="btn-ghost" onclick="fecharModalGanho()">✕</button>
        </div>

        <input id="ganhoDescricao" placeholder="Descrição (Ex: Salário, Extra)">
        <input id="ganhoValor" type="number" placeholder="Valor (R$)">
        <input id="ganhoData" type="date">
        <input id="ganhoPessoa" placeholder="Corresponde a (Ex: Thiago)">

        <button onclick="salvarGanho()">Salvar</button>
      </div>
    </div>
  `;
}

/* ===============================
   UI / ESTADO
================================ */
function initGanhosUI() {
  const select = document.getElementById("mesRefGanhos");
  if (!select) return;

  const ganhos = getGanhos();
  const opcoes = buildMonthOptions(ganhos);

  // tenta manter o mês selecionado
  const saved = localStorage.getItem("ganhos_mesref");
  const defaultKey = saved || monthKey(new Date());

  select.innerHTML = opcoes.map(o => `
    <option value="${o.key}" ${o.key === defaultKey ? "selected" : ""}>
      ${o.label}
    </option>
  `).join("");

  select.onchange = () => {
    localStorage.setItem("ganhos_mesref", select.value);
    renderGanhos();
    renderGraficoGanhos();
    // se dashboard existir, atualiza (KPI)
    if (typeof renderDashboard === "function") renderDashboard();
  };
}

function toggleFiltroGanhos() {
  const el = document.getElementById("filtroGanhos");
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

/* ===============================
   DADOS
================================ */
function getGanhos() {
  return JSON.parse(localStorage.getItem("ganhos")) || [];
}

function setGanhos(arr) {
  localStorage.setItem("ganhos", JSON.stringify(arr));
}

function getMesSelecionadoKey() {
  return localStorage.getItem("ganhos_mesref") || monthKey(new Date());
}

/* ===============================
   RENDER TABELA
================================ */
function renderGanhos() {
  const tbody = document.getElementById("listaGanhos");
  if (!tbody) return;

  const ganhos = getGanhos();
  const key = getMesSelecionadoKey();
  const filtroTxt = (document.getElementById("filtroTextoGanhos")?.value || "").toLowerCase().trim();

  const filtrados = ganhos
    .filter(g => monthKey(new Date(g.data)) === key)
    .filter(g => {
      if (!filtroTxt) return true;
      return (g.descricao || "").toLowerCase().includes(filtroTxt) ||
             (g.pessoa || "").toLowerCase().includes(filtroTxt);
    })
    .sort((a,b) => new Date(b.data) - new Date(a.data));

  tbody.innerHTML = "";

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="opacity:.7; padding:16px;">
          Nenhum ganho neste mês. Clique em <strong>＋</strong> para adicionar.
        </td>
      </tr>
    `;
    return;
  }

  filtrados.forEach((g, indexGlobal) => {
    // index real no array original (para excluir)
    const realIndex = ganhos.indexOf(g);

    tbody.innerHTML += `
      <tr>
        <td>💰 ${escapeHtml(g.descricao || "Ganho")}</td>
        <td>${formatarData(g.data)}</td>
        <td><strong>R$ ${Number(g.valor || 0).toFixed(2)}</strong></td>
        <td>${renderPessoaChip(g.pessoa)}</td>
        <td>
          <button class="btn-ghost" onclick="excluirGanho(${realIndex})">🗑</button>
        </td>
      </tr>
    `;
  });
}

/* ===============================
   MODAL + AÇÕES
================================ */
function abrirModalGanho() {
  const m = document.getElementById("modalGanho");
  if (!m) return;

  // preenche data com hoje (se vazio)
  const inputData = document.getElementById("ganhoData");
  if (inputData && !inputData.value) {
    const hoje = new Date();
    inputData.value = hoje.toISOString().slice(0,10);
  }

  m.style.display = "flex";
}

function fecharModalGanho() {
  const m = document.getElementById("modalGanho");
  if (!m) return;
  m.style.display = "none";
}

function salvarGanho() {
  const descricao = document.getElementById("ganhoDescricao")?.value || "";
  const valor = parseFloat(document.getElementById("ganhoValor")?.value || "0");
  const data = document.getElementById("ganhoData")?.value || new Date().toISOString();
  const pessoa = document.getElementById("ganhoPessoa")?.value || "";

  if (!descricao.trim() || !valor || valor <= 0) {
    alert("Preencha descrição e valor!");
    return;
  }

  const ganhos = getGanhos();
  ganhos.push({ descricao: descricao.trim(), valor, data, pessoa: pessoa.trim() });
  setGanhos(ganhos);

  // limpa inputs
  document.getElementById("ganhoDescricao").value = "";
  document.getElementById("ganhoValor").value = "";
  document.getElementById("ganhoPessoa").value = "";

  fecharModalGanho();
  initGanhosUI();        // pode ter criado novo mês
  renderGanhos();
  renderGraficoGanhos();

  // KPI da dashboard atualiza
  if (typeof renderDashboard === "function") renderDashboard();
}

function excluirGanho(index) {
  if (!confirm("Excluir este ganho?")) return;

  const ganhos = getGanhos();
  ganhos.splice(index, 1);
  setGanhos(ganhos);

  initGanhosUI();
  renderGanhos();
  renderGraficoGanhos();

  if (typeof renderDashboard === "function") renderDashboard();
}

/* ===============================
   GRÁFICO (Etapa 4 já ficando pronto)
================================ */
function renderGraficoGanhos() {
  const ctx = document.getElementById("graficoGanhosPessoas");
  if (!ctx) return;

  const ganhos = getGanhos();
  const key = getMesSelecionadoKey();
  const filtroTxt = (document.getElementById("filtroTextoGanhos")?.value || "").toLowerCase().trim();

  const filtrados = ganhos
    .filter(g => monthKey(new Date(g.data)) === key)
    .filter(g => {
      if (!filtroTxt) return true;
      return (g.descricao || "").toLowerCase().includes(filtroTxt) ||
             (g.pessoa || "").toLowerCase().includes(filtroTxt);
    });

  const porPessoa = {};
  filtrados.forEach(g => {
    const p = (g.pessoa || "Não informado").trim() || "Não informado";
    porPessoa[p] = (porPessoa[p] || 0) + (Number(g.valor) || 0);
  });

  const labels = Object.keys(porPessoa);
  const data = labels.map(l => porPessoa[l]);

  if (window.graficoGanhosPessoasAtual) window.graficoGanhosPessoasAtual.destroy();

  window.graficoGanhosPessoasAtual = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "R$", data }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

/* ===============================
   UTIL
================================ */
function buildMonthOptions(ganhos) {
  // inclui mês atual mesmo sem ganhos
  const keys = new Set([monthKey(new Date())]);

  ganhos.forEach(g => {
    if (!g.data) return;
    keys.add(monthKey(new Date(g.data)));
  });

  const arr = Array.from(keys).sort((a,b) => b.localeCompare(a)); // desc
  return arr.map(k => ({ key: k, label: monthLabelFromKey(k) }));
}

function monthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // ex: 2026-02
}

function monthLabelFromKey(key) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  const mes = date.toLocaleDateString("pt-BR", { month: "short" });
  // "set." -> "Set"
  const mesFmt = (mes.replace(".", "")).slice(0,1).toUpperCase() + (mes.replace(".", "")).slice(1);
  return `${mesFmt}/${String(y).slice(2)}`; // Set/26
}

function formatarData(data) {
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function renderPessoaChip(nome) {
  const n = (nome || "").trim();
  if (!n) return `<span style="opacity:.7">-</span>`;

  const iniciais = n.split(" ").slice(0,2).map(p => p[0]?.toUpperCase() || "").join("");
  return `
    <span class="person-chip">
      <span class="avatar">${iniciais || "?"}</span>
      <span>${escapeHtml(n)}</span>
    </span>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
