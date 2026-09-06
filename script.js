// ================================
// InvoiceChaser
// ================================

// Load saved invoices from browser
let invoices = JSON.parse(localStorage.getItem("invoicechaser_invoices")) || [];

const form = document.getElementById("invoiceForm");
const customerInput = document.getElementById("customer");
const invoiceInput = document.getElementById("invoiceNumber");
const amountInput = document.getElementById("amount");
const dueDateInput = document.getElementById("dueDate");

const invoicesBody = document.getElementById("invoicesBody");

const totalInvoicesEl = document.getElementById("totalInvoices");
const overdueInvoicesEl = document.getElementById("overdueInvoices");
const overdueAmountEl = document.getElementById("overdueAmount");

const reminderSection = document.getElementById("reminderSection");
const reminderCustomer = document.getElementById("reminderCustomer");
const reminderSubject = document.getElementById("reminderSubject");
const reminderMessage = document.getElementById("reminderMessage");
const copyReminderBtn = document.getElementById("copyReminder");


// ================================
// Save invoices
// ================================

function saveInvoices() {
    localStorage.setItem(
        "invoicechaser_invoices",
        JSON.stringify(invoices)
    );
}


// ================================
// Calculate invoice status
// ================================

function getInvoiceStatus(dueDate) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate + "T00:00:00");
    due.setHours(0, 0, 0, 0);

    const difference =
        Math.floor((today - due) / (1000 * 60 * 60 * 24));

    if (difference > 0) {

        return {
            type: "overdue",
            text: `Overdue ${difference} day${difference === 1 ? "" : "s"}`,
            daysLate: difference
        };

    }

    if (difference === 0) {

        return {
            type: "today",
            text: "Due today",
            daysLate: 0
        };

    }

    const daysUntilDue = Math.abs(difference);

    return {
        type: "upcoming",
        text: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`,
        daysLate: 0
    };
}


// ================================
// Render invoices
// ================================

function renderInvoices() {

    invoicesBody.innerHTML = "";

    if (invoices.length === 0) {

        invoicesBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No invoices yet.
                </td>
            </tr>
        `;

        updateDashboard();
        return;
    }

    invoices.forEach((invoice, index) => {

        const status = getInvoiceStatus(invoice.dueDate);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(invoice.customer)}</td>

            <td>${escapeHTML(invoice.invoiceNumber)}</td>

            <td>$${Number(invoice.amount).toFixed(2)}</td>

            <td>${invoice.dueDate}</td>

            <td>
                <span class="status ${status.type}">
                    ${status.text}
                </span>
            </td>

            <td>

                <button
                    class="small-btn reminder-btn"
                    onclick="showReminder(${index})"
                >
                    Reminder
                </button>

                <button
                    class="small-btn delete-btn"
                    onclick="deleteInvoice(${index})"
                >
                    Delete
                </button>

            </td>
        `;

        invoicesBody.appendChild(row);
    });

    updateDashboard();
}


// ================================
// Dashboard
// ================================

function updateDashboard() {

    let overdueCount = 0;
    let overdueAmount = 0;

    invoices.forEach(invoice => {

        const status = getInvoiceStatus(invoice.dueDate);

        if (status.type === "overdue") {

            overdueCount++;

            overdueAmount += Number(invoice.amount);
        }
    });

    totalInvoicesEl.textContent = invoices.length;

    overdueInvoicesEl.textContent = overdueCount;

    overdueAmountEl.textContent =
        "$" + overdueAmount.toFixed(2);
}


// ================================
// Add invoice
// ================================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const customer = customerInput.value.trim();
    const invoiceNumber = invoiceInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const dueDate = dueDateInput.value;

    if (!customer || !invoiceNumber || !amount || !dueDate) {

        alert("Please fill in all fields.");

        return;
    }

    const invoice = {

        customer: customer,

        invoiceNumber: invoiceNumber,

        amount: amount,

        dueDate: dueDate,

        createdAt: new Date().toISOString()
    };

    invoices.push(invoice);

    saveInvoices();

    renderInvoices();

    form.reset();

    reminderSection.style.display = "none";
});


// ================================
// Delete invoice
// ================================

function deleteInvoice(index) {

    const invoice = invoices[index];

    const confirmed = confirm(
        `Delete invoice ${invoice.invoiceNumber}?`
    );

    if (!confirmed) {
        return;
    }

    invoices.splice(index, 1);

    saveInvoices();

    renderInvoices();

    reminderSection.style.display = "none";
}


// ================================
// Generate reminder
// ================================

function showReminder(index) {

    const invoice = invoices[index];

    const status = getInvoiceStatus(invoice.dueDate);

    reminderCustomer.textContent =
        invoice.customer;

    let subject = "";
    let message = "";

    if (status.daysLate <= 0) {

        subject =
            `Payment reminder - Invoice ${invoice.invoiceNumber}`;

        message =
`Hi ${invoice.customer},

Just a friendly reminder that invoice ${invoice.invoiceNumber} for $${Number(invoice.amount).toFixed(2)} is due today.

Please let me know if you have any questions.

Thank you.`;

    } else if (status.daysLate <= 7) {

        subject =
            `Payment reminder - Invoice ${invoice.invoiceNumber}`;

        message =
`Hi ${invoice.customer},

I wanted to follow up regarding invoice ${invoice.invoiceNumber} for $${Number(invoice.amount).toFixed(2)}, which is now ${status.daysLate} day${status.daysLate === 1 ? "" : "s"} overdue.

Could you please let me know when we can expect payment?

Thank you.`;

    } else {

        subject =
            `Overdue invoice - ${invoice.invoiceNumber}`;

        message =
`Hi ${invoice.customer},

I'm following up regarding invoice ${invoice.invoiceNumber} for $${Number(invoice.amount).toFixed(2)}.

The invoice is now ${status.daysLate} days overdue.

Could you please arrange payment at your earliest convenience, or let me know if there is any issue with the invoice?

Thank you.`;
    }

    reminderSubject.value = subject;

    reminderMessage.value = message;

    reminderSection.style.display = "block";

    reminderSection.scrollIntoView({
        behavior: "smooth"
    });
}


// ================================
// Copy reminder
// ================================

copyReminderBtn.addEventListener("click", async function() {

    const subject = reminderSubject.value;

    const message = reminderMessage.value;

    const text =
`Subject: ${subject}

${message}`;

    try {

        await navigator.clipboard.writeText(text);

        copyReminderBtn.textContent = "Copied!";

        setTimeout(() => {

            copyReminderBtn.textContent =
                "Copy Reminder";

        }, 1500);

    } catch (error) {

        alert(
            "Copy failed. Please select and copy the message manually."
        );
    }
});


// ================================
// Escape HTML
// ================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ================================
// Initial load
// ================================

renderInvoices();
