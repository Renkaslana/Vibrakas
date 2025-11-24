import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    })

    if (existingAdmin) {
      console.log('❌ Admin sudah ada!')
      console.log(`   Nama: ${existingAdmin.name}`)
      console.log(`   Email: ${existingAdmin.email}`)
      console.log('')
      console.log('Untuk membuat admin baru, hapus admin yang ada terlebih dahulu.')
      return
    }

    // Admin details - sesuai permintaan
    const name = 'Fahren Andrean Rangkuti'
    const email = process.argv[2] || 'fahren.rangkuti@vibrakas.com' // Email bisa di-custom via argument
    const password = 'VibraKas6364'

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`❌ Email ${email} sudah terdaftar!`)
      console.log('')
      console.log('Gunakan email lain atau hapus user yang ada terlebih dahulu.')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        balance: 0,
        emailVerified: true, // Skip email verification for initial admin
      },
    })

    console.log('')
    console.log('='.repeat(60))
    console.log('✅ ADMIN BERHASIL DIBUAT!')
    console.log('='.repeat(60))
    console.log('')
    console.log('📋 Detail Admin:')
    console.log(`   Nama     : ${admin.name}`)
    console.log(`   Email    : ${admin.email}`)
    console.log(`   Password : ${password}`)
    console.log(`   Role     : ${admin.role}`)
    console.log('')
    console.log('='.repeat(60))
    console.log('')
    console.log('⚠️  PENTING:')
    console.log('   1. Simpan informasi ini dengan aman!')
    console.log('   2. Setelah login pertama kali, segera ganti password!')
    console.log('   3. Jangan share informasi login ini ke siapa pun!')
    console.log('')
  } catch (error: any) {
    console.error('')
    console.error('❌ Error:', error.message)
    console.error('')
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

