// ========================================
// InvoiceChaser
// Simple client-side invoice tracker
// ========================================

let invoices = [];


// ========================================
// DOM Elements
// ========================================

const invoiceForm =
    document.getElementById("invoiceForm");

const customerInput =
    document.getElementById("customer");

const invoiceNumberInput =
    document.getElementById("invoiceNumber");

const amountInput =
    document.getElementById("amount");

const dueDateInput =
    document.getElementById("dueDate");

const invoiceTableBody =
    document.getElementById("invoiceTableBody");

const emptyState =
    document.getElementById("emptyState");

const invoiceTableContainer =
    document.getElementById("invoiceTableContainer");

const reminderSection =
    document.getElementById("reminderSection");

const reminderSubject =
    document.getElementById("reminderSubject");

const reminderMessage =
    document.getElementById("reminderMessage");

const copyButton =
    document.getElementById("copyButton");

const copyStatus =
    document.getElementById("copyStatus");

const totalInvoices =
    document.getElementById("totalInvoices");

const overdueInvoices =
    document.getElementById("overdueInvoices");

const overdueAmount =
    document.getElementById("overdueAmount");


// ========================================
// Set default date
// ========================================

const today = new Date();

const yyyy =
    today.getFullYear();

const mm =
    String(today.getMonth() + 1)
        .padStart(2, "0");

const dd =
    String(today.getDate())
        .padStart(2, "0");

dueDateInput.value =
    `${yyyy}-${mm}-${dd}`;


// ========================================
// Add Invoice
// ========================================

invoiceForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const customer =
            customerInput.value.trim();

        const invoiceNumber =
            invoiceNumberInput.value.trim();

        const amount =
            Number(amountInput.value);

        const dueDate =
            dueDateInput.value;


        if (!customer) {
            alert("Please enter the customer name.");
            return;
        }

        if (!invoiceNumber) {
            alert("Please enter the invoice number.");
            return;
        }

        if (!amount || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (!dueDate) {
            alert("Please select a due date.");
            return;
        }


        const invoice = {

            id:
                Date.now(),

            customer:
                customer,

            invoiceNumber:
                invoiceNumber,

            amount:
                amount,

            dueDate:
                dueDate
        };


        invoices.push(invoice);

        renderInvoices();

        invoiceForm.reset();

        dueDateInput.value =
            `${yyyy}-${mm}-${dd}`;
    }
);


// ========================================
// Calculate invoice status
// ========================================

