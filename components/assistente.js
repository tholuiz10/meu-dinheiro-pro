function assistentePage() {
  setTimeout(() => {
    renderAssistenteHistorico();
    renderAssistenteSugestoes();
  }, 50);

  return `
    <div class="page-header-hero">
      <div class="hero-title">🤖 <span>Assistente</span></div>
      <div class="hero-sub">Digite seus gastos do dia e eu coloco na categoria certa + verifico limites.</div>
    </div>

    <div class="card">
      <h3>Entrada rápida</h3>

      <div class="assist-row">
        <input id="assistInput" placeholder="Ex: gastei 32 no ifood / 120 mercado / 65 petshop"
               onkeydown="if(event.key==='Enter'){ assistenteEnviar(); }">
        <button onclick="assistenteEnviar()">Enviar</button>
      </div>

      <div class="assist-hint">
        Exemplos:
        <span class="assist-pill" onclick="assistSet('gastei 32 no ifood')">gastei 32 no ifood</span>
        <span class="assist-pill" onclick="assistSet('mercado 120')">mercado 120</span>
        <span class="assist-pill" onclick="assistSet('isso vai estourar alimentação se eu gastar 80?')">vai estourar?</span>
      </div>

      <div id="assistChat" class="assist-chat"></div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Transações registradas (mês atual)</h3>
        <button class="btn-ghost" onclick="assistenteLimparMes()">Limpar mês</button>
      </div>
      <div id="assistHistorico" class="assist-historico"></div>
    </div>
  `;
}

/* =========================
   STORAGE
========================= */

function getCategoriasSistema() {
  return JSON.parse(localStorage.getItem("categorias")) || [];
}

function getTransacoesAssistente() {
  return JSON.parse(localStorage.getItem("transacoesAssistente")) || [];
}

function setTransacoesAssistente(arr) {
  localStorage.setItem("transacoesAssistente", JSON.stringify(arr));
}

/* Regras aprendidas */
function getRegrasCategoria() {
  return JSON.parse(localStorage.getItem("regrasCategoria")) || [];
}

function setRegrasCategoria(arr) {
  localStorage.setItem("regrasCategoria", JSON.stringify(arr));
}

function aprenderRegra(palavra, categoria) {
  const p = (palavra || "").toLowerCase().trim();
  if (!p) return;

  const regras = getRegrasCategoria();
  const novo = regras.filter(r => (r.palavra || "").toLowerCase() !== p);
  novo.unshift({ palavra: p, categoria, criadoEm: new Date().toISOString() });

  setRegrasCategoria(novo.slice(0, 200));
}

function extrairPalavraChaveParaAprender(texto) {
  const t = (texto || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!t) return "";

  const stop = new Set(["gastei","com","no","na","em","de","da","do","pra","para","por","um","uma","r$","reais"]);
  const tokens = t.split(" ").filter(w => w.length >= 4 && !stop.has(w));

  tokens.sort((a,b) => b.length - a.length);
  return tokens[0] || "";
}

/* =========================
   UI helpers
========================= */

function assistSet(txt) {
  const el = document.getElementById("assistInput");
  if (!el) return;
  el.value = txt;
  el.focus();
}

function assistChatAdd(role, text) {
  const chat = document.getElementById("assistChat");
  if (!chat) return;

  const cls = role === "user" ? "msg user" : "msg bot";
  chat.innerHTML += `<div class="${cls}">${escapeHtml(text)}</div>`;
  chat.scrollTop = chat.scrollHeight;
}

/* =========================
   CLASSIFICAÇÃO (MELHORADA)
========================= */

