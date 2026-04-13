export async function sendEmail(to: string, subject: string, message: string, from?: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Sending email to:', to)
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        message,
        from,
      }),
    })

    // Get raw text first for debugging
    const rawText = await response.text()
    console.log('Raw API response:', response.status, rawText)
    
    // Try to parse JSON
    let result
    try {
      result = JSON.parse(rawText)
    } catch (e) {
      result = { raw: rawText }
    }

    if (!response.ok) {
      // Extract the actual error message from various possible formats
      let errorMsg = result?.message || result?.error || 'Failed to send email'
      
      // Check nested details
      if (result?.details?.message) {
        errorMsg = result.details.message
      } else if (result?.details?.error) {
        errorMsg = result.details.error
      } else if (typeof result?.details === 'string') {
        errorMsg = result.details
      } else if (result?.raw) {
        errorMsg = result.raw
      }
      
      console.error('Email send failed:', errorMsg, 'Full response:', result)
      return { success: false, error: errorMsg }
    }

    console.log('Email sent successfully:', result.messageId)
    return { success: true }

  } catch (err: any) {
    console.error('Email service error:', err)
    return { success: false, error: err.message }
  }
}

// Send payment reminder email
export async function sendPaymentReminder(
  debtorEmail: string,
  creditorEmail: string,
  debtDetails: {
    totalDebt: number
    amountPaid: number
    remainingBalance: number
    deadlineDate: string
    dateBorrowed: string
  }
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Payment Reminder - Outstanding Debt'
  
  const message = `Hi ${debtorEmail},

This is a friendly reminder about your outstanding debt.

📊 Debt Summary:
• Total Debt: ₱${debtDetails.totalDebt.toFixed(2)}
• Amount Paid: ₱${debtDetails.amountPaid.toFixed(2)}
• Remaining Balance: ₱${debtDetails.remainingBalance.toFixed(2)}
• Payment Deadline: ${debtDetails.deadlineDate}
• Date Borrowed: ${debtDetails.dateBorrowed}

Please settle your remaining balance as soon as possible. If you have any questions or need to arrange a payment plan, please don't hesitate to contact me.

Thank you!
Your creditor: ${creditorEmail}`

  return sendEmail(debtorEmail, subject, message)
}
