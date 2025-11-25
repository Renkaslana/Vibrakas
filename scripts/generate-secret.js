#!/usr/bin/env node

/**
 * Script untuk generate NEXTAUTH_SECRET
 * Usage: node scripts/generate-secret.js
 */

const crypto = require('crypto');

// Generate random secret (32 bytes = 256 bits)
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n✅ NEXTAUTH_SECRET generated:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Copy secret di atas dan paste ke Vercel Environment Variables');
console.log('   Name: NEXTAUTH_SECRET');
console.log('   Value: (paste secret di atas)');
console.log('   Environment: ✅ Production, ✅ Preview, ✅ Development\n');

