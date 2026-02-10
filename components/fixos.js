function fixosPage() {
  setTimeout(() => {
    preencherSelectCategoriasFixos();
    renderFixos();
    gerarGraficoFixos();
  }, 100);

  return `
    <div class="card">
      <h2>Novo / Editar Custo Fixo</h2>

      <input type="hidden" id="editIndex">

      <input id="descricaoFixo" placeholder="Descrição">

      <!-- SELECT AGORA É 100% DINÂMICO (vem da aba Categorias) -->
      <select id="categoriaFixo"></select>

      <input id="valorFixo" type="number" placeholder="Valor">

      <button onclick="salvarFixo()">Salvar</button>
    </div>

    <div class="card">
      <h2>Seus Custos Fixos</h2>

      <table class="tabela-fixos">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="listaFixos"></tbody>
      </table>

      <h3 id="totalFixos"></h3>
    </div>

    <div class="card">
      <h2>Gráfico por Categoria</h2>
      <canvas id="graficoFixos"></canvas>
    </div>
  `;
}

/* =========================
   CATEGORIAS (FONTE ÚNICA)
========================= */

function getCategoriasSistema() {
  return JSON.parse(localStorage.getItem("categorias")) || [];
}

function preencherSelectCategoriasFixos() {
  const select = document.getElementById("categoriaFixo");
  if (!select) return;

  let categorias = getCategoriasSistema();

  // se ainda não tiver categoria salva, cria padrão (se o seed existir)
  if (categorias.length === 0 && typeof seedCategoriasPadrao === "function") {
    seedCategoriasPadrao();
    categorias = getCategoriasSistema();
  }

  // Se ainda assim estiver vazio (caso seed não exista), evita quebrar a UI
  if (categorias.length === 0) {
    select.innerHTML = `<option value="">Crie categorias primeiro</option>`;
    return;
  }

  select.innerHTML = categorias
    .map(c => `<option value="${c.nome}">${c.icone || "🏷️"} ${c.nome}</option>`)
    .join("");
}

function corDaCategoria(nomeCategoria) {
  const categorias = getCategoriasSistema();
  const c = categorias.find(x => x.nome === nomeCategoria);
  return c?.cor || "#777";
}

function iconeDaCategoria(nomeCategoria) {
  const categorias = getCategoriasSistema();
  const c = categorias.find(x => x.nome === nomeCategoria);
  return c?.icone || "🏷️";
}

/* =========================
   CRUD FIXOS
========================= */

function salvarFixo() {
  const descricao = document.getElementById("descricaoFixo").value;
  const categoria = document.getElementById("categoriaFixo").value;
  const valor = parseFloat(document.getElementById("valorFixo").value);
  const editIndex = document.getElementById("editIndex").value;

  if (!descricao || !categoria || !valor) {
    alert("Preencha todos os campos!");
    return;
  }

  let fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];

  if (editIndex !== "") {
    fixos[parseInt(editIndex)] = { descricao, categoria, valor };
  } else {
    fixos.push({ descricao, categoria, valor });
  }

  localStorage.setItem("custosFixos", JSON.stringify(fixos));

  limparFormulario();
  renderFixos();
  gerarGraficoFixos();
}

function renderFixos() {
  const fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];
  const tbody = document.getElementById("listaFixos");
  const totalEl = document.getElementById("totalFixos");
  if (!tbody) return;

  tbody.innerHTML = "";
  let total = 0;

  fixos.forEach((f, index) => {
    total += Number(f.valor) || 0;

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(f.descricao)}</td>
        <td>
          <span style="
            padding:6px 10px;
            border-radius:999px;
            background:${corDaCategoria(f.categoria)};
            color:white;
            font-size:12px;
            font-weight:900;">
            ${iconeDaCategoria(f.categoria)} ${escapeHtml(f.categoria)}
          </span>
        </td>
        <td><strong>R$ ${Number(f.valor).toFixed(2)}</strong></td>
        <td>
          <button class="btn-ghost" onclick="editarFixo(${index})">✏️</button>
          <button class="btn-ghost" onclick="excluirFixo(${index})">🗑️</button>
        </td>
      </tr>
    `;
  });

  totalEl.innerHTML = "Total mensal: R$ " + total.toFixed(2);
}

function editarFixo(index) {
  const fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];
  const item = fixos[index];
  if (!item) return;

  // garante que select já está com as categorias
  preencherSelectCategoriasFixos();

  document.getElementById("descricaoFixo").value = item.descricao;
  document.getElementById("categoriaFixo").value = item.categoria;
  document.getElementById("valorFixo").value = item.valor;
  document.getElementById("editIndex").value = index;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirFixo(index) {
  const fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];
  if (!confirm("Deseja excluir este item?")) return;

  fixos.splice(index, 1);
  localStorage.setItem("custosFixos", JSON.stringify(fixos));

  renderFixos();
  gerarGraficoFixos();
}

function limparFormulario() {
  document.getElementById("descricaoFixo").value = "";
  document.getElementById("valorFixo").value = "";
  document.getElementById("editIndex").value = "";
}

/* =========================
   GRÁFICO (com cores do sistema)
========================= */

function gerarGraficoFixos() {
  const fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];

  const somaPorCategoria = {};
  fixos.forEach(f => {
    if (!somaPorCategoria[f.categoria]) somaPorCategoria[f.categoria] = 0;
    somaPorCategoria[f.categoria] += Number(f.valor) || 0;
  });

  const labels = Object.keys(somaPorCategoria);
  const values = Object.values(somaPorCategoria);
  const cores = labels.map(cat => corDaCategoria(cat));

  const ctx = document.getElementById("graficoFixos");
  if (!ctx) return;

  if (window.graficoFixosAtual) window.graficoFixosAtual.destroy();

  window.graficoFixosAtual = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: cores }]
    },
    options: { responsive: true }
  });
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
