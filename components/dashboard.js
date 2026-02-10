function dashboardPage() {
  setTimeout(() => renderDashboard(), 50);

  return `
    <div id="dash"></div>
  `;
}

function renderDashboard() {
  const compras = JSON.parse(localStorage.getItem("comprasCartao")) || [];
  const fixas = JSON.parse(localStorage.getItem("fixas")) || [];
  const custosFixos = JSON.parse(localStorage.getItem("custosFixos")) || [];
  const ganhos = JSON.parse(localStorage.getItem("ganhos")) || [];

  const dash = document.getElementById("dash");
  if (!dash) return;

  // marca início de uso (para "economizando há")
  if (!localStorage.getItem("appStartDate")) {
    localStorage.setItem("appStartDate", new Date().toISOString());
  }
  const start = new Date(localStorage.getItem("appStartDate"));
  const mesesUsando = Math.max(
    0,
    (new Date().getFullYear() - start.getFullYear()) * 12 + (new Date().getMonth() - start.getMonth())
  );

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Ganhos do mês
  let totalGanhosMes = 0;
  ganhos.forEach(g => {
    const d = new Date(g.data);
    if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
      totalGanhosMes += Number(g.valor) || 0;
    }
  });

  // Despesas do mês (cartão)
  let totalDespesasMes = 0;
  compras.forEach(c => {
    const d = new Date(c.data);
    if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
      totalDespesasMes += Number(c.valorParcela) || 0;
    }
  });

  // Despesas fixas (fixas antigas)
  fixas.forEach(f => {
    if (f.ativa) totalDespesasMes += Number(f.valor) || 0;
  });

  // Custos fixos (nova aba Fixos com categorias)
  custosFixos.forEach(f => {
    totalDespesasMes += Number(f.valor) || 0;
  });

  const saldoMes = totalGanhosMes - totalDespesasMes;

  // Estado vazio bonito (se não tiver nada)
  const semDados = (compras.length === 0 && fixas.length === 0 && custosFixos.length === 0 && ganhos.length === 0);

  dash.innerHTML = `
    <div class="dash-top">
      <div>
        <div class="dash-hello">Oi, <strong>Thiago</strong>! 👋</div>
        <div class="dash-sub">Bem-vindo ao seu painel financeiro</div>
      </div>
    </div>

    <div class="dash-hero">
      <div class="dash-hero-title">Conheça o <span class="dash-badge">ASSISTENTE FINANCEIRO</span></div>
      <div class="dash-hero-desc">Veja seus números do mês e adicione lançamentos em 1 clique.</div>
    </div>

    <div class="dash-kpis">
      <div class="kpi">
        <div class="kpi-left">
          <div class="kpi-label">Ganhos</div>
          <div class="kpi-value">R$ ${totalGanhosMes.toFixed(2)}</div>
        </div>
        <div class="kpi-icon">💰</div>
      </div>

      <div class="kpi">
        <div class="kpi-left">
          <div class="kpi-label">Despesas</div>
          <div class="kpi-value">R$ ${totalDespesasMes.toFixed(2)}</div>
        </div>
        <div class="kpi-icon">🧾</div>
      </div>

      <div class="kpi kpi-highlight">
        <div class="kpi-left">
          <div class="kpi-label">Saldo do mês</div>
          <div class="kpi-value">R$ ${saldoMes.toFixed(2)}</div>
        </div>
        <div class="kpi-icon">💎</div>
      </div>

      <div class="kpi">
        <div class="kpi-left">
          <div class="kpi-label">Economizando há</div>
          <div class="kpi-value">${mesesUsando} meses</div>
        </div>
        <div class="kpi-icon">⏳</div>
      </div>
    </div>

    ${semDados ? `
      <div class="dash-empty card">
        <h3>Comece por aqui</h3>
        <p style="opacity:.75">Cadastre seus fixos ou lance uma compra/ganho para preencher seu painel.</p>
        <div class="dash-actions">
          <button class="dash-btn" onclick="navigate('fixos')">📌 Adicionar fixo</button>
          <button class="dash-btn" onclick="navigate('cartao')">💳 Lançar compra</button>
          <button class="dash-btn" onclick="adicionarGanho()">💰 Adicionar ganho</button>
        </div>
      </div>
    ` : `
      <div class="dash-grid">
        <div class="card">
          <h3>Resumo do mês</h3>
          <div class="dash-actions">
            <button class="dash-btn" onclick="adicionarGanho()">💰 Adicionar ganho</button>
            <button class="dash-btn" onclick="navigate('cartao')">➖ Adicionar despesa</button>
            <button class="dash-btn" onclick="navigate('dividas')">📌 Adicionar dívida</button>
            <button class="dash-btn" onclick="navigate('fixos')">📌 Adicionar fixo</button>
          </div>

          <div class="dash-progress">
            <div class="dash-progress-top">
              <span>Fixos</span>
              <span>R$ ${(fixas.filter(f=>f.ativa).reduce((a,f)=>a+(Number(f.valor)||0),0) + custosFixos.reduce((a,f)=>a+(Number(f.valor)||0),0)).toFixed(2)}</span>
            </div>
            <div class="dash-bar">
              <div class="dash-bar-fill" style="width:${calcFixosPercent(totalDespesasMes, fixas, custosFixos)}%"></div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Próximas atualizações</h3>
          <ul class="dash-list">
            <li>✅ Fatura inteligente por fechamento</li>
            <li>✅ Categorias unificadas (cartão + fixos)</li>
            <li>✅ Exportar para Excel / PDF</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <h3>Receita x Despesa</h3>
        <canvas id="graficoMensal"></canvas>
      </div>
      <div class="card" id="alertasLimiteCard"></div>

    `}
  `;

  // só desenha gráfico se não estiver vazio
  if (!semDados) {
    gerarGraficoMensal(totalGanhosMes, totalDespesasMes);
  }
}

