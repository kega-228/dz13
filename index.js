// Завдання: Редактор товарів (IndexedDB)
const addProductBtn = document.getElementById('add-product-btn');
const modal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');
const categoryInput = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const modalSaveBtn = document.getElementById('modal-save-btn');
const productsTableBody = document.getElementById('products-table-body');
const editProductModal = document.getElementById('editProductModal');
const editProductForm = document.getElementById('editProductForm');
const nameEditInput = document.getElementById('nameEdit');
const priceEditInput = document.getElementById('priceEdit');
const quantityEditInput = document.getElementById('quantityEdit');
const categoryEditInput = document.getElementById('categoryEdit');
const descriptionEditInput = document.getElementById('descriptionEdit');
const modalSaveBtnEdit = document.getElementById('modal-save-btn-edit');
const modalCancelBtnEdit = document.getElementById('modal-cancel-btn-edit');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const deleteConfirmText = document.getElementById('deleteConfirmText');
const imageInput = document.getElementById('image');

// Частина 1. Базовий редактор
// Дані товару:
//     - id — унікальний ідентифікатор, генерується автоматично;
// - name — назва;
// - price — ціна;
// - quantity — кількість на складі;
// - category — категорія;
// - description — опис;
// - createdAt — дата створення;
// - updatedAt — дата останньої зміни.

class Product{
    constructor(name, price, quantity, category, description, image){
        this.name = name;
        this.price = price;
        this.quantity = quantity;
        this.category = category;
        this.description = description;
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
        this.image = image;
    }
}

//     Зберігання
// - Усі товари зберігаються в IndexedDB: база shopDb, сховище products.
// - Ключем сховища є поле id.
// - Після перезавантаження сторінки всі товари мають зберігатися.
// - Роботу з базою винесіть в окремі функції: openDb(), addProduct(product), updateProduct(product), deleteProduct(id), getProduct(id), getAllProducts().
// - Кожна функція повертає Promise, щоб її можна було використовувати з async/await.
function openDb(){
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('shopDb', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (db.objectStoreNames.contains('products')) {
                db.deleteObjectStore('products');
            }
            const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        }

        request.onerror = (event) => reject(event.target.error);
        request.onsuccess = (event) => resolve(event.target.result);
    })
}
async function addProduct(product) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const request = db.transaction('products', 'readwrite')
            .objectStore('products')
            .add(product);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}
async function updateProduct(product) {
    return new Promise(async (resolve, reject) => {
        const db = await openDb();
        const transaction = db.transaction('products', 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.put(product);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        }

        request.onerror = (event) => {
            reject(event.target.error);
        }
    })
}
async function deleteProduct(id) {
    return new Promise(async (resolve, reject) => {
        const db = await openDb();
        const transaction = db.transaction('products', 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.delete(id);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        }

        request.onerror = (event) => {
            reject(event.target.error);
        }
    })
}

async function getAllProducts() {
    return new Promise(async (resolve, reject) => {
        const db = await openDb();
        const transaction = db.transaction('products', 'readonly');
        const store = transaction.objectStore('products');
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        }

        request.onerror = (event) => {
            reject(event.target.error);
        }
    })
}

