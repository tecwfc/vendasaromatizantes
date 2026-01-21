// CONFIGURAÇÃO DOS LINKS CSV
const LINK_CSV_PRODUTOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs7rd0kCNzoCu3bw-wEjhkmcnLBDTvfzsa76Fs1Dhi2Mtc9GCEUiyJp0Gs9ocGMWYzD5zpM5-un9F6/pub?gid=802568556&single=true&output=csv";
const LINK_CSV_BANNERS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs7rd0kCNzoCu3bw-wEjhkmcnLBDTvfzsa76Fs1Dhi2Mtc9GCEUiyJp0Gs9ocGMWYzD5zpM5-un9F6/pub?gid=635148368&single=true&output=csv";
const MINHA_URL_WEB_APP = "https://script.google.com/macros/s/AKfycbzmu7AUzojnW70p_3U7qcevPsKR7iUndTpwxfUJ79gcOlB92Y-qjkOU7rAAyXL-CClE/exec";

let produtosLoja = [];
let cart = [];
let bannersAtivos = [];
let bannerAtualIndex = 0;
const FRETE_GRATIS_VALOR = 100;

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cart-modal").classList.add("hidden");
  buscarBanners();
  buscarDados();
});

// --- FINALIZAR PEDIDO (WEB APP + WHATSAPP) ---
document.getElementById("checkout-btn").onclick = async () => {
  const address = document.getElementById("address").value;
  if (cart.length === 0) return Toastify({ text: "Sua sacola está vazia!", style: { background: "#ef4444" } }).showToast();
  if (!address || address.length < 10) return Toastify({ text: "Por favor, informe o endereço completo!", style: { background: "#f59e0b" } }).showToast();

  const dadosVenda = { itens: cart.map(item => ({ id: item.id, quantity: item.quantity })) };

  try {
    fetch(MINHA_URL_WEB_APP, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dadosVenda) });
  } catch (e) { console.error("Erro planilha:", e); }

  enviarParaWhatsapp(address);
  cart = [];
  updateCart();
  document.getElementById("address").value = "";
  document.getElementById("cart-modal").classList.add("hidden");
  Toastify({ text: "Pedido enviado!", duration: 3000, style: { background: "#064e3b" } }).showToast();
};

// --- LOGICA DOS BANNERS ---
async function buscarBanners() {
  try {
    const response = await fetch(LINK_CSV_BANNERS);
    const csvText = await response.text();
    const linhas = csvText.split("\n").slice(1);
    bannersAtivos = linhas.map(linha => {
      const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      return {
        img: formatarLinkImagem(col[0]?.trim()),
        titulo: col[1]?.trim(),
        subtitulo: col[2]?.trim(),
        btnTexto: col[3]?.trim(),
        btnLink: col[4]?.trim(),
        ativo: col[5]?.trim().toUpperCase().includes("TRUE"),
      };
    }).filter(b => b.ativo && b.titulo);
    if (bannersAtivos.length > 0) iniciarCicloBanners();
  } catch (e) { console.error("Erro banners:", e); }
}

function iniciarCicloBanners() {
  renderizarBanner(bannersAtivos[0]);
  if (bannersAtivos.length > 1) {
    setInterval(() => {
      bannerAtualIndex = (bannerAtualIndex + 1) % bannersAtivos.length;
      renderizarBanner(bannersAtivos[bannerAtualIndex]);
    }, 4000);
  }
}

function renderizarBanner(dados) {
  const bannerContainer = document.querySelector(".bg-wr-gradient");
  if (!bannerContainer) return;
  bannerContainer.style.transition = "background-image 0.8s ease-in-out";
  bannerContainer.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${dados.img}')`;
  bannerContainer.style.backgroundSize = "cover";
  bannerContainer.style.backgroundPosition = "center";

  const h2 = bannerContainer.querySelector("h2");
  const p = bannerContainer.querySelector("p");
  if (h2) h2.innerHTML = dados.titulo.replace("transforma", `<span class="text-accent italic">transforma</span>`);
  if (p) p.innerText = dados.subtitulo;
  const btn = bannerContainer.querySelector('a[href="#produtos"], a.bg-white');
  if (btn) { btn.innerText = dados.btnTexto; btn.href = dados.btnLink || "#produtos"; }
}

