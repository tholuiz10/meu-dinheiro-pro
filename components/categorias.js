function categoriasPage() {
  setTimeout(() => {
    seedCategoriasPadrao();
    renderCategoriasUI();
    renderCategoriasLista();
    renderTransacoesCategoria();
  }, 50);

  return `
    <div class="page-header-hero">
      <div class="hero-title">🏷️ <span>Categorias</span></div>
      <div class="hero-sub">Crie categorias, defina cores e limite de gastos por mês.</div>
    </div>

    <div class="dash-grid" style="grid-template-columns: 1fr 1fr;">
      <div class="card">
        <h3>Adicionar / Editar Categoria</h3>

        <input id="catNome" placeholder="Nome (ex: Pets)">
        <div class="cat-row">
          <div>
            <div class="cat-label">Ícone</div>
            <div id="catIcones" class="cat-icons"></div>
          </div>
        </div>

        <div class="cat-row">
          <div>
            <div class="cat-label">Cor</div>
            <div id="catCores" class="cat-colors"></div>
          </div>
        </div>

        <div class="cat-row">
          <label class="switch">
            <input type="checkbox" id="catTemLimite">
            <span class="slider"></span>
          </label>
          <span style="font-weight:800; opacity:.8">Adicionar limite mensal</span>
        </div>

        <input id="catLimite" type="number" placeholder="Limite mensal (R$)" style="display:none">

        <input type="hidden" id="catIconeSelecionado">
        <input type="hidden" id="catCorSelecionada">
        <input type="hidden" id="catEditId">

        <button onclick="salvarCategoria()">Salvar Categoria</button>
      </div>

      <div class="card">
        <h3>Suas categorias</h3>
        <div id="listaCategorias" class="cat-list"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Transações (Fixos) por categoria — mês atual</h3>
        <select id="catSelectTransacoes" class="select-pill"></select>
      </div>

      <div id="catResumoLimite" style="margin-top:10px;"></div>

      <div id="catTransacoesLista" class="transacoes-list" style="margin-top:12px;"></div>
    </div>
  `;
}

/* ==========================
   STORAGE
========================== */
function getCategorias() {
  return JSON.parse(localStorage.getItem("categorias")) || [];
}
function setCategorias(arr) {
  localStorage.setItem("categorias", JSON.stringify(arr));
}

/* ==========================
   PADRÃO (as suas atuais)
========================== */
function seedCategoriasPadrao() {
  const categorias = getCategorias();
  if (categorias.length > 0) return;

  const padrao = [
    { nome:"Educação", icone:"📚", cor:"#4CAF50", limite:0 },
    { nome:"Alimentação", icone:"🍽️", cor:"#FF9800", limite:0 },
    { nome:"Livro", icone:"📖", cor:"#9C27B0", limite:0 },
    { nome:"Luz", icone:"💡", cor:"#FFC107", limite:0 },
    { nome:"Água", icone:"💧", cor:"#2196F3", limite:0 },
    { nome:"Uber", icone:"🚗", cor:"#111111", limite:0 },
    { nome:"Gasolina", icone:"⛽", cor:"#795548", limite:0 },
    { nome:"Filho", icone:"👶", cor:"#E91E63", limite:0 },
    { nome:"Escola", icone:"🏫", cor:"#3F51B5", limite:0 },
    { nome:"Higiene", icone:"🧼", cor:"#00BCD4", limite:0 },
    { nome:"Passeio", icone:"🌿", cor:"#8BC34A", limite:0 },
    { nome:"Restaurante", icone:"🍔", cor:"#F44336", limite:0 },
    { nome:"Lazer", icone:"🎮", cor:"#673AB7", limite:0 }
  ];

  // id interno
  padrao.forEach(c => c.id = cryptoId());
  setCategorias(padrao);
}