function classificarCategoria(texto, categorias) {
  const t = (texto || "").toLowerCase();

  // 1) regras aprendidas (prioridade máxima)
  const regras = getRegrasCategoria();
  for (const r of regras) {
    const p = (r.palavra || "").toLowerCase();
    if (p && t.includes(p)) {
      const existe = categorias.find(c => (c.nome || "") === r.categoria);
      if (existe) return existe.nome;
    }
  }

  // 2) se digitou nome exato de categoria
  const hitExato = categorias.find(c => t.includes((c.nome || "").toLowerCase()));
  if (hitExato) return hitExato.nome;

  // 3) regras fixas (inclui beleza/depilação -> Higiene)
  const regrasFixas = [
    { cat: "Alimentação", keys: ["ifood","lanche","almoço","almoco","jantar","pizza","hamb","restaurante","padaria","mercado","supermerc","comida","açaí","acai","café","cafeteria"] },
    { cat: "Moradia", keys: ["aluguel","condominio","condomínio","iptu","luz","energia","água","agua","internet","telefone","gás","gas","moradia"] },
    { cat: "Pets", keys: ["pet","petshop","ração","racao","veterin","banho","tosa"] },
    { cat: "Uber", keys: ["uber","99","corrida","taxi","táxi"] },
    { cat: "Gasolina", keys: ["gasolina","etanol","combust","posto"] },
    { cat: "Filho", keys: ["fralda","leite","pediatra","escolinha","escola","berçário","bercario","bebe","bebê"] },
    { cat: "Higiene", keys: ["shampoo","sabonete","farmacia","farmácia","desodor","creme","higiene","depil","depila","unha","manicure","pedicure","salão","salao","cabelo","barbearia","estetica","estética","spa","massagem","cera"] },
    { cat: "Lazer", keys: ["cinema","netflix","spotify","show","viagem","bar","lazer","jogo","game"] }
  ];

  for (const r of regrasFixas) {
    if (r.keys.some(k => t.includes(k))) {
      const existe = categorias.find(c => (c.nome || "").toLowerCase() === r.cat.toLowerCase());
      if (existe) return existe.nome;
    }
  }

  // 4) fallback
  const outros = categorias.find(c => (c.nome || "").toLowerCase() === "outros");
  return outros ? outros.nome : categorias[0].nome;
}

/* =========================
   CORE
========================= */

function assistenteEnviar() {
  const input = document.getElementById("assistInput");
  if (!input) return;

  const msg = (input.value || "").trim();
  if (!msg) return;

  assistChatAdd("user", msg);
  input.value = "";

  // 1) pergunta de limite/estouro
  if (isPerguntaEstouro(msg)) {
    const resposta = responderEstouro(msg);
    assistChatAdd("bot", resposta);
    return;
  }

  // 2) registrar gasto
  const parsed = parseGasto(msg);

  if (!parsed.valor || parsed.valor <= 0) {
    assistChatAdd("bot", "Não consegui achar o valor. Tente: “mercado 120” ou “gastei R$ 32 no ifood”.");
    return;
  }

  const categorias = getCategoriasSistema();
  if (categorias.length === 0) {
    assistChatAdd("bot", "Você ainda não tem categorias. Crie na aba Categorias primeiro 🙂");
    return;
  }

  const categoria = classificarCategoria(parsed.texto || msg, categorias);

  const transacoes = getTransacoesAssistente();
  const tx = {
    id: cryptoId(),
    descricao: parsed.textoCurto,
    textoOriginal: msg,
    valor: parsed.valor,
    categoria,
    dataISO: new Date().toISOString(),
    origem: "assistente"
  };
  transacoes.push(tx);
  setTransacoesAssistente(transacoes);

  assistChatAdd("bot", `Registrei: R$ ${parsed.valor.toFixed(2)} em **${categoria}** ✅`);

  // botões de correção + aprendizado
  mostrarSugestaoCorrecaoCategoria(tx);

  // alerta limite
  const alerta = checarLimiteCategoria(categoria);
  if (alerta) assistChatAdd("bot", alerta);

  renderAssistenteHistorico();
  renderAssistenteSugestoes();

  if (typeof renderDashboard === "function") {
    try { renderDashboard(); } catch(e) {}
  }
}

/* =========================
   PARSE
========================= */