// --- LOGICA DOS PRODUTOS ---
async function buscarDados() {
  try {
    const response = await fetch(LINK_CSV_PRODUTOS);
    const csvText = await response.text();
    const linhas = csvText.split("\n").slice(1).filter(l => l.trim() !== "");

    produtosLoja = linhas.map(linha => {
      const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      return {
        id: col[0]?.trim(),
        name: col[1]?.trim(),
        ml: col[2]?.trim(),
        price: parseFloat(col[3]) || 0,
        category: col[4]?.trim() || "Geral",
        image: formatarLinkImagem(col[6]?.trim()),
        disponivel: col[7]?.trim().toLowerCase() === "sim",
        destaque: col[8]?.trim().toLowerCase() === "sim",
        saldo: parseInt(col[11]) || 0,
      };
    }).filter(p => p.id && p.name);

    renderizarProdutos(produtosLoja);
    renderizarDestaques(); // Renderiza os destaques após carregar produtos
  } catch (e) { console.error("Erro produtos:", e); }
}

function renderizarProdutos(lista) {
  const container = document.getElementById("produtos-container");
  if (!container) return;

  container.innerHTML = lista.map(p => {
    const isEsgotado = p.saldo <= 0 || !p.disponivel;
    const isUltimaUnidade = p.saldo === 1;
    let tagEstoque = "";

    if (!isEsgotado) {
      if (isUltimaUnidade) {
        // Ajustamos o padding (px-2) e removemos o "uppercase" se necessário, 
        // além de garantir que o texto não quebre de forma estranha.
        tagEstoque = `
    <div class="absolute top-3 right-3 z-20 animate-bounce-soft">
      <span class="bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-1 py-1.5 rounded-full shadow-lg shadow-red-500/40 leading-none inline-block text-center min-w-[70px]">
        Última<br>unidade!</span></div>`;

      } else {
        tagEstoque = `<div class="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-xl border border-white/20 shadow-sm"><span class="text-[9px] text-slate-500 font-bold block text-center">${p.saldo} un</span></div>`;
      }
    }

    return `
      <div class="product-card bg-white rounded-[2.5rem] p-3 flex flex-col relative group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 ${isEsgotado ? "opacity-60" : ""}">
          <div class="relative aspect-square rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden mb-5">
              <img src="${p.image}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                           
              ${tagEstoque}

              ${isEsgotado ?
        `<div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"><span class="bg-white text-dark px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Esgotado</span></div>` :
        `<button onclick="addToCart('${p.id}')" class="absolute bottom-4 right-4 bg-dark text-white w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center hover:bg-primary transition-all duration-300 active:scale-90 group-hover:rotate-6">
                    <i class="fa-solid fa-plus"></i>
                </button>`
      }
          </div>

          
<div class="px-3 pb-2">
    <p class="text-[9px] uppercase tracking-[0.2em] text-primary font-bold mb-1 opacity-70">${p.category}</p>
    <h3 class="text-dark font-extrabold text-sm mb-1 truncate leading-tight">${p.name}</h3>
   
<div class="flex items-center gap-1 mb-3">
    <span class="text-[11px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
        <i class="fa-solid fa-droplet text-[9px] mr-1"></i> ${p.ml}
    </span>
</div>
    
    <div class="flex justify-between items-center border-t border-slate-50 pt-3">
        <div class="flex flex-col">
            <span class="text-[8px] text-slate-400 font-bold uppercase leading-none">Preço</span>
            <span class="text-base font-black text-dark">R$ ${p.price.toFixed(2).replace(".", ",")}</span>
        </div>
        <div class="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
            <i class="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
        </div>
    </div>
</div>
      </div>`;
  }).join("");
}