function calcFixosPercent(totalDespesasMes, fixas, custosFixos) {
  const fixosTotal =
    (fixas || []).filter(f => f.ativa).reduce((a, f) => a + (Number(f.valor) || 0), 0) +
    (custosFixos || []).reduce((a, f) => a + (Number(f.valor) || 0), 0);

  if (totalDespesasMes <= 0) return 0;
  const p = (fixosTotal / totalDespesasMes) * 100;
  return Math.max(0, Math.min(100, p));
}

function gerarGraficoMensal(ganhos, despesas) {
  const ctx = document.getElementById("graficoMensal");
  if (!ctx) return;

  if (window.graficoDashboard) window.graficoDashboard.destroy();

  window.graficoDashboard = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Ganhos", "Despesas"],
      datasets: [{
        label: "R$",
        data: [ganhos, despesas]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

try {
  renderAlertasLimiteHome();
} catch(e) {
  console.error(e);
}

// Ação rápida: adicionar ganho (simples)
function adicionarGanho() {
  const valor = parseFloat(prompt("Valor do ganho (R$):"));
  if (!valor || valor <= 0) return;

  const descricao = prompt("Descrição (ex: Salário, extra, etc.):") || "Ganho";
  const data = new Date().toISOString();

  const ganhos = JSON.parse(localStorage.getItem("ganhos")) || [];
  ganhos.push({ descricao, valor, data });
  localStorage.setItem("ganhos", JSON.stringify(ganhos));

  renderDashboard();
}

function renderAlertasLimiteHome() {
  const card = document.getElementById("alertasLimiteCard");
  if (!card) return;

  const categorias = JSON.parse(localStorage.getItem("categorias")) || [];
  const fixos = JSON.parse(localStorage.getItem("custosFixos")) || [];
  const trans = JSON.parse(localStorage.getItem("transacoesAssistente")) || [];

  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();

  // soma por categoria (fixos + assistente no mês)
  const gastoPorCat = {};

  fixos.forEach(f => {
    if (!f.categoria) return;
    gastoPorCat[f.categoria] = (gastoPorCat[f.categoria] || 0) + (Number(f.valor) || 0);
  });

  trans.forEach(t => {
    if (!t.categoria) return;
    const d = new Date(t.dataISO);
    if (d.getMonth() === mes && d.getFullYear() === ano) {
      gastoPorCat[t.categoria] = (gastoPorCat[t.categoria] || 0) + (Number(t.valor) || 0);
    }
  });

  // filtra categorias com limite e perto do limite
  const alertas = categorias
    .filter(c => Number(c.limite || 0) > 0)
    .map(c => {
      const gasto = gastoPorCat[c.nome] || 0;
      const limite = Number(c.limite || 0);
      const pct = limite > 0 ? (gasto / limite) * 100 : 0;
      return { ...c, gasto, limite, pct };
    })
    .filter(x => x.pct >= 75) // "perto do limite"
    .sort((a,b) => b.pct - a.pct);

  if (alertas.length === 0) {
    card.innerHTML = `
      <div class="card-head">
        <h3>Alertas de limite</h3>
        <span style="opacity:.7; font-weight:800;">Tudo sob controle ✅</span>
      </div>
      <div style="opacity:.75; margin-top:8px;">
        Nenhuma categoria acima de 75% do limite neste mês.
      </div>
    `;
    return;
  }

  card.innerHTML = `
    <div class="card-head">
      <h3>⚠️ Categorias perto do limite</h3>
      <button class="btn-ghost" onclick="navigate('categorias')">Ajustar limites</button>
    </div>

    <div class="alert-list">
      ${alertas.map(a => {
        const estourou = a.gasto > a.limite;
        const pct = Math.min(999, a.pct);
        const cor = a.cor || "#777";
        const icone = a.icone || "🏷️";

        return `
          <div class="alert-item">
            <div class="alert-left">
              <span class="mini-badge" style="background:${cor}">${icone} ${escapeHtml(a.nome)}</span>
              <div class="alert-sub">
                <strong>R$ ${a.gasto.toFixed(2)}</strong> de R$ ${a.limite.toFixed(2)}
                • <span style="color:${estourou ? 'red' : '#0a7'}; font-weight:900;">
                  ${pct.toFixed(0)}%
                </span>
              </div>
              <div class="dash-bar" style="margin-top:8px;">
                <div class="dash-bar-fill" style="
                  width:${Math.min(100, pct)}%;
                  background:${estourou ? 'rgba(255,60,60,0.85)' : 'rgba(0,200,120,0.85)'};">
                </div>
              </div>
            </div>

            <div class="alert-actions">
              <button class="btn-ghost" onclick="navigate('assistente')">Lançar gasto</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
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
