// script.js

const productsContainer = document.getElementById('produtos-container');
const filterButtons = document.querySelectorAll('.filtro-btn');
let allProducts = []; // Array para armazenar todos os produtos carregados

// Substitua este URL pelo URL da sua Google Sheet publicada como CSV
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQp0qGstH3qtpcPRD2wZUhsRuMypfIGghZFXMlkThHSbH9ytKA_l9bgFioa7YuKv-jdXJhQrwcI7eKA/pub?output=csv'; // EX: https://docs.google.com/spreadsheets/d/e/2PACX-1vR_0123456789abcdefghijklmnopqrstuvwxyz/pub?output=csv

// Função para buscar os dados da Google Sheet
async function fetchProductsFromGoogleSheet() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Erro ao buscar produtos da Google Sheet:', error);
        Toastify({
            text: "Erro ao carregar produtos. Tente novamente mais tarde.",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right, #ff5f6d, #ffc371)",
            },
        }).showToast();
        return [];
    }
}

// Função para parsear o CSV
function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(header => header.trim()); // Remove espaços em branco
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        if (currentLine.length === headers.length) { // Garante que a linha tem o número correto de colunas
            const product = {};
            for (let j = 0; j < headers.length; j++) {
                // Tratamento básico para ID numérico e preço
                if (headers[j].toLowerCase() === 'id' || headers[j].toLowerCase() === 'preço') {
                    product[headers[j]] = parseFloat(currentLine[j]);
                } else {
                    product[headers[j]] = currentLine[j].trim(); // Remove espaços em branco
                }
            }
            products.push(product);
        }
    }
    return products;
}

// Função para criar o card do produto
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.classList.add('produto-card');
    productCard.setAttribute('data-categoria', product['Categoria'] ? product['Categoria'].toLowerCase() : 'todos'); // Use 'Categoria' da sua sheet

    productCard.innerHTML = `
        <img src="${product['Imagem']}" alt="${product['Nome do Produto']}" class="produto-img">
        <div class="produto-info">
        
            <h3>${product['Nome do Produto'] ? `${product['Nome do Produto']} - ` : ''}${product['ML']}</h3>

            <span class="preco">R$ ${product['Preço'].toFixed(2).replace('.', ',')}</span>

        <button class="add-carrinho"

        data-id="${product['ID']}"
        data-name="${product['Nome do Produto']}"
        data-price="${product['Preço']}"
        data-img="${product['Imagem']}"
        data-ml="${product['ML']}">
        Adicionar ao Carrinho
            </button>
        </div>
    `;
    return productCard;
}

// Função para renderizar os produtos
function renderProducts(productsToRender) {
    productsContainer.innerHTML = ''; // Limpa os produtos existentes
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = '<p>Nenhum produto encontrado para esta categoria.</p>';
        return;
    }
    productsToRender.forEach(product => {
        productsContainer.appendChild(createProductCard(product));
    });
    addAddToCartListeners(); // Adiciona listeners após renderizar
}

// Função para filtrar produtos
function filterProducts(category) {
    let filtered = [];
    if (category === 'todos') {
        filtered = allProducts;
    } else {
        filtered = allProducts.filter(product =>
            product['Categoria'] && product['Categoria'].toLowerCase() === category
        );
    }
    renderProducts(filtered);
}

// Event Listeners para os botões de filtro
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove a classe 'active' de todos os botões
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Adiciona a classe 'active' ao botão clicado
        button.classList.add('active');

        const category = button.getAttribute('data-categoria');
        filterProducts(category);
    });
});

// --- Lógica do Carrinho de Compras (manter a sua existente, adaptando se necessário) ---

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const subtotalSpan = document.getElementById('subtotal');
const freteSpan = document.getElementById('frete');
const checkoutBtn = document.getElementById('checkout-btn');
const addressInput = document.getElementById('address');
const addressWarn = document.getElementById('address-warn');
const cartCountSpan = document.getElementById('cart-count'); // Span para o contador do carrinho

// Função para atualizar o contador do carrinho na interface
function updateCartCount() {
    cartCountSpan.textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

// Inicializa o contador do carrinho ao carregar a página
updateCartCount();

// Abrir o modal do carrinho
cartBtn.addEventListener('click', () => {
    updateCartModal();
    cartModal.style.display = 'flex';
});

// Fechar o modal do carrinho
closeModalBtn.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

// Fechar o modal clicando fora
cartModal.addEventListener('click', (event) => {
    if (event.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

// Adicionar ao carrinho (Este listener será adicionado dinamicamente)
function addAddToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.add-carrinho');
    addToCartButtons.forEach(button => {
        button.onclick = null; // Remove listeners antigos para evitar duplicação
        button.addEventListener('click', (event) => {
            const productId = event.target.getAttribute('data-id');
            const productName = event.target.getAttribute('data-name');
            const productPrice = parseFloat(event.target.getAttribute('data-price'));
            const productImage = event.target.getAttribute('data-img');
            const productMl = event.target.getAttribute('data-ml');


            addToCart(productId, productName, productPrice, productImage, productMl);

        });
    });
}


function addToCart(id, name, price, img, ml) {

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
        Toastify({
            text: `Mais um ${name} adicionado ao carrinho!`,
            duration: 1000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
        }).showToast();
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            img: img,
            ml: ml,
            quantity: 1
        });


        Toastify({
            text: `${name} adicionado ao carrinho!`,
            duration: 1000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "length", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to length, #00b09b, #96c93d)",
            },
        }).showToast();
    }

    updateCartModal();
    saveCart();
    updateCartCount();
}