function parseGasto(msg) {
  const valor = extrairValor(msg);

  let texto = msg.replace(/r\$\s*/gi, "");
  texto = texto.replace(/\d{1,3}(\.\d{3})*(,\d{1,2})/g, "");
  texto = texto.replace(/\d+(\.\d+)?/g, "");
  texto = texto.replace(/\s+/g, " ").trim();

  const textoCurto = texto.length ? texto : "Gasto";
  return { valor, texto, textoCurto };
}

function extrairValor(msg) {
  const m = msg.match(/(\d{1,3}(\.\d{3})*(,\d{1,2})|\d+(,\d{1,2})?)/);
  if (!m) return 0;

  let s = m[0];
  s = s.replace(/\./g, "").replace(",", ".");
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

/* =========================
   LIMITES / ESTOURO
========================= */

function isPerguntaEstouro(msg) {
  const t = msg.toLowerCase();
  return t.includes("vai estourar") || t.includes("estoura") || t.includes("ultrapassa") ||
         t.includes("passa do limite") || t.includes("sobra") || t.includes("quanto falta");
}

function responderEstouro(msg) {
  const categorias = getCategoriasSistema();
  if (categorias.length === 0) return "Você ainda não tem categorias cadastradas.";

  const valor = extrairValor(msg);
  const t = msg.toLowerCase();

  let categoria = null;
  for (const c of categorias) {
    const nome = (c.nome || "").toLowerCase();
    if (nome && t.includes(nome)) { categoria = c.nome; break; }
  }
  if (!categoria) categoria = classificarCategoria(msg, categorias);

  const limite = Number(categorias.find(c => c.nome === categoria)?.limite || 0);
  if (!limite || limite <= 0) {
    return `A categoria **${categoria}** está sem limite definido. Defina em Categorias para eu simular certinho.`;
  }

  const gastoAtual = totalMesCategoria(categoria);

  if (!valor || valor <= 0) {
    const falta = Math.max(0, limite - gastoAtual);
    return `Em **${categoria}**, você já gastou R$ ${gastoAtual.toFixed(2)}. Limite: R$ ${limite.toFixed(2)}. Ainda sobra **R$ ${falta.toFixed(2)}**.`;
  }

  const novoTotal = gastoAtual + valor;
  if (novoTotal > limite) {
    return `⚠️ Sim — se você gastar R$ ${valor.toFixed(2)} em **${categoria}**, estoura em **R$ ${(novoTotal - limite).toFixed(2)}**.`;
  } else {
    return `✅ Não estoura. Se gastar R$ ${valor.toFixed(2)} em **${categoria}**, ainda sobra **R$ ${(limite - novoTotal).toFixed(2)}**.`;
  }
}

function checarLimiteCategoria(categoria) {
  const categorias = getCategoriasSistema();
  const cat = categorias.find(c => c.nome === categoria);
  const limite = Number(cat?.limite || 0);
  if (!limite || limite <= 0) return "";

  const total = totalMesCategoria(categoria);
  const p = (total / limite) * 100;

  if (total > limite) return `🚨 **${categoria}** estourou o limite! Total: R$ ${total.toFixed(2)} (limite R$ ${limite.toFixed(2)}).`;
  if (p >= 90) return `⚠️ Você está em **${p.toFixed(0)}%** do limite de **${categoria}**.`;
  if (p >= 75) return `👀 Você chegou em **${p.toFixed(0)}%** do limite de **${categoria}**.`;
  return "";
}

function totalMesCategoria(categoria) {
  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();

  const fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];
  const totalFixos = fixos
    .filter(f => f.categoria === categoria)
    .reduce((a, f) => a + (Number(f.valor) || 0), 0);

  const trans = getTransacoesAssistente();
  const totalTrans = trans
    .filter(t => t.categoria === categoria)
    .filter(t => {
      const d = new Date(t.dataISO);
      return d.getMonth() === mes && d.getFullYear() === ano;
    })
    .reduce((a, t) => a + (Number(t.valor) || 0), 0);

  return totalFixos + totalTrans;
}