function renderizarDestaques() {
  const destaqueContainer = document.getElementById("destaques-container");
  if (!destaqueContainer) return;

  const destaques = produtosLoja.filter((p) => p.destaque && p.saldo > 0).slice(0, 8);
  if (destaques.length === 0) return;

  destaqueContainer.innerHTML = destaques.map((p) => `
    <div class="swiper-slide py-10">
        <div class="destaque-card-premium group relative overflow-hidden rounded-[3rem] p-6">
            <div class="absolute top-6 left-6 z-20 transition-all duration-500 group-hover:translate-x-2">
                <span class="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/30">${p.ml}</span>
            </div>
            <div class="relative w-full aspect-square mb-8 flex items-center justify-center rounded-[2.5rem] bg-gradient-to-b from-slate-50 to-white overflow-hidden">
                <div class="absolute w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-all duration-700 group-hover:scale-[3] group-hover:bg-primary/20"></div>
                <img src="${p.image}" class="img-reveal w-4/5 h-4/5 object-contain z-10">
            </div>
            <div class="text-center relative z-10">
                <p class="text-[9px] uppercase tracking-[0.3em] text-primary/60 font-bold mb-2">${p.category}</p>
                <h3 class="font-extrabold text-base text-dark mb-4 leading-tight">${p.name}</h3>
                <div class="mb-6"><span class="text-2xl font-black text-dark tracking-tighter">R$ ${p.price.toFixed(2).replace(".", ",")}</span></div>
                <button onclick="addToCart('${p.id}')" class="w-full bg-dark text-white py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 hover:bg-primary hover:shadow-xl hover:shadow-primary/40 active:scale-95 flex items-center justify-center gap-3">
                    <i class="fa-solid fa-cart-shopping text-xs"></i> Reservar Agora
                </button>
            </div>
        </div>
    </div>`).join("");

  new Swiper(".destaquesSwiper", {
    slidesPerView: 1.3,
    centeredSlides: true,
    spaceBetween: 25,
    loop: destaques.length > 1,
    autoplay: { delay: 4000 },
    speed: 800,
    breakpoints: { 768: { slidesPerView: 3, centeredSlides: false }, 1024: { slidesPerView: 4, centeredSlides: false } },
  });
}

// --- CARRINHO E ESTOQUE ---
window.addToCart = function (id) {
  const p = produtosLoja.find(i => i.id == id);
  if (!p) return;
  const exists = cart.find(i => i.id == id);
  if (exists && exists.quantity >= p.saldo) return Toastify({ text: `Saldo insuficiente!`, gravity: "bottom",style: { background: "#ef4444" } }).showToast();

  if (exists) exists.quantity++;
  else cart.push({ ...p, quantity: 1 });

  updateCart();
  Toastify({ text: "Adicionado ao carrinho!", gravity: "bottom",duration: 2000, style: { background: "#8e5fb1" } }).showToast();
};

window.changeQuantity = function (id, delta) {
  const item = cart.find(i => i.id == id);
  const prod = produtosLoja.find(p => p.id == id);
  if (!item || !prod) return;

  if (delta > 0 && item.quantity >= prod.saldo) return Toastify({ text: "Limite de estoque!",gravity: "bottom", style: { background: "#ef4444" } }).showToast();

  item.quantity += delta;
  if (item.quantity <= 0) removeItem(id);
  updateCart();
};