/* ==========================
   UI (ícones / cores)
========================== */
function renderCategoriasUI() {
  const icones = ["🏠","📚","🍽️","🛒","🚗","⛽","👶","🏫","🧼","🌿","🍔","🎮","🐾","💊","🏋️","🎁","📱","🌎","🎧","✈️","🧾","💳","🏥","🧠","⭐","➕"];
  const cores = ["#FF69B4","#FFD699","#FFFACD","#CDEB9A","#6FA8FF","#C77DFF","#FF3D71","#FF9F1C","#2EC4B6","#00C853","#1D4ED8","#9333EA"];

  const wrapIcones = document.getElementById("catIcones");
  const wrapCores = document.getElementById("catCores");
  const chkLimite = document.getElementById("catTemLimite");
  const inputLimite = document.getElementById("catLimite");

  if (wrapIcones) {
    wrapIcones.innerHTML = icones.map(i => `
      <button type="button" class="icon-pick" onclick="pickIcone('${i}')">${i}</button>
    `).join("");
  }

  if (wrapCores) {
    wrapCores.innerHTML = cores.map(c => `
      <button type="button" class="color-pick" style="background:${c}" onclick="pickCor('${c}')"></button>
    `).join("");
  }

  if (chkLimite && inputLimite) {
    chkLimite.onchange = () => {
      inputLimite.style.display = chkLimite.checked ? "block" : "none";
      if (!chkLimite.checked) inputLimite.value = "";
    };
  }

  // defaults
  pickIcone("🏠");
  pickCor("#6FA8FF");
}

function pickIcone(icone) {
  const hidden = document.getElementById("catIconeSelecionado");
  if (hidden) hidden.value = icone;

  document.querySelectorAll(".icon-pick").forEach(b => b.classList.remove("active"));
  const btn = [...document.querySelectorAll(".icon-pick")].find(b => b.textContent.trim() === icone);
  if (btn) btn.classList.add("active");
}

function pickCor(cor) {
  const hidden = document.getElementById("catCorSelecionada");
  if (hidden) hidden.value = cor;

  document.querySelectorAll(".color-pick").forEach(b => b.classList.remove("active"));
  const btn = [...document.querySelectorAll(".color-pick")].find(b => b.style.background.includes("rgb") || true);
  // marca pelo atributo data? (simples: marca a última clicada)
  const picks = document.querySelectorAll(".color-pick");
  picks.forEach(p => {
    if (p.getAttribute("data-color") === cor) p.classList.add("active");
  });
}

/* ==========================
   CRUD
========================== */
function salvarCategoria() {
  const nome = (document.getElementById("catNome")?.value || "").trim();
  const icone = document.getElementById("catIconeSelecionado")?.value || "🏷️";
  const cor = document.getElementById("catCorSelecionada")?.value || "#6FA8FF";
  const temLimite = document.getElementById("catTemLimite")?.checked || false;
  const limite = temLimite ? Number(document.getElementById("catLimite")?.value || 0) : 0;
  const editId = document.getElementById("catEditId")?.value || "";

  if (!nome) {
    alert("Informe o nome da categoria!");
    return;
  }

  const categorias = getCategorias();

  // evita duplicado por nome
  const jaExiste = categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== editId);
  if (jaExiste) {
    alert("Já existe uma categoria com esse nome.");
    return;
  }

  if (editId) {
    const idx = categorias.findIndex(c => c.id === editId);
    if (idx >= 0) {
      categorias[idx] = { ...categorias[idx], nome, icone, cor, limite };
    }
  } else {
    categorias.push({ id: cryptoId(), nome, icone, cor, limite });
  }

  setCategorias(categorias);

  limparFormCategoria();
  renderCategoriasLista();
  renderTransacoesCategoria();
}