function getInvoiceStatus(dueDate) {

    const today =
        new Date();

    today.setHours(0, 0, 0, 0);

    const due =
        new Date(dueDate);

    due.setHours(0, 0, 0, 0);


    const difference =
        today - due;

    const days =
        Math.round(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (days < 0) {

        return {

            type: "green",

            label:
                `Due in ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`,

            daysLate: 0
        };
    }


    if (days === 0) {

        return {

            type: "yellow",

            label:
                "Due today",

            daysLate: 0
        };
    }


    if (days <= 30) {

        return {

            type: "red",

            label:
                `${days} day${days === 1 ? "" : "s"} overdue`,

            daysLate: days
        };
    }


    return {

        type: "dark",

        label:
            `${days} days overdue`,

        daysLate: days
    };
}


// ========================================
// Render invoices
// ========================================

function renderInvoices() {

    invoiceTableBody.innerHTML = "";


    if (invoices.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );

        invoiceTableContainer.classList.add(
            "hidden"
        );

        reminderSection.classList.add(
            "hidden"
        );

        updateDashboard();

        return;
    }


    emptyState.classList.add(
        "hidden"
    );

    invoiceTableContainer.classList.remove(
        "hidden"
    );


    invoices.forEach(
        function (invoice) {

            const status =
                getInvoiceStatus(
                    invoice.dueDate
                );


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(invoice.customer)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(invoice.invoiceNumber)}
                </td>

                <td>
                    $${invoice.amount.toFixed(2)}
                </td>

                <td>
                    ${formatDate(invoice.dueDate)}
                </td>

                <td>
                    <span class="status status-${status.type}">
                        ${status.label}
                    </span>
                </td>

                <td>
                    <button
                        class="action-button"
                        onclick="showReminder(${invoice.id})"
                    >
                        Follow up
                    </button>
                </td>
            `;


            invoiceTableBody.appendChild(row);
        }
    );


    updateDashboard();
}


// ========================================
// Dashboard
// ========================================

function updateDashboard() {

    totalInvoices.textContent =
        invoices.length;


    let overdueCount = 0;

    let overdueTotal = 0;


    invoices.forEach(
        function (invoice) {

            const status =
                getInvoiceStatus(
                    invoice.dueDate
                );


            if (status.daysLate > 0) {

                overdueCount++;

                overdueTotal +=
                    invoice.amount;
            }
        }
    );


    overdueInvoices.textContent =
        overdueCount;


    overdueAmount.textContent =
        `$${overdueTotal.toFixed(2)}`;
}


// ========================================
// Show reminder
// ========================================

function showReminder(id) {

    const invoice =
        invoices.find(
            function (item) {

                return item.id === id;
            }
        );


    if (!invoice) {
        return;
    }


    const status =
        getInvoiceStatus(
            invoice.dueDate
        );


    const customer =
        invoice.customer;

    const invoiceNumber =
        invoice.invoiceNumber;

    const amount =
        invoice.amount;

    const dueDate =
        formatDate(
            invoice.dueDate
        );

    const daysLate =
        status.daysLate;


    let subject;

    let message;


    // -----------------------------
    // Not overdue
    // -----------------------------

    if (daysLate === 0) {

        subject =
            `Friendly reminder - Invoice ${invoiceNumber}`;


        message =
`Hi ${customer},

I hope you're doing well.

This is a friendly reminder that invoice ${invoiceNumber} for $${amount.toFixed(2)} is due on ${dueDate}.

Please let me know if you have any questions.

Thank you!`;
    }


    // -----------------------------
    // 1-7 days overdue
    // -----------------------------

    else if (daysLate <= 7) {

        subject =
            `Payment reminder - Invoice ${invoiceNumber}`;


        message =
`Hi ${customer},

I wanted to follow up regarding invoice ${invoiceNumber} for $${amount.toFixed(2)}.

The invoice was due on ${dueDate} and appears to still be outstanding.

Could you please let me know when payment is expected?

Thank you!`;
    }


    // -----------------------------
    // 8-30 days overdue
    // -----------------------------

    else if (daysLate <= 30) {

        subject =
            `Payment overdue - Invoice ${invoiceNumber}`;


        message =
`Hi ${customer},

I'm following up regarding invoice ${invoiceNumber} for $${amount.toFixed(2)}.

The invoice was due on ${dueDate} and is now ${daysLate} days overdue.

Please let me know the status of the payment or if there is anything you need from me.

Thank you for your attention to this.`;
    }


    // -----------------------------
    // 30+ days
    // -----------------------------

    else {

        subject =
            `Urgent payment follow-up - Invoice ${invoiceNumber}`;


        message =
`Hi ${customer},

I'm following up again regarding invoice ${invoiceNumber} for $${amount.toFixed(2)}.

The invoice was due on ${dueDate} and is now ${daysLate} days overdue.

Please let me know when payment can be expected.

If there is an issue with the invoice, please let me know so we can resolve it.

Thank you.`;
    }


    reminderSubject.value =
        subject;

    reminderMessage.value =
        message;


    reminderSection.classList.remove(
        "hidden"
    );


    copyStatus.textContent = "";


    reminderSection.scrollIntoView({
        behavior: "smooth"
    });
}


// ========================================
// Copy reminder
// ========================================

copyButton.addEventListener(
    "click",
    async function () {

        const subject =
            reminderSubject.value;

        const message =
            reminderMessage.value;


        const text =
            `${subject}\n\n${message}`;


        try {

            await navigator.clipboard.writeText(
                text
            );

            copyStatus.textContent =
                "✓ Message copied. You can now paste it into your email or messaging app.";

        } catch (error) {

            reminderMessage.select();

            document.execCommand(
                "copy"
            );

            copyStatus.textContent =
                "✓ Message copied.";
        }
    }
);


// ========================================
// Format date
// ========================================

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// ========================================
// Security helper
// ========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}


// ========================================
// Initial render
// ========================================

renderInvoices();
