// ==========================================
// InvoiceChaser
// ==========================================


// ==========================================
// Load saved invoices
// ==========================================

let invoices = [];

try {

    invoices =
        JSON.parse(
            localStorage.getItem(
                "invoicechaser_invoices"
            )
        ) || [];

} catch (error) {

    invoices = [];
}


// Current filter
let currentFilter = "all";


// ==========================================
// HTML Elements
// ==========================================

const form =
    document.getElementById("invoiceForm");


const customerInput =
    document.getElementById("customer");


const invoiceInput =
    document.getElementById("invoiceNumber");


const amountInput =
    document.getElementById("amount");


const dueDateInput =
    document.getElementById("dueDate");


const totalInvoicesEl =
    document.getElementById("totalInvoices");


const overdueInvoicesEl =
    document.getElementById("overdueInvoices");


const overdueAmountEl =
    document.getElementById("overdueAmount");


const emptyState =
    document.getElementById("emptyState");


const invoiceTableContainer =
    document.getElementById(
        "invoiceTableContainer"
    );


const invoiceTableBody =
    document.getElementById(
        "invoiceTableBody"
    );


const reminderSection =
    document.getElementById(
        "reminderSection"
    );


const reminderSubject =
    document.getElementById(
        "reminderSubject"
    );


const reminderMessage =
    document.getElementById(
        "reminderMessage"
    );


const copyButton =
    document.getElementById(
        "copyButton"
    );


const copyStatus =
    document.getElementById(
        "copyStatus"
    );


const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );


// ==========================================
// Save invoices
// ==========================================

function saveInvoices() {

    try {

        localStorage.setItem(
            "invoicechaser_invoices",
            JSON.stringify(invoices)
        );

    } catch (error) {

        console.error(
            "Could not save invoices:",
            error
        );

    }
}


// ==========================================
// Get invoice status
// ==========================================

function getInvoiceStatus(dueDate) {

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const due =
        new Date(
            dueDate + "T00:00:00"
        );


    due.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        Math.floor(
            (
                today.getTime() -
                due.getTime()
            ) /
            (1000 * 60 * 60 * 24)
        );


    // Overdue
    if (difference > 0) {

        return {

            type: "overdue",

            text:
                `Overdue ${difference} day${difference === 1 ? "" : "s"}`,

            daysLate: difference

        };
    }


    // Due today
    if (difference === 0) {

        return {

            type: "today",

            text: "Due today",

            daysLate: 0

        };
    }


    // Future
    const daysUntilDue =
        Math.abs(difference);


    return {

        type: "upcoming",

        text:
            `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`,

        daysLate: 0,

        daysUntilDue: daysUntilDue

    };
}


// ==========================================
// Filter invoices
// ==========================================

function getFilteredInvoices() {

    if (currentFilter === "all") {

        return invoices.map(
            (invoice, index) => ({
                invoice: invoice,
                index: index
            })
        );
    }


    if (currentFilter === "overdue") {

        return invoices
            .map(
                (invoice, index) => ({
                    invoice: invoice,
                    index: index
                })
            )
            .filter(item => {

                const status =
                    getInvoiceStatus(
                        item.invoice.dueDate
                    );

                return status.type === "overdue";
            });
    }


    if (currentFilter === "soon") {

        return invoices
            .map(
                (invoice, index) => ({
                    invoice: invoice,
                    index: index
                })
            )
            .filter(item => {

                const status =
                    getInvoiceStatus(
                        item.invoice.dueDate
                    );


                // Due today or within 7 days
                return (
                    status.type === "today" ||
                    (
                        status.type === "upcoming" &&
                        status.daysUntilDue <= 7
                    )
                );
            });
    }


    return [];
}


// ==========================================
// Render invoices
// ==========================================