/* =========================
   CORREÇÃO 1-CLIQUE + APRENDIZADO
========================= */

function mostrarSugestaoCorrecaoCategoria(transacao) {
  const categorias = getCategoriasSistema();
  const top = categorias.slice(0, 8).map(c => c.nome);

  const linha = top.map(cat => `[${cat}]`).join(" ");
  assistChatAdd("bot", `Se eu errei a categoria, clique: ${linha}`);

  const chat = document.getElementById("assistChat");
  if (!chat) return;

  chat.setAttribute("data-fix-id", transacao.id);

  if (!window.__assistClickBound) {
    window.__assistClickBound = true;
    chat.addEventListener("click", (e) => {
      const txt = (e.target && e.target.textContent) ? e.target.textContent.trim() : "";
      if (!txt.startsWith("[") || !txt.endsWith("]")) return;

      const categoria = txt.slice(1, -1);
      const id = chat.getAttribute("data-fix-id");
      if (!id) return;

      corrigirCategoriaTransacao(id, categoria);
    });
  }
}

function corrigirCategoriaTransacao(id, novaCategoria) {
  const trans = getTransacoesAssistente();
  const idx = trans.findIndex(t => t.id === id);
  if (idx < 0) return;

  const palavra = extrairPalavraChaveParaAprender(trans[idx].textoOriginal || trans[idx].descricao || "");
  if (palavra) aprenderRegra(palavra, novaCategoria);

  trans[idx].categoria = novaCategoria;
  setTransacoesAssistente(trans);

  assistChatAdd("bot", `Perfeito — movi para **${novaCategoria}** e vou lembrar disso ✅`);

  renderAssistenteHistorico();
  if (typeof renderDashboard === "function") {
    try { renderDashboard(); } catch(e) {}
  }
}

/* =========================
   HISTÓRICO
========================= */

function renderAssistenteHistorico() {
  const box = document.getElementById("assistHistorico");
  if (!box) return;

  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();

  const trans = getTransacoesAssistente()
    .filter(t => {
      const d = new Date(t.dataISO);
      return d.getMonth() === mes && d.getFullYear() === ano;
    })
    .sort((a,b) => new Date(b.dataISO) - new Date(a.dataISO));

  if (trans.length === 0) {
    box.innerHTML = `<div style="opacity:.7">Nenhuma transação adicionada pelo Assistente neste mês.</div>`;
    return;
  }

  box.innerHTML = trans.map(t => `
    <div class="linha-detalhe">
      <div>
        <div style="font-weight:900">${escapeHtml(t.descricao)}</div>
        <div style="opacity:.7; font-size:12px">
          <span class="mini-badge" style="background:${corDaCategoria(t.categoria)}">${iconeDaCategoria(t.categoria)} ${escapeHtml(t.categoria)}</span>
          • ${new Date(t.dataISO).toLocaleString("pt-BR")}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="font-weight:900">R$ ${Number(t.valor).toFixed(2)}</div>
        <button class="btn-ghost" onclick="assistenteExcluir('${t.id}')">🗑</button>
      </div>
    </div>
  `).join("");
}

function assistenteExcluir(id) {
  const arr = getTransacoesAssistente();
  const novo = arr.filter(x => x.id !== id);
  setTransacoesAssistente(novo);

  renderAssistenteHistorico();
  if (typeof renderDashboard === "function") {
    try { renderDashboard(); } catch(e) {}
  }
}

function assistenteLimparMes() {
  if (!confirm("Limpar transações do Assistente do mês atual?")) return;

  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();

  const arr = getTransacoesAssistente();
  const novo = arr.filter(t => {
    const d = new Date(t.dataISO);
    return !(d.getMonth() === mes && d.getFullYear() === ano);
  });

  setTransacoesAssistente(novo);
  renderAssistenteHistorico();
  assistChatAdd("bot", "Mês limpo ✅");
}

/* =========================
   SUGESTÕES (futuro)
========================= */
function renderAssistenteSugestoes() {}

/* =========================
   UTIL
========================= */

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
