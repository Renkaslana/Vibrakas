/**
 * Email Service
 * Menggunakan Nodemailer untuk mengirim email
 * 
 * CARA SETUP (PILIH SALAH SATU):
 * 
 * 1. GMAIL (Paling Mudah - GRATIS):
 *    - Aktifkan 2-Step Verification: https://myaccount.google.com/security
 *    - Buat App Password: https://myaccount.google.com/apppasswords
 *    - Tambahkan ke .env:
 *      SMTP_HOST=smtp.gmail.com
 *      SMTP_PORT=587
 *      SMTP_USER=your-email@gmail.com
 *      SMTP_PASS=xxxx xxxx xxxx xxxx (App Password dari Google)
 *      SMTP_FROM="Vibra Kas <your-email@gmail.com>"
 * 
 * 2. TIDAK SETUP (Development):
 *    - OTP akan muncul di console terminal server
 *    - Tidak perlu konfigurasi apapun
 * 
 * Lihat SETUP_EMAIL.md untuk panduan lengkap
 */

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email using SMTP
 * Falls back to console.log if SMTP is not configured
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpUser || !smtpPass) {
      // Fallback: Log to console (for development)
      console.log('\n' + '='.repeat(60))
      console.log('📧 EMAIL (SMTP not configured - Development Mode)')
      console.log('='.repeat(60))
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('Body:', options.text || options.html.replace(/<[^>]*>/g, ''))
      console.log('='.repeat(60) + '\n')
      return true // Return true for development
    }

    // Use dynamic import to avoid loading nodemailer if not installed
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const mailOptions = {
      from: process.env.SMTP_FROM || smtpUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully via SMTP')
    console.log('   Message ID:', info.messageId)
    console.log('   To:', options.to)
    return true
  } catch (error: any) {
    console.error('\n❌ Email send error:', error.message || error)
    console.log('📧 Email content (for manual checking):')
    console.log('   To:', options.to)
    console.log('   Subject:', options.subject)
    console.log('   Body:', options.text || options.html.replace(/<[^>]*>/g, ''))
    console.log('')
    // In development, still return true to allow testing
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Continuing in development mode despite email error')
      return true
    }
    return false
  }
}

/**
 * Generate 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP email for registration
 */
export async function sendRegistrationOTP(email: string, otpCode: string, userName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Vibra Kas</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Verifikasi Email</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Halo ${userName}!</h2>
        
        <p>Terima kasih telah mendaftar di Vibra Kas. Untuk menyelesaikan proses registrasi, silakan verifikasi email Anda dengan kode OTP berikut:</p>
        
        <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Kode Verifikasi</p>
          <h1 style="font-size: 36px; letter-spacing: 8px; color: #667eea; margin: 0; font-family: 'Courier New', monospace;">${otpCode}</h1>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Penting:</strong> Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Jika Anda tidak melakukan registrasi, abaikan email ini.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Vibra Kas. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Vibra Kas - Verifikasi Email
    
    Halo ${userName}!
    
    Terima kasih telah mendaftar di Vibra Kas. Untuk menyelesaikan proses registrasi, silakan verifikasi email Anda dengan kode OTP berikut:
    
    Kode Verifikasi: ${otpCode}
    
    Kode ini akan kedaluwarsa dalam 10 menit. Jangan bagikan kode ini kepada siapa pun.
    
    Jika Anda tidak melakukan registrasi, abaikan email ini.
  `

  return await sendEmail({
    to: email,
    subject: 'Verifikasi Email - Vibra Kas',
    html,
    text,
  })
}

/**
 * Send OTP email for change email verification
 */
export async function sendChangeEmailOTP(email: string, otpCode: string, userName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Vibra Kas</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Verifikasi Ganti Email</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Halo ${userName}!</h2>
        
        <p>Anda telah meminta untuk mengganti email akun Anda. Untuk melanjutkan, silakan verifikasi email lama Anda dengan kode OTP berikut:</p>
        
        <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Kode Verifikasi</p>
          <h1 style="font-size: 36px; letter-spacing: 8px; color: #667eea; margin: 0; font-family: 'Courier New', monospace;">${otpCode}</h1>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Penting:</strong> Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Jika Anda tidak meminta perubahan email, segera hubungi administrator atau abaikan email ini.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Vibra Kas. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Vibra Kas - Verifikasi Ganti Email
    
    Halo ${userName}!
    
    Anda telah meminta untuk mengganti email akun Anda. Untuk melanjutkan, silakan verifikasi email lama Anda dengan kode OTP berikut:
    
    Kode Verifikasi: ${otpCode}
    
    Kode ini akan kedaluwarsa dalam 10 menit. Jangan bagikan kode ini kepada siapa pun.
    
    Jika Anda tidak meminta perubahan email, segera hubungi administrator atau abaikan email ini.
  `

  return await sendEmail({
    to: email,
    subject: 'Verifikasi Ganti Email - Vibra Kas',
    html,
    text,
  })
}