function renderInvoices() {

    invoiceTableBody.innerHTML = "";


    // No invoices at all
    if (invoices.length === 0) {

        emptyState.innerHTML = `

            <div class="empty-icon">
                📄
            </div>

            <h3>
                No invoices yet
            </h3>

            <p>
                Add your first invoice above.
            </p>

        `;


        emptyState.classList.remove(
            "hidden"
        );


        invoiceTableContainer.classList.add(
            "hidden"
        );


        updateDashboard();

        return;
    }


    // Get filtered invoices
    const filtered =
        getFilteredInvoices();


    // Filter has no results
    if (filtered.length === 0) {

        emptyState.innerHTML = `

            <div class="empty-icon">
                🔍
            </div>

            <h3>
                No matching invoices
            </h3>

            <p>
                Try another filter.
            </p>

        `;


        emptyState.classList.remove(
            "hidden"
        );


        invoiceTableContainer.classList.add(
            "hidden"
        );


        updateDashboard();

        return;
    }


    // Show table
    emptyState.classList.add(
        "hidden"
    );


    invoiceTableContainer.classList.remove(
        "hidden"
    );


    // Build rows
    filtered.forEach(item => {

        const invoice =
            item.invoice;


        const originalIndex =
            item.index;


        const status =
            getInvoiceStatus(
                invoice.dueDate
            );


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>
                ${escapeHTML(
                    invoice.customer
                )}
            </td>


            <td>
                ${escapeHTML(
                    invoice.invoiceNumber
                )}
            </td>


            <td>
                $${Number(
                    invoice.amount
                ).toFixed(2)}
            </td>


            <td>
                ${escapeHTML(
                    invoice.dueDate
                )}
            </td>


            <td>

                <span
                    class="status ${status.type}"
                >
                    ${status.text}
                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="small-btn reminder-btn"
                    onclick="showReminder(${originalIndex})"
                >
                    Reminder
                </button>


                <button
                    type="button"
                    class="small-btn delete-btn"
                    onclick="deleteInvoice(${originalIndex})"
                >
                    Delete
                </button>

            </td>

        `;


        invoiceTableBody.appendChild(
            row
        );

    });


    updateDashboard();
}


// ==========================================
// Dashboard
// ==========================================

function updateDashboard() {

    let overdueCount = 0;

    let overdueAmount = 0;


    invoices.forEach(invoice => {

        const status =
            getInvoiceStatus(
                invoice.dueDate
            );


        if (
            status.type === "overdue"
        ) {

            overdueCount++;


            overdueAmount +=
                Number(
                    invoice.amount
                );

        }

    });


    totalInvoicesEl.textContent =
        invoices.length;


    overdueInvoicesEl.textContent =
        overdueCount;


    overdueAmountEl.textContent =
        "$" +
        overdueAmount.toFixed(2);
}


// ==========================================
// Add invoice
// ==========================================

form.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const customer =
            customerInput.value.trim();


        const invoiceNumber =
            invoiceInput.value.trim();


        const amount =
            parseFloat(
                amountInput.value
            );


        const dueDate =
            dueDateInput.value;


        // Validate
        if (
            !customer ||
            !invoiceNumber ||
            !amount ||
            amount <= 0 ||
            !dueDate
        ) {

            alert(
                "Please fill in all fields correctly."
            );

            return;
        }


        // Create invoice
        const invoice = {

            customer:
                customer,

            invoiceNumber:
                invoiceNumber,

            amount:
                amount,

            dueDate:
                dueDate,

            createdAt:
                new Date().toISOString()

        };


        // Add invoice
        invoices.push(
            invoice
        );


        // Save
        saveInvoices();


        // Show all invoices
        currentFilter = "all";

        updateFilterButtons();


        // Render
        renderInvoices();


        // Clear form
        form.reset();


        // Hide reminder
        reminderSection.classList.add(
            "hidden"
        );


        // Scroll to invoices
        document
            .getElementById(
                "invoiceTableContainer"
            )
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    }
);


// ==========================================
// Delete invoice
// ==========================================

function deleteInvoice(index) {

    if (
        index < 0 ||
        index >= invoices.length
    ) {
        return;
    }


    const invoice =
        invoices[index];


    const confirmed =
        confirm(
            `Delete invoice ${invoice.invoiceNumber}?`
        );


    if (!confirmed) {
        return;
    }


    invoices.splice(
        index,
        1
    );


    saveInvoices();


    renderInvoices();


    reminderSection.classList.add(
        "hidden"
    );
}


// ==========================================
// Show reminder
// ==========================================

function showReminder(index) {

    if (
        index < 0 ||
        index >= invoices.length
    ) {
        return;
    }


    const invoice =
        invoices[index];


    const status =
        getInvoiceStatus(
            invoice.dueDate
        );


    let subject = "";

    let message = "";


    // Due today
    if (
        status.type === "today"
    ) {

        subject =
            `Payment reminder - Invoice ${invoice.invoiceNumber}`;


        message =
`Hi ${invoice.customer},

Just a friendly reminder that invoice ${invoice.invoiceNumber} for $${Number(invoice.amount).toFixed(2)} is due today.

Please let me know if you have any questions.

Thank you.`;

    }


    // Overdue 1-7 days
    else if (
        status.type === "overdue" &&
        status.daysLate <= 7
    ) {

        subject =
            `Payment reminder - Invoice ${invoice.invoiceNumber}`;


        message =
`Hi ${invoice.customer},

I wanted to follow up regarding invoice ${invoice.invoiceNumber} for $${Number(invoice.amount).toFixed(2)}, which is now ${status.daysLate} day${status.daysLate === 1 ? "" : "s"} overdue.

Could you please let me know when we can expect payment?

Thank you.`;

    }


    // Overdue more than 7 days
    else if (
        status.type === "overdue"
    ) {

        subject =
            `Overdue invoice - ${invoice.invoiceNumber}`;


        message =
`Hi ${invoice.customer},

I'm following up regarding invoice ${invoice.invoiceNumber} for $${Number(invoice.amount).toFixed(2)}.

The invoice is now ${status.daysLate} days overdue.

Could you please arrange payment at your earliest convenience, or let me know if there is any issue with the invoice?

Thank you.`;

    }


    // Future invoice
    else {

        subject =
            `Upcoming payment - Invoice ${invoice.invoiceNumber}`;


        message =
`Hi ${invoice.customer},

Just a friendly reminder that invoice ${invoice.invoiceNumber} for $${Number(invoice.amount).toFixed(2)} is due on ${invoice.dueDate}.

Please let me know if you have any questions.

Thank you.`;

    }


    reminderSubject.value =
        subject;


    reminderMessage.value =
        message;


    reminderSection.classList.remove(
        "hidden"
    );


    copyStatus.textContent =
        "";


    reminderSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ==========================================
// Filter buttons
// ==========================================

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            currentFilter =
                button.dataset.filter;


            updateFilterButtons();


            renderInvoices();

        }
    );

});


// ==========================================
// Update active filter
// ==========================================

function updateFilterButtons() {

    filterButtons.forEach(button => {

        if (
            button.dataset.filter ===
            currentFilter
        ) {

            button.classList.add(
                "active"
            );

        } else {

            button.classList.remove(
                "active"
            );

        }

    });
}


// ==========================================
// Copy reminder
// ==========================================

copyButton.addEventListener(
    "click",
    async function() {

        const subject =
            reminderSubject.value;


        const message =
            reminderMessage.value;


        const text =
`Subject: ${subject}

${message}`;


        try {

            await navigator.clipboard.writeText(
                text
            );


            copyStatus.textContent =
                "✓ Message copied!";


            copyButton.textContent =
                "✓ Copied";


            setTimeout(
                function() {

                    copyButton.textContent =
                        "📋 Copy Message";

                    copyStatus.textContent =
                        "";

                },
                2000
            );

        }


        catch (error) {

            // Fallback for older browsers
            reminderMessage.focus();

            reminderMessage.select();


            try {

                document.execCommand(
                    "copy"
                );


                copyStatus.textContent =
                    "✓ Message copied!";

            }

            catch (fallbackError) {

                copyStatus.textContent =
                    "Please copy the message manually.";

            }

        }

    }
);


// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(text);


    return div.innerHTML;
}


// ==========================================
// Start application
// ==========================================

updateFilterButtons();

renderInvoices();
