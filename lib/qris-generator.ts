// QRIS Generator untuk rekening bendahara
// Generate EMV QR Code format untuk transfer ke rekening bendahara

interface QRISData {
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  merchantName?: string
  merchantCity?: string
}

/**
 * Generate EMV QR Code string untuk transfer ke rekening bendahara
 * Format: EMV QR Code dengan informasi rekening dan nominal
 */
export function generateQRISFromAccount(data: QRISData): string {
  const { bankName, accountNumber, accountName, amount, merchantName = 'Vibra Kas', merchantCity = 'Jakarta' } = data

  // Format EMV QR Code untuk transfer bank
  // Struktur: [ID][Length][Value]
  
  // Payload Format Indicator (00)
  const payloadFormat = '01' // Fixed value for EMV QR Code
  
  // Point of Initiation Method (01)
  // 11 = Static, 12 = Dynamic
  const pointOfInitiation = '12' // Dynamic (with amount)
  
  // Merchant Account Information (26-45)
  // Format: [Bank Code][Account Number]
  // Untuk Indonesia, kita gunakan format khusus
  const bankCode = getBankCode(bankName)
  const merchantAccountInfo = `${bankCode}${accountNumber}`
  
  // Merchant Category Code (52) - Default untuk retail
  const merchantCategoryCode = '0000'
  
  // Transaction Currency (53) - IDR = 360
  const currency = '360'
  
  // Transaction Amount (54) - Format: amount dengan 2 desimal
  const transactionAmount = (amount / 100).toFixed(2) // Convert to rupiah format
  
  // Country Code (58) - ID = ID
  const countryCode = 'ID'
  
  // Merchant Name (59)
  const merchantNameField = merchantName.substring(0, 25) // Max 25 chars
  
  // Merchant City (60)
  const merchantCityField = merchantCity.substring(0, 15) // Max 15 chars
  
  // Additional Data Field Template (62)
  // Bisa berisi reference number atau info tambahan
  const referenceNumber = `REF${Date.now().toString().slice(-10)}`
  const additionalData = `05${String(referenceNumber.length).padStart(2, '0')}${referenceNumber}`
  
  // CRC (63) - Checksum, akan dihitung nanti
  const crcPlaceholder = 'FFFF'
  
  // Build QRIS string
  let qrisString = ''
  
  // Payload Format Indicator
  qrisString += `00${String(payloadFormat.length).padStart(2, '0')}${payloadFormat}`
  
  // Point of Initiation Method
  qrisString += `01${String(pointOfInitiation.length).padStart(2, '0')}${pointOfInitiation}`
  
  // Merchant Account Information
  const maiLength = String(merchantAccountInfo.length).padStart(2, '0')
  qrisString += `26${maiLength}${merchantAccountInfo}`
  
  // Merchant Category Code
  qrisString += `52${String(merchantCategoryCode.length).padStart(2, '0')}${merchantCategoryCode}`
  
  // Transaction Currency
  qrisString += `53${String(currency.length).padStart(2, '0')}${currency}`
  
  // Transaction Amount
  qrisString += `54${String(transactionAmount.length).padStart(2, '0')}${transactionAmount}`
  
  // Country Code
  qrisString += `58${String(countryCode.length).padStart(2, '0')}${countryCode}`
  
  // Merchant Name
  qrisString += `59${String(merchantNameField.length).padStart(2, '0')}${merchantNameField}`
  
  // Merchant City
  qrisString += `60${String(merchantCityField.length).padStart(2, '0')}${merchantCityField}`
  
  // Additional Data
  qrisString += `62${String(additionalData.length).padStart(2, '0')}${additionalData}`
  
  // CRC (dihitung dari semua data sebelumnya)
  const crc = calculateCRC(qrisString + '6304')
  qrisString += `6304${crc}`
  
  return qrisString
}

/**
 * Get bank code from bank name
 */
function getBankCode(bankName: string): string {
  const bankCodes: { [key: string]: string } = {
    'BCA': '014',
    'Mandiri': '008',
    'BNI': '009',
    'BRI': '002',
    'CIMB': '022',
    'Danamon': '011',
    'Permata': '013',
    'Maybank': '016',
    'OCBC': '028',
    'UOB': '023',
    'HSBC': '087',
    'Standard Chartered': '050',
    'Citibank': '031',
    'Bank DKI': '111',
    'Bank Jatim': '114',
    'Bank Jateng': '113',
    'Bank Sumut': '117',
    'Bank Riau': '119',
    'Bank Sumsel': '120',
    'Bank Lampung': '121',
    'Bank Kalsel': '122',
    'Bank Kaltim': '124',
    'Bank Kalteng': '125',
    'Bank Sulsel': '126',
    'Bank Sultra': '130',
    'Bank Sulteng': '132',
    'Bank Sulut': '127',
    'Bank NTB': '128',
    'Bank NTT': '129',
    'Bank Maluku': '131',
    'Bank Papua': '132',
    'Bank Aceh': '116',
    'Bank Bengkulu': '133',
    'Bank Gorontalo': '134',
    'Bank Banten': '137',
    'Bank Jambi': '115',
    'Bank DIY': '112',
    'Bank Sulbar': '135',
    'Bank Kalbar': '123',
    'Bank Malut': '136',
  }
  
  // Case insensitive search
  const normalizedName = bankName.toUpperCase()
  for (const [key, code] of Object.entries(bankCodes)) {
    if (normalizedName.includes(key.toUpperCase())) {
      return code
    }
  }
  
  // Default: return first 3 digits or '000'
  return '000'
}

/**
 * Calculate CRC16-CCITT checksum
 */
function calculateCRC(data: string): string {
  let crc = 0xFFFF
  const polynomial = 0x1021
  
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8)
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial
      } else {
        crc <<= 1
      }
      crc &= 0xFFFF
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Generate simple QR Code string dengan format yang lebih sederhana
 * Format: JSON dengan informasi rekening dan nominal
 * Ini akan lebih mudah di-parse oleh aplikasi custom
 */
export function generateSimpleQRCode(data: QRISData): string {
  const qrData = {
    type: 'BANK_TRANSFER',
    bank: data.bankName,
    account: data.accountNumber,
    name: data.accountName,
    amount: data.amount,
    timestamp: Date.now(),
  }
  
  return JSON.stringify(qrData)
}

/**
 * Generate QRIS string untuk transfer ke rekening bendahara
 * 
 * CATATAN PENTING:
 * - QRIS resmi memerlukan registrasi ke Bank Indonesia dan provider QRIS
 * - Format ini adalah QR Code sederhana yang berisi info rekening (BUKAN QRIS resmi)
 * - QR Code ini akan menampilkan info rekening saat di-scan, bukan langsung transfer
 * - Untuk QRIS resmi, gunakan payment gateway (Tripay/Midtrans/Xendit)
 */
export function generateTreasurerQRIS(
  bankName: string,
  accountNumber: string,
  accountName: string,
  amount: number
): string {
  // Generate QR Code sederhana dengan format JSON
  // Format ini akan menampilkan info rekening saat di-scan
  // BUKAN QRIS resmi, tapi QR Code informasi rekening
  
  const qrData = {
    type: 'BANK_TRANSFER_INFO',
    bank: bankName,
    account: accountNumber,
    name: accountName,
    amount: amount,
    currency: 'IDR',
    message: `Transfer ke ${accountName} - ${bankName}`,
    timestamp: new Date().toISOString(),
  }
  
  // Return JSON string yang akan di-encode menjadi QR Code
  return JSON.stringify(qrData)
}

