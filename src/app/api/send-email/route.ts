import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_API_URL = 'https://api.resend.com/emails'

export async function POST(req: NextRequest) {
  try {
    const { to, subject, message, from } = await req.json()

    console.log('📧 Email request received:', { to, subject: subject.slice(0, 50), hasMessage: !!message })

    // Validate required fields
    if (!to || !subject || !message) {
      console.log('❌ Validation failed:', { to: !!to, subject: !!subject, message: !!message })
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // Debug: Show if API key is present (masked)
    const apiKeyPresent = !!RESEND_API_KEY
    const apiKeyPreview = RESEND_API_KEY ? `${RESEND_API_KEY.slice(0, 10)}...` : 'none'
    console.log('🔑 API Key check:', { present: apiKeyPresent, preview: apiKeyPreview })

    if (!RESEND_API_KEY) {
      console.log('❌ RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY.' },
        { status: 500 }
      )
    }

    console.log('✅ API Key present, sending to Resend...')

    // Send email using Resend REST API
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'Debt Tracker <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        text: message,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #2563eb; margin-top: 0;">📊 Debt Tracker</h2>
    <p style="margin-bottom: 0;">Payment Reminder Notification</p>
  </div>
  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
    ${message.replace(/\n/g, '<br>').replace(/• /g, '&bull; ')}
  </div>
  <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>Important:</strong> Please respond to this email if you have any questions about your debt.
    </p>
  </div>
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This email was sent via Debt Tracker application.</p>
  </div>
</body>
</html>
`,
      }),
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { message: await response.text() }
      }
      
      // Extract the actual error message from Resend
      const errorMessage = errorData?.message || errorData?.error || 'Unknown error'
      console.error('Resend API error:', response.status, errorMessage, errorData)
      
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          message: errorMessage,
          details: errorData 
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    console.log('✅ Email sent successfully! MessageId:', data.id)

    return NextResponse.json(
      { success: true, messageId: data.id },
      { status: 200 }
    )

  } catch (err: any) {
    console.error('Email API error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}