function updateCart() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 opacity-20">
        <i class="fa-solid fa-bag-shopping text-4xl mb-2"></i>
        <p class="text-xs font-bold">Sacola vazia</p>
      </div>`;
    updateCartUI(0);
    return;
  }

  cart.forEach(item => {
    total += item.price * item.quantity;
    const pOrig = produtosLoja.find(p => p.id === item.id);
    
    // Alerta de estoque mais discreto para economizar altura
    const alerta = pOrig?.saldo < 2 ? 
      `<div class="text-red-600 text-[9px] font-black mb-1 flex items-center gap-1 animate-pulse">
        <i class="fa-solid fa-triangle-exclamation"></i> ÚLTIMA UNIDADE!
      </div>` : "";

    const div = document.createElement("div");
    // Reduzi paddings (p-3) e margens (mb-3)
    div.className = "flex flex-col mb-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm";
    
    div.innerHTML = `
      ${alerta}
      <div class="flex items-center gap-3">
        <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-50">
        
        <div class="flex-1 min-w-0">
          <p class="font-black text-[12px] text-dark truncate leading-tight">${item.name}</p>
          <p class="text-dark font-black text-[12px]">R$ ${item.price.toFixed(2).replace(".", ",")}</p>
        </div>

        <div class="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
          <button onclick="changeQuantity('${item.id}', -1)" class="w-6 h-6 bg-white rounded shadow-xs text-primary flex items-center justify-center active:scale-90">
            <i class="fa-solid fa-minus text-[8px]"></i>
          </button>
          <span class="font-black text-xs w-3 text-center text-dark">${item.quantity}</span>
          <button onclick="changeQuantity('${item.id}', 1)" class="w-6 h-6 bg-white rounded shadow-xs text-primary flex items-center justify-center active:scale-90">
            <i class="fa-solid fa-plus text-[8px]"></i>
          </button>
        </div>

        <button onclick="removeItem('${item.id}')" class="text-slate-300 hover:text-red-500 p-1">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    `;
    container.appendChild(div);
  });

  updateCartUI(total);
}
function updateCartUI(totalProdutos) {
  // 1. Define a taxa de entrega (R$ 5 ou R$ 0 se ganhar frete grátis)
  const valorEntrega = totalProdutos >= FRETE_GRATIS_VALOR ? 0 : 5.00;
  const totalGeral = totalProdutos + valorEntrega;

  // 2. Atualiza o Total Geral na tela
  document.getElementById("cart-total").innerText = `R$ ${totalGeral.toFixed(2).replace(".", ",")}`;
  document.getElementById("cart-count").innerText = cart.length;

  // 3. Atualiza o descritivo da entrega (se você criou o campo no HTML)
  const entregaDesc = document.getElementById("entrega-valor-desc");
  if (entregaDesc) {
      entregaDesc.innerText = valorEntrega === 0 ? "GRÁTIS" : "R$ 5,00";
      entregaDesc.style.color = valorEntrega === 0 ? "#16a34a" : "#0f0717";
  }

  // 4. Lógica da Barra de Frete (baseada apenas nos PRODUTOS)
  const freteBar = document.getElementById("frete-bar");
  const freteStatus = document.getElementById("frete-status");
  
  if (freteBar && freteStatus) {
    let porcentagem = (totalProdutos / FRETE_GRATIS_VALOR) * 100;
    freteBar.style.width = `${Math.min(porcentagem, 100)}%`;
    
    if (totalProdutos >= FRETE_GRATIS_VALOR) {
      freteStatus.innerHTML = "🎉 VOCÊ GANHOU FRETE GRÁTIS!";
      freteBar.style.backgroundColor = "#16a34a"; // Verde
    } else {
      const falta = (FRETE_GRATIS_VALOR - totalProdutos).toFixed(2).replace(".", ",");
      freteStatus.innerHTML = `Faltam <span class="text-primary font-black">R$ ${falta}</span> para Frete Grátis`;
      freteBar.style.backgroundColor = "#6d28d9"; // Sua cor primária
    }
  }
}

window.removeItem = (id) => { cart = cart.filter(i => i.id !== id); updateCart(); };

Window.removeItem = function (id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
};

// --- LIMPAR SACOLA ---
window.clearCart = function () {
  // 1. Verifica se a sacola já está vazia
  if (cart.length === 0) {
    return Toastify({
      text: "A sacola já está vazia!",
      style: { background: "#f59e0b" }
    }).showToast();
  }

  // 2. Pede confirmação
  if (confirm("Deseja remover todos os itens da sacola?")) {
    cart = []; // Esvazia o array

    updateCart(); // Atualiza os valores na tela

    // 3. FECHA O MODAL AUTOMATICAMENTE
    const cartModal = document.getElementById("cart-modal");
    if (cartModal) {
      cartModal.classList.replace("flex", "hidden");
    }

    // 4. Avisa o usuário
    Toastify({
      text: "Sacola limpa!",
      duration: 2000,
      style: { background: "#ef4444" }
    }).showToast();
  }
};

function enviarParaWhatsapp(endereco) {
  const fone = "5588999049636";
  
  // 1. Calcula o total apenas dos produtos
  const totalProdutos = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  
  // 2. Define a taxa de entrega (mesma lógica do site)
  const valorEntrega = totalProdutos >= FRETE_GRATIS_VALOR ? 0 : 5.00;
  const totalGeral = totalProdutos + valorEntrega;

  let msg = `*🛍️ NOVO PEDIDO - WR AROMATIZANTES*\n`;
  msg += `------------------------------------------\n\n`;
  msg += `*ITENS:*\n`;
  
  cart.forEach(i => {
    msg += `• ${i.quantity}x ${i.name} (${i.ml}) - R$ ${(i.price * i.quantity).toFixed(2).replace(".", ",")}\n`;
  });

  msg += `\n------------------------------------------\n`;
  
  // 3. Detalha a entrega na mensagem para o cliente não ter dúvidas
  msg += `*Produtos:* R$ ${totalProdutos.toFixed(2).replace(".", ",")}\n`;
  msg += `*Entrega:* ${valorEntrega === 0 ? "GRÁTIS" : "R$ 5,00"}\n`;
  msg += `*TOTAL FINAL: R$ ${totalGeral.toFixed(2).replace(".", ",")}*\n\n`;
  
  msg += `*📍 ENDEREÇO DE ENTREGA:*\n${endereco}`;

  window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, "_blank");
}
// --- FILTROS, MENU E MODAIS ---
window.filtrarProdutos = function (cat) {
  if (!mobileMenu.classList.contains("translate-x-full")) toggleMenu();
  const filtrados = cat === "todos" ? produtosLoja : produtosLoja.filter(p => p.category.toLowerCase().includes(cat.toLowerCase()) || p.ml.toLowerCase().includes(cat.toLowerCase()));
  renderizarProdutos(filtrados);
  setTimeout(() => { document.getElementById("produtos").scrollIntoView({ behavior: "smooth" }); }, 300);
};

const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const mobileMenu = document.getElementById("mobile-menu");
const mobileOverlay = document.getElementById("mobile-overlay");

if (cartBtn) cartBtn.onclick = () => cartModal.classList.replace("hidden", "flex");
document.getElementById("close-modal-btn").onclick = () => cartModal.classList.replace("flex", "hidden");

window.toggleMenu = () => { mobileMenu.classList.toggle("translate-x-full"); mobileOverlay.classList.toggle("hidden"); };
if (mobileOverlay) mobileOverlay.onclick = toggleMenu;
document.getElementById("close-mobile-menu").onclick = toggleMenu;

// --- QUIZ ---
const questions = [
  { question: "Onde você pretende usar o aroma?", options: [{ text: "No meu carro", value: "automotivo", icon: "fa-car" }, { text: "Na sala/quarto", value: "casa", icon: "fa-house" }, { text: "Escritório", value: "business", icon: "fa-briefcase" }] },
  { question: "Qual sensação você busca?", options: [{ text: "Frescor", value: "citrico", icon: "fa-leaf" }, { text: "Calma", value: "lavanda", icon: "fa-moon" }, { text: "Luxo", value: "amadeirado", icon: "fa-crown" }] },
  { question: "Qual intensidade?", options: [{ text: "Suave", value: "leve", icon: "fa-feather" }, { text: "Marcante", value: "forte", icon: "fa-fire" }] }
];
let currentStep = 0; let answers = [];

window.openQuiz = () => { document.getElementById("quiz-modal").classList.replace("hidden", "flex"); renderQuestion(); };
window.closeQuiz = () => { document.getElementById("quiz-modal").classList.replace("flex", "hidden"); currentStep = 0; answers = []; };

function renderQuestion() {
  const content = document.getElementById("quiz-content");
  document.getElementById("quiz-progress").style.width = `${(currentStep / questions.length) * 100}%`;
  if (currentStep < questions.length) {
    const q = questions[currentStep];
    content.innerHTML = `<h2 class="text-2xl font-black mb-8">${q.question}</h2><div class="grid gap-4">${q.options.map(opt => `<button onclick="nextStep('${opt.value}')" class="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-50 hover:border-primary text-left"><div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center"><i class="fa-solid ${opt.icon}"></i></div><span class="font-bold">${opt.text}</span></button>`).join("")}</div>`;
  } else {
    const filtro = answers[0] === "automotivo" ? "automotivo" : "500ml";
    content.innerHTML = `<div class="text-center"><h2 class="text-2xl font-black mb-8">Seu par ideal!</h2><button onclick="finalizarQuiz('${filtro}')" class="w-full bg-primary text-white py-5 rounded-2xl font-black">Ver Recomendação</button></div>`;
  }
}
window.nextStep = (val) => { answers.push(val); currentStep++; renderQuestion(); };
window.finalizarQuiz = (cat) => { closeQuiz(); filtrarProdutos(cat); window.location.hash = "produtos"; };

// --- IMAGENS ---
function formatarLinkImagem(url) {
  if (!url) return "assets/placeholder.png";
  if (url.includes("drive.google.com")) {
    let id = url.includes("/d/") ? url.split("/d/")[1].split("/")[0] : url.split("id=")[1].split("&")[0];
    return `https://lh3.googleusercontent.com/u/0/d/${id}`;
  }
  return url;
}



