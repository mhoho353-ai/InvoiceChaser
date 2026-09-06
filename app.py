import streamlit as st
import pandas as pd
from datetime import date, datetime

st.set_page_config(
    page_title="InvoiceChaser",
    page_icon="💰",
    layout="centered"
)

# -----------------------------
# Helpers
# -----------------------------

def invoice_status(due_date, today):
    days = (today - due_date).days

    if days < 0:
        return "🟢 Due soon", days, "Wait"
    elif days == 0:
        return "🟡 Due today", 0, "Follow up today"
    elif days <= 7:
        return "🔴 Overdue", days, "Follow up now"
    elif days <= 30:
        return "🔴 Overdue", days, "Follow up now"
    else:
        return "🚨 Seriously overdue", days, "Follow up urgently"


def generate_message(customer, invoice_no, amount, due_date, days_late):
    if days_late <= 0:
        subject = f"Friendly reminder - Invoice {invoice_no}"

        message = f"""Hi {customer},

I hope you're doing well.

This is a friendly reminder that invoice {invoice_no} for ${amount:,.2f} is due on {due_date.strftime("%B %d, %Y")}.

Please let me know if you have any questions.

Thank you!
"""

    elif days_late <= 7:
        subject = f"Payment reminder - Invoice {invoice_no}"

        message = f"""Hi {customer},

I wanted to follow up regarding invoice {invoice_no} for ${amount:,.2f}.

The invoice was due on {due_date.strftime("%B %d, %Y")} and appears to still be outstanding.

Could you please let me know when payment is expected?

Thank you!
"""

    elif days_late <= 30:
        subject = f"Payment overdue - Invoice {invoice_no}"

        message = f"""Hi {customer},

I'm following up regarding invoice {invoice_no} for ${amount:,.2f}.

The invoice was due on {due_date.strftime("%B %d, %Y")} and is now {days_late} days overdue.

Please let me know the status of the payment or if there is anything you need from me.

Thank you for your attention to this.
"""

    else:
        subject = f"Urgent payment follow-up - Invoice {invoice_no}"

        message = f"""Hi {customer},

I'm following up again regarding invoice {invoice_no} for ${amount:,.2f}.

The invoice was due on {due_date.strftime("%B %d, %Y")} and is now {days_late} days overdue.

Please let me know when payment can be expected.

If there is an issue with the invoice, please let me know so we can resolve it.

Thank you.
"""

    return subject, message


# -----------------------------
# Session state
# -----------------------------

if "invoices" not in st.session_state:
    st.session_state.invoices = []


# -----------------------------
# Header
# -----------------------------

st.title("💰 InvoiceChaser")

st.subheader("Stop forgetting unpaid invoices.")

st.write(
    "Track overdue invoices, see who needs a follow-up, "
    "and generate a professional payment reminder in seconds."
)

st.divider()


# -----------------------------
# Add invoice
# -----------------------------

st.subheader("➕ Add an invoice")

with st.form("invoice_form"):

    customer = st.text_input(
        "Customer name",
        placeholder="John Smith"
    )

    invoice_no = st.text_input(
        "Invoice number",
        placeholder="INV-1024"
    )

    amount = st.number_input(
        "Amount ($)",
        min_value=0.0,
        step=10.0,
        format="%.2f"
    )

    due_date = st.date_input(
        "Due date",
        value=date.today()
    )

    submitted = st.form_submit_button(
        "Add Invoice",
        use_container_width=True
    )

    if submitted:

        if not customer.strip():
            st.error("Please enter the customer name.")

        elif not invoice_no.strip():
            st.error("Please enter the invoice number.")

        elif amount <= 0:
            st.error("Please enter an amount greater than 0.")

        else:

            st.session_state.invoices.append(
                {
                    "Customer": customer.strip(),
                    "Invoice": invoice_no.strip(),
                    "Amount": amount,
                    "Due Date": due_date
                }
            )

            st.success("Invoice added successfully.")


# -----------------------------
# Dashboard
# -----------------------------

st.divider()

st.subheader("📊 Your invoices")

today = date.today()

if not st.session_state.invoices:

    st.info(
        "No invoices yet. Add your first invoice above."
    )

else:

    rows = []

    for invoice in st.session_state.invoices:

        status, days, action = invoice_status(
            invoice["Due Date"],
            today
        )

        if days > 0:
            days_text = f"{days} days late"
        elif days == 0:
            days_text = "Due today"
        else:
            days_text = f"Due in {abs(days)} days"

        rows.append(
            {
                "Customer": invoice["Customer"],
                "Invoice": invoice["Invoice"],
                "Amount": f"${invoice['Amount']:,.2f}",
                "Due": invoice["Due Date"].strftime("%Y-%m-%d"),
                "Status": status,
                "Timing": days_text,
                "Action": action
            }
        )

    df = pd.DataFrame(rows)

    st.dataframe(
        df,
        use_container_width=True,
        hide_index=True
    )

    # -----------------------------
    # Follow-up generator
    # -----------------------------

    st.subheader("✉️ Generate a reminder")

    invoice_names = [
        f"{x['Customer']} — {x['Invoice']}"
        for x in st.session_state.invoices
    ]

    selected = st.selectbox(
        "Choose an invoice",
        invoice_names
    )

    selected_index = invoice_names.index(selected)

    selected_invoice = st.session_state.invoices[
        selected_index
    ]

    days_late = (
        today - selected_invoice["Due Date"]
    ).days

    if days_late < 0:
        days_late = 0

    subject, message = generate_message(
        selected_invoice["Customer"],
        selected_invoice["Invoice"],
        selected_invoice["Amount"],
        selected_invoice["Due Date"],
        days_late
    )

    st.text_input(
        "Email subject",
        value=subject
    )

    st.text_area(
        "Reminder message",
        value=message,
        height=250
    )

    st.caption(
        "Copy the message and send it through your usual email or messaging app."
    )


# -----------------------------
# Clear
# -----------------------------

st.divider()

if st.session_state.invoices:

    if st.button(
        "🗑️ Clear all invoices",
        use_container_width=True
    ):

        st.session_state.invoices = []

        st.rerun()


# -----------------------------
# Footer
# -----------------------------

st.divider()

st.caption(
    "InvoiceChaser — simple invoice follow-up tracking."
)
