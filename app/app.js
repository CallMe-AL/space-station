// *** header functionality ***
const header = document.querySelector('.header');
const sidebarBtn = document.querySelector('.sidebar-btn');
const closeSidebarBtn = document.querySelector('.close-btn');
const sidebarContainer = document.querySelector('.sidebar__container');

let lastScrollTop = window.pageYOffset;

window.addEventListener('scroll', function() {
    const scroll = window.pageYOffset;
    
    if (scroll - lastScrollTop > 150) {
        header.classList.add('hide-header');
        lastScrollTop = scroll;
    } 
    
    if (scroll - lastScrollTop < -150) {
        header.classList.remove('hide-header');  
        lastScrollTop = scroll;      
    }
});

sidebarBtn.addEventListener('click', () => {
  if (!sidebarContainer.classList.contains('open')) {
    sidebarContainer.classList.add('open');
    sidebarBtn.innerHTML = `<i class="fas fa-times"></i>`;
    sidebarBtn.setAttribute('aria-label', 'close sidebar');
  } else {
    sidebarContainer.classList.remove('open');
    sidebarBtn.innerHTML = `<i class="fas fa-bars"></i>`;
    sidebarBtn.setAttribute('aria-label', 'open sidebar');
  }
  
});

// scroll to products functionality
const skipBtn = document.querySelector('.title-btn');
const productsHead = document.getElementById('products');

skipBtn.addEventListener('click', () => {

  window.scrollTo({
    top: productsHead.offsetTop,
    left: 0,
    behavior: 'smooth'
  });
});

// featured item functionality
const textContainer = document.querySelector('.text-container');
const itemDesc = document.querySelector('.item-desc');
const closeFeaturedBtn = document.querySelector('.close-featured-btn');

textContainer.addEventListener('click', () => {
  itemDesc.classList.add('item-visible');
});
closeFeaturedBtn.addEventListener('click', () => {
  itemDesc.classList.remove('item-visible');
});

// *** cart / product functionality ***
const productContainer = document.querySelector('.products-container');
const shoppingCart = document.querySelector('.shopping-cart');
const cartInfo = document.querySelector('.cart-sidebar');
const cartOverlay = document.querySelector('.cart-overlay');
const cartCloseBtn = document.querySelector('.cart-close-btn');
const cartContent = document.querySelector('.cart-content');
const cartPrice = document.querySelector('.cart-total');
const cartItems = document.querySelector('.shopping-cart__items');
const clearCartBtn = document.querySelector('.clear-cart-btn');
const prodBtnContainer = document.querySelector('.product-btn-container');

let cart = [];
let buttonsDOM = [];
let categoryButtons = ['all'];

class Products {
  async getProducts() {
    try {
      let result = await fetch('products.json');
      let data = await result.json();

      let products = data.items;

      products = products.map(item => {
        const {id} = item.sys;
        const {title, price, desc, category} = item.fields;
        const image = item.fields.image.fields.file.url;

        return {id, title, price, desc, category, image};
      });

      return products;
      
    } catch (e) {
      console.log(e);
    }
  }
}

class UI {
  displayProducts(products) {
    let result = '';
    this.sortProducts(products);
    products.forEach(product => {
      result += `<!-- product -->
      <div class="product">
        <div class="product-head">
          <p class="product-name">${product.title}</p>
          <p class="product-price">$${product.price}</p>
        </div>
        <div class="img-container">
          <img src="${product.image}" alt="${product.title}" class="product-img">
          <div class="product-desc" data-id=${product.id}>${product.desc}</div>
        </div>
        <div class="product-footer">
          <button class="info-btn" type="button" data-id=${product.id}>Info</button>
          <button class="cart-btn" type="button" data-id="${product.id}">Add to Cart <i class="fas fa-cart-plus"></i></button>
        </div>        
      </div>
      <!-- end of product -->`
    });
    
    productContainer.innerHTML = result;
  }