function updateCartModal() {
    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio</p>';
        subtotalSpan.textContent = `R$ 0,00`;
        freteSpan.textContent = `R$ 0,00`;
        cartTotalSpan.textContent = `R$ 0,00`;
        return;
    }

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="item-info">
                <h4>${item.name}</h4>
                <div class="quantidade-controls">
    <button class="quantidade-btn" onclick="decrementItem('${item.id}')">−</button>
    <span>${item.quantity}</span>
    <button class="quantidade-btn" onclick="incrementItem('${item.id}')">+</button>
</div>

                <p>${item.ml}</p>
                <p>Preço: R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>

            </div>
           <button onclick="removeFromCart('${item.id}')" class="remove-btn">
    🗑️
</button>

        `;
        cartItemsContainer.appendChild(itemElement);
        subtotal += item.price * item.quantity;
    });

    // Adiciona listeners para os botões de remover item
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const idToRemove = event.target.getAttribute('data-id');
            removeFromCart(idToRemove);
        });
    });

    subtotalSpan.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    const frete = 0; // Você pode implementar lógica de frete aqui
    freteSpan.textContent = `R$ ${frete.toFixed(2).replace('.', ',')}`;
    cartTotalSpan.textContent = `R$ ${(subtotal + frete).toFixed(2).replace('.', ',')}`;
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartModal();
    saveCart();
    updateCartCount();
    Toastify({
        text: "Produto removido do carrinho.",
        duration: 1000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
    }).showToast();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

addressInput.addEventListener('input', () => {
    if (addressInput.value.trim() !== '') {
        addressWarn.style.display = 'none';
    }
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        Toastify({
            text: "Seu carrinho está vazio!",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right, #ff5f6d, #ffc371)",
            },
        }).showToast();
        return;
    }

    if (addressInput.value.trim() === '') {
        addressWarn.style.display = 'block';
        return;
    }

    const cartItems = cart.map(item =>
    `- ${item.name} (${item.ml}) x${item.quantity} = R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`
).join('\n');


    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2).replace('.', ',');
    const total = subtotal; // Considerando frete 0 por enquanto

    const message = `*NOVO PEDIDO - WR Aromatizantes*\n\n` +
        `*Itens do Pedido:*\n${cartItems}\n\n` +
        `*Endereço de Entrega:*\n${addressInput.value.trim()}\n\n` +
        `*Subtotal: R$ ${subtotal}*\n` +
        `*Total: R$ ${total}*\n\n` +
        `Aguardamos seu contato para finalizar a compra!`;

    const whatsappUrl = `https://wa.me/5588999049636?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    cart = [];
    saveCart();
    updateCartModal();
    updateCartCount();
    addressInput.value = '';
    Toastify({
        text: "Pedido enviado para o WhatsApp!",
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
    }).showToast();
});


// Inicialização (carregar produtos e configurar slider)
document.addEventListener('DOMContentLoaded', async () => {
    let produtosBrutos = await fetchProductsFromGoogleSheet();

    // Filtra os produtos que estão com "Disponível" diferente de "não"
    allProducts = produtosBrutos.filter(prod =>
        !prod['Disponível'] || prod['Disponível'].toLowerCase().trim() !== 'não'
    );

    renderProducts(allProducts);


    updateCartCount(); // Atualiza o contador do carrinho ao carregar a página

    // Inicialização do Swiper Slider (mantenha sua lógica existente)
    const swiper = new Swiper('.swiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

    });
});
function incrementItem(id) {
    const item = cart.find(p => p.id === id);
    if (item) {
        item.quantity += 1;
        saveCart();
        updateCartModal();
        updateCartCount();
    }
}

function decrementItem(id) {
    const item = cart.find(p => p.id === id);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            // Remove se estiver com 1 unidade e clicar em "-"
            cart = cart.filter(p => p.id !== id);
            Toastify({
                text: "Produto removido do carrinho.",
                duration: 1000,
                close: true,
                gravity: "top",
                position: "right",
                stopOnFocus: true,
                style: {
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                },
            }).showToast();
        }
        saveCart();
        updateCartModal();
        updateCartCount();
    }
}
