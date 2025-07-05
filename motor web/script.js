document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const addItemBtn = document.getElementById('add-item-btn');
    const scanBtn = document.getElementById('scan-btn');
    const itemModal = document.getElementById('item-modal');
    const scanModal = document.getElementById('scan-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const itemForm = document.getElementById('item-form');
    const inventoryBody = document.getElementById('inventory-body');
    const manualEntryBtn = document.getElementById('manual-entry-btn');
    const useResultBtn = document.getElementById('use-result-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // Form elements
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-name');
    const itemCategoryInput = document.getElementById('item-category');
    const itemQuantityInput = document.getElementById('item-quantity');
    const itemPriceInput = document.getElementById('item-price');
    const itemSupplierInput = document.getElementById('item-supplier');
    const itemBarcodeInput = document.getElementById('item-barcode');
    const itemSkuInput = document.getElementById('item-sku');
    const itemDescriptionInput = document.getElementById('item-description');
    const itemImageInput = document.getElementById('item-image');
    const imagePreview = document.getElementById('image-preview-img');
    const imagePlaceholder = document.getElementById('image-preview');
    
    // Quantity buttons
    const increaseQtyBtn = document.getElementById('increase-qty');
    const decreaseQtyBtn = document.getElementById('decrease-qty');
    
    // Summary elements
    const totalItemsEl = document.getElementById('total-items');
    const totalValueEl = document.getElementById('total-value');
    const lowStockEl = document.getElementById('low-stock');
    const totalCategoriesEl = document.getElementById('total-categories');
    
    // Inventory data
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    let editMode = false;
    let currentItemId = null;
    let currentImageData = null;
    
    // Clear existing data when changing categories (uncomment if needed)
    // localStorage.removeItem('inventory');
    
    // Sample automotive parts data for demo
    if (inventory.length === 0) {
        inventory = [
            {
                id: 1,
                name: "Spark Plugs (Set of 4)",
                category: "Engine Components",
                quantity: 25,
                price: 1200.00,
                supplier: "AutoParts Inc.",
                barcode: "ENG-SPARK-001",
                sku: "ENG-001-SPARK",
                description: "Iridium spark plugs for most sedan models",
                image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3BhcmslMjBwbHVnfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"
            },
            {
                id: 2,
                name: "Shock Absorbers (Front Pair)",
                category: "Suspension",
                quantity: 8,
                price: 4500.00,
                supplier: "Suspension Pro",
                barcode: "SUS-SHOCK-045",
                sku: "SUS-045-SHOCK",
                description: "Premium shock absorbers for SUVs and trucks",
                image: "https://images.unsplash.com/photo-1632749307988-9cc5c3d15d0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2hvY2slMjBhYnNvcmJlcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60"
            },
            {
                id: 3,
                name: "LED Headlight Assembly",
                category: "Lighting",
                quantity: 5,
                price: 6500.00,
                supplier: "AutoLight Solutions",
                barcode: "LGT-HEAD-112",
                sku: "LGT-112-HEAD",
                description: "LED headlight assembly for modern vehicles",
                image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FyJTIwaGVhZGxpZ2h0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"
            }
        ];
        saveInventory();
    }
    
    // Format currency with PHP symbol and proper formatting
    function formatCurrency(amount) {
        return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // Initialize the app
    function init() {
        renderInventory();
        updateSummary();
        
        // Event listeners
        addItemBtn.addEventListener('click', openAddItemModal);
        scanBtn.addEventListener('click', openScanner);
        closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
        cancelBtn.addEventListener('click', closeModal);
        itemForm.addEventListener('submit', handleFormSubmit);
        manualEntryBtn.addEventListener('click', switchToManualEntry);
        menuToggle.addEventListener('click', toggleSidebar);
        
        // Image upload
        imagePlaceholder.addEventListener('click', () => itemImageInput.click());
        itemImageInput.addEventListener('change', handleImageUpload);
        
        // Quantity controls
        increaseQtyBtn.addEventListener('click', () => {
            itemQuantityInput.value = parseInt(itemQuantityInput.value) + 1;
        });
        
        decreaseQtyBtn.addEventListener('click', () => {
            const currentValue = parseInt(itemQuantityInput.value);
            if (currentValue > 0) {
                itemQuantityInput.value = currentValue - 1;
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === itemModal || e.target === scanModal) {
                closeModal();
            }
        });
    }
    
    // Toggle sidebar on mobile
    function toggleSidebar() {
        sidebar.classList.toggle('active');
    }
    
    // Handle image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
                document.querySelector('.upload-overlay').style.display = 'none';
                currentImageData = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Render inventory table with automotive categories
    function renderInventory() {
        inventoryBody.innerHTML = '';
        
        if (inventory.length === 0) {
            inventoryBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-box-open"></i>
                            <h3>No parts in inventory</h3>
                            <p>Add your first automotive part to get started</p>
                            <button class="btn btn-primary" id="add-first-item">Add Part</button>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('add-first-item').addEventListener('click', openAddItemModal);
            return;
        }
        
        inventory.forEach(item => {
            const row = document.createElement('tr');
            const value = item.quantity * item.price;
            
            // Determine stock status
            let statusClass, statusText;
            if (item.quantity === 0) {
                statusClass = 'status-out-of-stock';
                statusText = 'Out of Stock';
            } else if (item.quantity < 5) { // Lower threshold for auto parts
                statusClass = 'status-low-stock';
                statusText = 'Low Stock';
            } else {
                statusClass = 'status-in-stock';
                statusText = 'In Stock';
            }
            
            row.innerHTML = `
                <td class="item-image-cell">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="fas fa-car"></i>'}
                </td>
                <td>
                    <div class="product-info">
                        <h4>${item.name}</h4>
                        ${item.sku ? `<span class="product-sku">${item.sku}</span>` : ''}
                    </div>
                </td>
                <td>${item.category}</td>
                <td class="stock-cell">
                    <div class="quantity-control">
                        <button class="quantity-btn decrease-inventory" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase-inventory" data-id="${item.id}">+</button>
                    </div>
                </td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(value)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            inventoryBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
        
        // Add event listeners to quantity buttons
        document.querySelectorAll('.increase-inventory').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                adjustQuantity(id, 1);
            });
        });
        
        document.querySelectorAll('.decrease-inventory').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                adjustQuantity(id, -1);
            });
        });
    }
    
    // Adjust part quantity
    function adjustQuantity(id, amount) {
        const itemIndex = inventory.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            const newQuantity = inventory[itemIndex].quantity + amount;
            if (newQuantity >= 0) {
                inventory[itemIndex].quantity = newQuantity;
                saveInventory();
                renderInventory();
                updateSummary();
                
                // Show notification
                showNotification(`Quantity updated for ${inventory[itemIndex].name}`);
            }
        }
    }
    
    // Update summary cards
    function updateSummary() {
        const totalItems = inventory.length;
        const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const lowStock = inventory.filter(item => item.quantity < 5 && item.quantity > 0).length;
        const outOfStock = inventory.filter(item => item.quantity === 0).length;
        const categories = [...new Set(inventory.map(item => item.category))].length;
        
        totalItemsEl.textContent = totalItems;
        totalValueEl.textContent = formatCurrency(totalValue);
        lowStockEl.textContent = `${lowStock} (${outOfStock} out)`;
        totalCategoriesEl.textContent = categories;
    }
    
    // Modal functions
    function openAddItemModal() {
        editMode = false;
        currentItemId = null;
        currentImageData = null;
        document.getElementById('modal-title').textContent = 'Add New Part';
        itemForm.reset();
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        document.querySelector('.upload-overlay').style.display = 'flex';
        itemModal.style.display = 'block';
    }
    
    function openEditItemModal(item) {
        editMode = true;
        currentItemId = item.id;
        currentImageData = item.image || null;
        document.getElementById('modal-title').textContent = 'Edit Part';
        
        // Fill form with item data
        itemIdInput.value = item.id;
        itemNameInput.value = item.name;
        itemCategoryInput.value = item.category;
        itemQuantityInput.value = item.quantity;
        itemPriceInput.value = item.price;
        itemSupplierInput.value = item.supplier || '';
        itemBarcodeInput.value = item.barcode || '';
        itemSkuInput.value = item.sku || '';
        itemDescriptionInput.value = item.description || '';
        
        if (item.image) {
            imagePreview.src = item.image;
            imagePreview.style.display = 'block';
            document.querySelector('.upload-overlay').style.display = 'none';
        } else {
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            document.querySelector('.upload-overlay').style.display = 'flex';
        }
        
        itemModal.style.display = 'block';
    }
    
    function openScanner() {
        scanModal.style.display = 'block';
        document.getElementById('scan-result').innerHTML = `
            <div class="result-placeholder">
                <i class="fas fa-barcode"></i>
                <p>Scan result will appear here</p>
            </div>
        `;
        useResultBtn.disabled = true;
        startScanner();
    }
    
    function closeModal() {
        itemModal.style.display = 'none';
        scanModal.style.display = 'none';
        stopScanner();
    }
    
    // Scanner functions
    function startScanner() {
        const resultDiv = document.getElementById('scan-result');
        resultDiv.innerHTML = `
            <div class="scanning-animation">
                <i class="fas fa-search"></i>
                <p>Scanning...</p>
            </div>
        `;
        
        // Simulate finding a barcode after 2 seconds
        setTimeout(() => {
            const simulatedBarcode = "PART" + Math.floor(1000 + Math.random() * 9000);
            handleScanResult(simulatedBarcode);
        }, 2000);
    }
    
    function stopScanner() {
        clearTimeout(scanInterval);
    }
    
    function handleScanResult(barcode) {
        const resultDiv = document.getElementById('scan-result');
        resultDiv.innerHTML = `
            <div class="scan-success">
                <i class="fas fa-check-circle"></i>
                <h4>Barcode Scanned</h4>
                <p class="barcode-result">${barcode}</p>
                <p class="scan-message">Auto part found in database</p>
            </div>
        `;
        useResultBtn.disabled = false;
        
        useResultBtn.addEventListener('click', function() {
            const existingItem = inventory.find(item => 
                item.id.toString() === barcode || 
                (item.barcode && item.barcode === barcode)
            );
            
            if (existingItem) {
                openEditItemModal(existingItem);
            } else {
                openAddItemModal();
                itemNameInput.value = `Auto Part ${barcode}`;
                itemBarcodeInput.value = barcode;
                itemCategoryInput.value = "Other";
            }
            closeModal();
        });
    }
    
    function switchToManualEntry() {
        closeModal();
        openAddItemModal();
    }
    
    // Form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const item = {
            name: itemNameInput.value.trim(),
            category: itemCategoryInput.value.trim(),
            quantity: parseInt(itemQuantityInput.value),
            price: parseFloat(itemPriceInput.value),
            supplier: itemSupplierInput.value.trim() || null,
            barcode: itemBarcodeInput.value.trim() || null,
            sku: itemSkuInput.value.trim() || null,
            description: itemDescriptionInput.value.trim() || null,
            image: currentImageData || null
        };
        
        if (editMode) {
            // Update existing item
            item.id = currentItemId;
            updateItem(item);
            showNotification(`"${item.name}" updated successfully`);
        } else {
            // Add new item
            addItem(item);
            showNotification(`"${item.name}" added to inventory`);
        }
        
        closeModal();
    }
    
    // CRUD operations
    function addItem(item) {
        // Generate ID
        const ids = inventory.map(item => item.id);
        item.id = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        
        inventory.push(item);
        saveInventory();
        renderInventory();
        updateSummary();
    }
    
    function updateItem(updatedItem) {
        inventory = inventory.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        );
        
        saveInventory();
        renderInventory();
        updateSummary();
    }
    
    function deleteItem(id) {
        const item = inventory.find(item => item.id === id);
        if (item && confirm(`Are you sure you want to delete "${item.name}"?`)) {
            inventory = inventory.filter(item => item.id !== id);
            saveInventory();
            renderInventory();
            updateSummary();
            showNotification(`"${item.name}" deleted from inventory`);
        }
    }
    
    function saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }
    
    // Action handlers
    function handleEdit(e) {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        const item = inventory.find(item => item.id === id);
        
        if (item) {
            openEditItemModal(item);
        }
    }
    
    function handleDelete(e) {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        deleteItem(id);
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Initialize the app
    init();
});