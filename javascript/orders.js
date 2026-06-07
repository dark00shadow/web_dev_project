function formatShippingDestination(order) {
    const { municipality, wilaya, address } = order.shipping;
    const base = [municipality, wilaya].filter(Boolean).join(', ');
    if (address) return `${address} — ${base}, DZ`;
    return `${base}, DZ`;
}

function renderOrderReceipt(order) {
    const status = getOrderStatus(order);
    let statusLabel = ORDER_STATUS_LABELS[status] || status;
    if (statusLabel === "Preparing the command") {
        statusLabel = "Preparing Order";
    }

    const itemsHtml = order.items.map(item => {
        const lineTotal = (item.price * item.qty).toFixed(2);
        return `<li>${item.qty}x ${item.name} <span class="order-item-price">$${lineTotal}</span></li>`;
    }).join('');

    return `
        <article class="order-receipt" data-order-id="${order.id}">
            <section class="order-receipt-section order-info-section">
                <h2>Order Details</h2>
                <div class="order-meta">
                    <div class="order-meta-row">
                        <span class="order-meta-label">Order Number</span>
                        <span class="order-meta-value">${order.id}</span>
                    </div>
                    <div class="order-meta-row">
                        <span class="order-meta-label">Status</span>
                        <span class="order-status ${status}">${statusLabel}</span>
                    </div>
                    <div class="order-meta-row">
                        <span class="order-meta-label">Shipping to</span>
                        <span class="order-meta-value">${formatShippingDestination(order)}</span>
                    </div>
                    <div class="order-meta-row">
                        <span class="order-meta-label">Placed On</span>
                        <span class="order-meta-value">${new Date(order.placedAt).toLocaleString()}</span>
                    </div>
                </div>
            </section>
            <section class="order-receipt-section order-items-section">
                <h2>Items Purchased</h2>
                <ul class="order-items-list">${itemsHtml}</ul>
                <div class="order-total-row">
                    <span>Total Paid</span>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
            </section>
        </article>
    `;
}

function renderOrdersPage() {
    const listEl = document.getElementById('orders-list');
    if (!listEl) return;

    const orders = getConfirmedOrders();

    if (orders.length === 0) {
        listEl.innerHTML = `
            <div class="orders-empty">
                <p>You have no confirmed orders yet.</p>
                <p>Complete checkout to see your receipts here.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = orders.map(renderOrderReceipt).join('');
}

async function downloadHistoryPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const orders = getConfirmedOrders();

    if (!orders || orders.length === 0) return;

    doc.setFontSize(22);
    doc.text("Purchase History", 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Equinox Store — Generated on: ${new Date().toLocaleDateString()}`, 20, 27);
    
    let y = 40;

    orders.forEach((order) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 190, y);
        y += 10;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Order ID: ${order.id}`, 20, y);
        y += 7;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        let status = ORDER_STATUS_LABELS[getOrderStatus(order)] || getOrderStatus(order);
        if (status === "Preparing the command") status = "Preparing Order";
        
        doc.text(`Status: ${status}`, 20, y);
        doc.text(`Total Paid: $${order.total.toFixed(2)}`, 120, y);
        y += 7;
        
        doc.text(`Shipping: ${formatShippingDestination(order)}`, 20, y);
        y += 10;

        doc.text(`Placed On: ${new Date(order.placedAt).toLocaleString()}`, 20, y);
        y += 10;

        const itemsText = order.items.map(item => 
            `${item.qty}x ${item.name} ($${(item.price * item.qty).toFixed(2)})`
        ).join(', ');
        
        const splitItems = doc.splitTextToSize(`Items: ${itemsText}`, 160);
        doc.text(splitItems, 20, y);
        y += (splitItems.length * 5) + 15;
    });

    doc.save("Equinox_Order_History.pdf");
}

document.addEventListener('DOMContentLoaded', () => {
    renderOrdersPage();

    const downloadBtn = document.getElementById('download-history-btn');
    if (downloadBtn) {
        const orders = getConfirmedOrders();
        if (orders.length === 0) {
            downloadBtn.style.display = 'none';
        } else {
            downloadBtn.addEventListener('click', downloadHistoryPDF);
        }
    }
});