  getCategoryButtons(products) {

    products.forEach(product => {
      if (!categoryButtons.includes(product.category)) {
        categoryButtons.push(product.category);
      }
    });

    categoryButtons.forEach(category => {
      prodBtnContainer.innerHTML += `<button class="product-btn" type="button" data-id="${category}">${category}</button>`;
    });

    const btns = document.querySelectorAll('.product-btn');

    btns.forEach(btn => {
      if (btn.dataset.id == 'all') {
        btn.classList.add('active');
      }
    });

    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.id;

        btns.forEach(btn => {
          if (btn.classList.contains('active')) {
            btn.classList.remove('active');
          }
        });

        const currentCategory = products.filter(product => {
          if (product.category == category) {
            return product;
          }
        });

        if (category == 'all') {
          this.displayProducts(products);
          this.getBagButtons();
          this.showProductInfo();
          e.target.classList.add('active');
        } else {
          this.displayProducts(currentCategory);
          this.getBagButtons();
          this.showProductInfo();
          e.target.classList.add('active');
        }
      });
    });
    
  }

  sortProducts(products) {
    products.sort(function(a, b) {
      let nameA = a.title.toUpperCase();
      let nameB = b.title.toUpperCase();

      if (nameA > nameB) {
        return 1;
      }
      if (nameA < nameB) {
        return -1;
      }
      return 0;
    });
  }

  getBagButtons() {
    const cartBtns = [...document.querySelectorAll('.cart-btn')];
    buttonsDOM = cartBtns;

    cartBtns.forEach(btn => {
      let id = btn.dataset.id;
      let inCart = cart.find(item => item.id == id);

      if (inCart) {
        btn.innerText = 'In Cart';
        btn.disabled = true;
      }

      // adding to shopping cart
      btn.addEventListener('click', (e) => {
        buttonsDOM.forEach(btn => {
          if (btn.dataset.id == id) {
            btn.innerHTML = "In Cart";
            btn.disabled = true;
          }
        });

        let cartItem = {...Storage.getProduct(id), amount:1};
        cart.push(cartItem);
        Storage.saveCart(cart);
        this.setCartValues(cart);
        this.updateCartItems(cartItem);
        this.showCart();
      });
    })
  }

  showProductInfo() {
    const infoBtns = [...document.querySelectorAll('.info-btn')];
    const productDescs = [...document.querySelectorAll('.product-desc')];

    infoBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        
        let targetDesc = productDescs.find(item => item.dataset.id == e.target.dataset.id);

        productDescs.forEach(desc => {
          if (desc !== targetDesc) {
            desc.classList.remove('visible');
          }
        });
        targetDesc.classList.toggle('visible');
          
      });

    });
  }

  setUpAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);    
    shoppingCart.addEventListener('click', this.showCart);
    cartCloseBtn.addEventListener('click', this.hideCart);
  }

  populateCart(cart) {
    cart.forEach(item => {
      this.updateCartItems(item);
    });
  }

  setCartValues(cart) {
    let totalPrice = 0;
    let itemTotal = 0;

    cart.forEach(item => {
      totalPrice += item.price * item.amount;
      itemTotal += item.amount;
    });

    cartPrice.textContent = parseFloat(totalPrice).toFixed(2);
    cartItems.textContent = itemTotal;
  }

  updateCartItems(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
            <img src=${item.image} alt=${item.title}>
            <div>
              <h3>${item.title}</h3>
              <h4>$${item.price}</h4>
              <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <span class="item-amount">${item.amount}</span>
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>`;
    cartContent.appendChild(div);
  }

  showCart() {
    cartInfo.classList.add('display');
    cartOverlay.classList.add('visible-overlay');
  }

  hideCart() {
    cartInfo.classList.remove('display');
    cartOverlay.classList.remove('visible-overlay');

  }

  // setting cart logic
  cartLogic() {

    clearCartBtn.addEventListener('click', () => {
      this.clearCartItems(cart);
    });

    cartContent.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-item')) {
        cartContent.removeChild(e.target.parentElement.parentElement);
        this.removeCartItem(e.target.dataset.id);
      } else if (e.target.classList.contains('fa-chevron-up')) {
        let tempItem = cart.find(item => item.id == e.target.dataset.id);
        tempItem.amount++;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        e.target.nextElementSibling.innerText = tempItem.amount;
      } else if (e.target.classList.contains('fa-chevron-down')) {
        let tempItem = cart.find(item => item.id == e.target.dataset.id);
        tempItem.amount--;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          e.target.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(e.target.parentElement.parentElement);
          this.removeCartItem(e.target.dataset.id);
          if (cartContent.children.length == 0) {
            this.hideCart();
          }
        }
        
      }
    });
  }

  // clear cart
  clearCartItems(cart) {
    cart.forEach(item => {
      this.removeCartItem(item.id);
    });

    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }

    this.hideCart();

  }

  // remove cart item
  removeCartItem(id) {
    cart = cart.filter(item => item.id != id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    buttonsDOM.forEach(btn => {
      if (btn.dataset.id == id) {
        btn.disabled = false;
        btn.innerHTML = `Add to Cart <i class="fas fa-cart-plus"></i>`;
      }
    });
    
  }
  
}

class Storage {
  static saveProducts(products) {
    localStorage.setItem("spaceProducts", JSON.stringify(products)); 
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("spaceProducts"));
    return products.find(product => product.id == id);
  }

  static saveCart(cart) {
    localStorage.setItem("spaceCart", JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem("spaceCart") ? JSON.parse(localStorage.getItem("spaceCart")) : [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI();
  const products = new Products();

  ui.setUpAPP();

  products.getProducts().then(products => {
    ui.displayProducts(products);
    ui.getCategoryButtons(products);
    Storage.saveProducts(products);
  }).then( () => {
    ui.getBagButtons();
    ui.cartLogic();
    ui.showProductInfo();
  }).catch(errorMessage => {
    console.log(errorMessage);
  });
});