function editarCategoria(id) {
  const categorias = getCategorias();
  const c = categorias.find(x => x.id === id);
  if (!c) return;

  document.getElementById("catNome").value = c.nome;
  document.getElementById("catEditId").value = c.id;

  pickIcone(c.icone);
  document.getElementById("catIconeSelecionado").value = c.icone;

  document.getElementById("catCorSelecionada").value = c.cor;

  const chk = document.getElementById("catTemLimite");
  const lim = document.getElementById("catLimite");

  if (c.limite && c.limite > 0) {
    chk.checked = true;
    lim.style.display = "block";
    lim.value = c.limite;
  } else {
    chk.checked = false;
    lim.style.display = "none";
    lim.value = "";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirCategoria(id) {
  if (!confirm("Excluir categoria?")) return;
  const categorias = getCategorias().filter(c => c.id !== id);
  setCategorias(categorias);
  renderCategoriasLista();
  renderTransacoesCategoria();
}

function limparFormCategoria() {
  document.getElementById("catNome").value = "";
  document.getElementById("catEditId").value = "";
  document.getElementById("catTemLimite").checked = false;
  const lim = document.getElementById("catLimite");
  lim.style.display = "none";
  lim.value = "";
}

/* ==========================
   LISTA DE CATEGORIAS
========================== */
function renderCategoriasLista() {
  const categorias = getCategorias();
  const container = document.getElementById("listaCategorias");
  const select = document.getElementById("catSelectTransacoes");

  if (container) {
    container.innerHTML = categorias.map(c => `
      <div class="cat-item">
        <div class="cat-pill" style="background:${c.cor}">
          <span>${c.icone}</span>
          <strong>${escapeHtml(c.nome)}</strong>
        </div>

        <div class="cat-actions">
          ${c.limite > 0 ? `<span class="cat-limit">Limite: R$ ${Number(c.limite).toFixed(2)}</span>` : `<span class="cat-limit" style="opacity:.5">Sem limite</span>`}
          <button class="btn-ghost" onclick="editarCategoria('${c.id}')">✏️</button>
          <button class="btn-ghost" onclick="excluirCategoria('${c.id}')">🗑</button>
        </div>
      </div>
    `).join("");
  }

  if (select) {
    select.innerHTML = categorias.map(c => `<option value="${c.nome}">${c.icone} ${c.nome}</option>`).join("");
    select.onchange = () => renderTransacoesCategoria();
  }
}

/* ==========================
   TRANSACOES (por enquanto: custosFixos)
========================== */
function renderTransacoesCategoria() {
  const categorias = getCategorias();
  const select = document.getElementById("catSelectTransacoes");
  const lista = document.getElementById("catTransacoesLista");
  const resumo = document.getElementById("catResumoLimite");
  if (!select || !lista || !resumo) return;

  const catNome = select.value;
  const cat = categorias.find(c => c.nome === catNome);

  // pega fixos do mês atual
  const fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];
  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();

  // (fixos atuais não tem data; vamos considerar todos como mês atual)
  const transacoes = fixos.filter(f => f.categoria === catNome);

  const total = transacoes.reduce((a, t) => a + (Number(t.valor) || 0), 0);
  const limite = Number(cat?.limite || 0);

  if (limite > 0) {
    const p = Math.min(100, (total / limite) * 100);
    resumo.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-weight:900">Limite mensal: R$ ${limite.toFixed(2)}</div>
          <div style="opacity:.75">Gasto atual: R$ ${total.toFixed(2)}</div>
        </div>
        <div style="font-weight:900; color:${total > limite ? 'red' : 'green'}">${p.toFixed(0)}%</div>
      </div>
      <div class="dash-bar" style="margin-top:10px;">
        <div class="dash-bar-fill" style="width:${p}%; background:${total > limite ? 'rgba(255,60,60,0.85)' : 'rgba(0,200,120,0.85)'}"></div>
      </div>
    `;
  } else {
    resumo.innerHTML = `<div style="opacity:.75">Esta categoria está sem limite. Total: <strong>R$ ${total.toFixed(2)}</strong></div>`;
  }

  if (transacoes.length === 0) {
    lista.innerHTML = `<div style="opacity:.7">Nenhuma transação em ${catNome} (fixos).</div>`;
    return;
  }

  lista.innerHTML = transacoes.map(t => `
    <div class="linha-detalhe">
      <div>
        <div style="font-weight:900">${escapeHtml(t.descricao)}</div>
        <div style="opacity:.65; font-size:12px">${escapeHtml(t.categoria)}</div>
      </div>
      <div style="font-weight:900">R$ ${Number(t.valor).toFixed(2)}</div>
    </div>
  `).join("");
}

/* ==========================
   UTIL
========================== */
function cryptoId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