async function getProduct(id) {
    return new Promise(async (resolve, reject) => {
        const db = await openDb();
        const transaction = db.transaction('products', 'readonly');
        const store = transaction.objectStore('products');
        const request = store.get(id);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        }

        request.onerror = (event) => {
            reject(event.target.error);
        }
    })
}
// Додавання товару
// - Кнопка «Додати товар» відкриває форму в модальному вікні.
// - Правила валідації полів:
//     - назва — обов'язкова, від 2 до 100 символів;
// - ціна — обов'язкова, число більше 0, не більше двох знаків після коми;
// - кількість — ціле число, 0 або більше;
// - категорія — вибір зі списку (select), наприклад: «Електроніка», «Одяг», «Продукти», «Книги», «Інше»;
// - опис — необов'язковий, до 500 символів.
// - Поле з помилкою підсвічується червоним, а під ним з'являється пояснення. Помилка зникає, щойно введено коректне значення.
// - Кнопка «Зберегти» неактивна, поки є помилки.
// - Після збереження модальне вікно закривається, а товар з'являється в списку без перезавантаження сторінки.
addProductBtn.addEventListener('click', () => {
    modal.style.display = 'block';
})
function validate(){
    if(nameInput.value.length < 2 || nameInput.value.length > 100){
        nameInput.classList.add('error');
        nameInput.nextElementSibling.textContent = 'Назва повинна бути від 2 до 100 символів';
        return false;
    }
    if(!/^\d+([.,]\d{1,2})?$/.test(priceInput.value) || parseFloat(priceInput.value.replace(',', '.')) <= 0){
        priceInput.classList.add('error');
        priceInput.nextElementSibling.textContent = 'Ціна повинна бути більше 0';
        return false;
    }
    if(!/^\d+$/.test(quantityInput.value)){
        quantityInput.classList.add('error');
        quantityInput.nextElementSibling.textContent = 'Кількість повинна бути більше 0';
        return false;
    }
    if(!categoryInput.value){
        categoryInput.classList.add('error');
        categoryInput.nextElementSibling.textContent = 'Оберіть категорію';
        return false;
    }
    if(descriptionInput.value.length > 500){
        descriptionInput.classList.add('error');
        descriptionInput.nextElementSibling.textContent = 'Опис повинен бути не більше 500 символів';
        return false;
    }
    if(!imageInput.files.length){
        imageInput.classList.add('error');
        imageInput.nextElementSibling.textContent = 'Оберіть зображення';
        return false;
    }
    return true;
}
function validateEdit(){
    if(nameEditInput.value.length < 2 || nameEditInput.value.length > 100){
        nameEditInput.classList.add('error');
        nameEditInput.nextElementSibling.textContent = 'Назва повинна бути від 2 до 100 символів';
        return false;
    }
    if(!/^\d+([.,]\d{1,2})?$/.test(priceEditInput.value) || parseFloat(priceEditInput.value.replace(',', '.')) <= 0){
        priceEditInput.classList.add('error');
        priceEditInput.nextElementSibling.textContent = 'Ціна повинна бути більше 0';
        return false;
    }
    if(!/^\d+$/.test(quantityEditInput.value)){
        quantityEditInput.classList.add('error');
        quantityEditInput.nextElementSibling.textContent = 'Кількість повинна бути цілим числом 0 або більше';
        return false;
    }
    if(!categoryEditInput.value){
        categoryEditInput.classList.add('error');
        categoryEditInput.nextElementSibling.textContent = 'Оберіть категорію';
        return false;
    }
    if(descriptionEditInput.value.length > 500){
        descriptionEditInput.classList.add('error');
        descriptionEditInput.nextElementSibling.textContent = 'Опис повинен бути не більше 500 символів';
        return false;
    }
    return true;
}

modal.addEventListener("input", () =>{
    const inputs = modal.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.remove('error');
        input.nextElementSibling.textContent = '';
    })
    modalSaveBtn.disabled = !validate();
});
editProductModal.addEventListener('input', () => {
    const inputs = editProductModal.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.remove('error');
        if (input.nextElementSibling) input.nextElementSibling.textContent = '';
    })
    modalSaveBtnEdit.disabled = !validateEdit();
});

modalSaveBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!validate()) {
        return;
    }



    const newProduct = new Product(
        nameInput.value.trim(),
        parseFloat(priceInput.value),
        parseInt(quantityInput.value, 10),
        categoryInput.value,
        descriptionInput.value.trim(),

    );

    try {
        await addProduct(newProduct);

        addProductForm.reset();
        modalSaveBtn.disabled = true;
        modal.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        modal.querySelectorAll('span.error-message').forEach(el => el.textContent = '');

        modal.style.display = 'none';
        renderProducts();

    } catch (error) {
        console.error('Помилка при збереженні товару:', error);
    }
    modalSaveBtn.disabled = true;
});

