    // const productsContainer = document.getElementById('productsContainer');
    // const cartItemsTbody = document.getElementById('cartItems');
    // const totalPriceEl = document.getElementById('totalPrice');
    // const checkoutForm = document.getElementById('checkoutForm');
    // const modal = document.getElementById('modal');
    // const modalClose = document.getElementById('modalClose');

    // let products = [];
    // let cart = {};

    // function loadProducts() {
    //   const storedProducts = localStorage.getItem('products');
    //   products = storedProducts ? JSON.parse(storedProducts) : [];
    // }

    // function renderProducts() {
    //   productsContainer.innerHTML = '';
    //   if(products.length === 0) {
    //     productsContainer.innerHTML = '<p style="color:#777; font-style: italic; text-align:center;">Nenhum produto disponível.</p>';
    //     return;
    //   }
    //   products.forEach((prod, index) => {
    //     const div = document.createElement('div');
    //     div.classList.add('product');
    //     div.innerHTML = `
    //       <h3>${prod.name}</h3>
    //       <p>${prod.description}</p>
    //       <strong>R$ ${prod.price.toFixed(2)}</strong>
    //       <button aria-label="Adicionar ${prod.name} ao carrinho" onclick="addToCart(${index})">Adicionar ao Carrinho</button>
    //     `;
    //     productsContainer.appendChild(div);
    //   });
    // }

    // function addToCart(index) {
    //   const prod = products[index];
    //   if(cart[index]) {
    //     cart[index].quantity++;
    //   } else {
    //     cart[index] = { ...prod, quantity: 1 };
    //   }
    //   renderCart();
    // }

    // function removeFromCart(index) {
    //   delete cart[index];
    //   renderCart();
    // }

    // function changeQuantity(index, qty) {
    //   qty = Number(qty);
    //   if(qty <= 0) {
    //     removeFromCart(index);
    //   } else {
    //     cart[index].quantity = qty;
    //   }
    //   renderCart();
    // }

    // function renderCart() {
    //   cartItemsTbody.innerHTML = '';
    //   let total = 0;
    //   const keys = Object.keys(cart);
    //   if(keys.length === 0) {
    //     cartItemsTbody.innerHTML = `<tr><td colspan="5" style="color:#777; font-style: italic;">Carrinho vazio.</td></tr>`;
    //     totalPriceEl.textContent = '0.00';
    //     return;
    //   }
    //   keys.forEach(key => {
    //     const item = cart[key];
    //     const subtotal = item.price * item.quantity;
    //     total += subtotal;
    //     const tr = document.createElement('tr');
    //     tr.innerHTML = `
    //       <td>${item.name}</td>
    //       <td>R$ ${item.price.toFixed(2)}</td>
    //       <td>
    //         <input type="number" min="1" value="${item.quantity}" aria-label="Quantidade de ${item.name}" onchange="changeQuantity(${key}, this.value)" />
    //       </td>
    //       <td>R$ ${subtotal.toFixed(2)}</td>
    //       <td><button aria-label="Remover ${item.name} do carrinho" onclick="removeFromCart(${key})">Remover</button></td>
    //     `;
    //     cartItemsTbody.appendChild(tr);
    //   });
    //   totalPriceEl.textContent = total.toFixed(2);
    // }

    // checkoutForm.addEventListener('submit', e => {
    //   e.preventDefault();
    //   if(Object.keys(cart).length === 0) {
    //     alert('Seu carrinho está vazio.');
    //     return;
    //   }
    //   // Simulação de pedido finalizado
    //   modal.style.display = 'flex';
    // });

    // modalClose.addEventListener('click', () => {
    //   modal.style.display = 'none';
    //   checkoutForm.reset();
    //   cart = {};
    //   renderCart();
    // });

    // window.addToCart = addToCart;
    // window.removeFromCart = removeFromCart;
    // window.changeQuantity = changeQuantity;

    // loadProducts();
    // renderProducts();
    // renderCart();