// --- FECHAR MODAL COM ESC OU CLICANDO FORA ---
// 1. Fechar ao clicar na tecla ESC
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const cartModal = document.getElementById("cart-modal");
    const quizModal = document.getElementById("quiz-modal");

    // Fecha qualquer um que estiver aberto
    if (cartModal) cartModal.classList.replace("flex", "hidden");
    if (quizModal) quizModal.classList.replace("flex", "hidden");
  }
});

// 2. Fechar ao clicar na área escura (fora do conteúdo)
const cartModalContainer = document.getElementById("cart-modal");
if (cartModalContainer) {
  cartModalContainer.addEventListener("click", (event) => {
    // Se o clique foi exatamente no fundo escuro (e não nos itens dentro dele)
    if (event.target.id === "cart-modal") {
      cartModalContainer.classList.replace("flex", "hidden");
    }
  });
}

let deferredPrompt;
const installBanner = document.getElementById('install-banner');

// 1. Captura o evento de instalação (Android)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Só mostra se for celular e não tiver sido fechado antes
    if (window.innerWidth < 768 && !localStorage.getItem('bannerClosed')) {
        setTimeout(() => {
            installBanner.classList.remove('translate-y-[150%]');
        }, 3000); // Aparece após 3 segundos
    }
});

// 2. Lógica do botão Instalar
document.getElementById('btn-install-now').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Usuário instalou o app');
        }
        deferredPrompt = null;
        installBanner.classList.add('translate-y-[150%]');
    } else {
        // Se for iOS ou o prompt não disparou, avisa como fazer manualmente
        alert("No iPhone: Clique no ícone de 'Compartilhar' (quadrado com seta) e depois em 'Adicionar à Tela de Início'.");
    }
});

function closeInstallBanner() {
    installBanner.classList.add('translate-y-[150%]');
    localStorage.setItem('bannerClosed', 'true'); // Não incomoda o cliente novamente
}

// 3. Esconde se o app já estiver rodando como standalone
if (window.matchMedia('(display-mode: standalone)').matches) {
    installBanner.style.display = 'none';
}