modalSaveBtnEdit.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!validateEdit()) return;

    const id = parseInt(modalSaveBtnEdit.dataset.editId, 10);
    const updatedProduct = {
        id: id,
        name: nameEditInput.value.trim(),
        price: parseFloat(priceEditInput.value.replace(',', '.')),
        quantity: parseInt(quantityEditInput.value, 10),
        category: categoryEditInput.value,
        description: descriptionEditInput.value.trim(),
        createdAt: modalSaveBtnEdit.dataset.createdAt,
        updatedAt: new Date().toISOString()
    };

    try {
        await updateProduct(updatedProduct);
        editProductModal.style.display = 'none';
        modalSaveBtnEdit.disabled = true;
        renderProducts();
    } catch (error) {
        console.error('Помилка при оновленні товару:', error);
    }
});
modalCancelBtnEdit.addEventListener('click', () => {
    editProductModal.style.display = 'none';
    modalSaveBtnEdit.disabled = true;
});
confirmDeleteBtn.addEventListener('click', async () => {
    const id = parseInt(confirmDeleteBtn.dataset.deleteId, 10);
    try {
        await deleteProduct(id);
        deleteConfirmModal.style.display = 'none';
        renderProducts();
    } catch (error) {
        console.error('Помилка при видаленні товару:', error);
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirmModal.style.display = 'none';
});

// Список товарів
//
// - Кожен товар показується карткою або рядком таблиці з полями: назва, категорія, ціна (у форматі «1 250,00 грн») і кількість.
// - Якщо кількість дорівнює 0, біля товару показується позначка «Немає в наявності».
// - Біля кожного товару розміщені кнопки «Редагувати» та «Видалити».
// - Якщо товарів немає, показується повідомлення «Товарів поки немає».
async function renderProducts() {
    const products = await getAllProducts();
    productsTableBody.innerHTML = '';
    if (products.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="4">Товарів поки немає</td></tr>';
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        const deleteButton = document.createElement('button');
        const editButton = document.createElement('button');
        deleteButton.textContent = 'Видалити';
        deleteButton.addEventListener('click', () => {
            deleteConfirmText.textContent = `Видалити товар "${p.name}"?`;
            confirmDeleteBtn.dataset.deleteId = p.id;
            deleteConfirmModal.style.display = 'block';
        });
        editButton.textContent = 'Редагувати';
        editButton.addEventListener('click', async () => {
            const product = await getProduct(p.id);
            if (!product) return;

            nameEditInput.value = product.name;
            priceEditInput.value = product.price;
            quantityEditInput.value = product.quantity;
            categoryEditInput.value = product.category;
            descriptionEditInput.value = product.description ?? '';

            modalSaveBtnEdit.disabled = true;
            modalSaveBtnEdit.dataset.editId = product.id;
            modalSaveBtnEdit.dataset.createdAt = product.createdAt;

            editProductModal.style.display = 'block';
        });
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${p.price} грн</td>
            <td>${p.quantity}</td>
        `;
        tr.appendChild(deleteButton);
        tr.appendChild(editButton);
        productsTableBody.appendChild(tr);
    });
}
// Частина 2. Зображення товару
//
// - У форму додайте можливість завантажити зображення товару.
// - Після вибору файлу показується мініатюра з червоною кнопкою-хрестиком для видалення.
// - Перед збереженням зображення зменшується через canvas: до 600 px за довшою стороною, формат JPEG.
// - Зображення зберігається в IndexedDB як Blob (через canvas.toBlob()), а не як base64-рядок.
// - У списку для показу зображення використовуйте URL.createObjectURL().
// - Після перемальовування списку звільняйте старі адреси через URL.revokeObjectURL().
// - Під час редагування поточне зображення показується у формі. Його можна видалити або замінити.
// - Якщо зображення немає, показується заглушка (іконка або сірий прямокутник).
//
// Частина 3. Пошук, фільтрація, сортування
//
// - Створіть індекси у сховищі: category, price, nameLower (назва в нижньому регістрі).
// - Над списком розмістіть панель із такими елементами:
//     1. Пошук за назвою: товари фільтруються під час введення тексту, без кнопки. Пошук не чутливий до регістру.
// 2. Фільтр за категорією: select з варіантом «Усі категорії».
// 3. Фільтр за ціною «від — до».
// 4. Сортування: за назвою, за ціною (зростання/спадання), за датою додавання.
// - Фільтр за категорією й ціною має використовувати індекси та IDBKeyRange. Решту умов можна фільтрувати в JavaScript.
// - Біля списку показується кількість знайдених товарів: «Знайдено: 12 з 40».
// - Під час пошуку збіги в назві виділяються кольором.
renderProducts();

// Редагування
//
// - Кнопка «Редагувати» відкриває ту саму форму, що й для додавання, але з уже заповненими поточними даними товару.
//
// - Заголовок модального вікна змінюється на «Редагування товару».
//
// - Валідація працює так само, як при додаванні.
//
// - Після збереження оновлюється поле updatedAt, а картка в списку оновлюється.
//
// - Кнопка «Скасувати» закриває вікно без змін.
//
//     Видалення
//
// - Кнопка «Видалити» відкриває вікно підтвердження: «Видалити товар "Назва"?» з кнопками «Видалити» і «Скасувати».
//
// - Після підтвердження товар видаляється з бази і зі списку.
//