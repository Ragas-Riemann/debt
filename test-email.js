// Test script to verify Resend API key
// Run: node test-email.js

// Your Resend API key
const RESEND_API_KEY = 're_gFS5bhbt_DwZPXAQ6nem5y3QgM63NkCjV';

// Your email address (must be verified in Resend dashboard)
const YOUR_EMAIL = 'riemannragas01@gmail.com';

async function testEmail() {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [YOUR_EMAIL],
        subject: 'Test Email from Debt Tracker',
        text: 'This is a test email from Debt Tracker. If you received this, your API key is working!',
        html: '<p>This is a <strong>test email</strong> from Debt Tracker.</p><p>If you received this, your API key is working!</p>',
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (response.ok) {
      console.log('✅ Email sent successfully! Check your inbox.');
    } else {
      console.log('❌ Email failed:', data);
      if (data.message?.includes('verified')) {
        console.log('\n⚠️ You need to verify your email in Resend dashboard first:');
        console.log('   https://resend.com/domains');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testEmail();
