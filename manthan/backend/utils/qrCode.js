const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

// Generate QR code for event registration
const generateEventQR = async (registrationId, eventId) => {
  try {
    const qrData = {
      type: 'event-checkin',
      registrationId,
      eventId,
      timestamp: Date.now()
    };

    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: parseInt(process.env.QR_CODE_SIZE) || 200
    });

    return {
      code: qrString,
      dataURL: qrCodeDataURL,
      data: qrData
    };
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

// Generate QR code for certificate verification
const generateCertificateQR = async (certificateId, verificationCode) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${verificationCode}`;
    
    const qrData = {
      type: 'certificate-verification',
      certificateId,
      verificationCode,
      verificationUrl,
      timestamp: Date.now()
    };

    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#FFFFFF'
      },
      width: 150
    });

    return {
      code: verificationUrl,
      dataURL: qrCodeDataURL,
      data: qrData
    };
  } catch (error) {
    throw new Error(`Failed to generate certificate QR code: ${error.message}`);
  }
};

// Generate QR code for team joining
const generateTeamQR = async (teamCode, eventId) => {
  try {
    const joinUrl = `${process.env.FRONTEND_URL}/join-team/${teamCode}`;
    
    const qrData = {
      type: 'team-join',
      teamCode,
      eventId,
      joinUrl,
      timestamp: Date.now()
    };

    const qrCodeDataURL = await QRCode.toDataURL(joinUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#059669',
        light: '#FFFFFF'
      },
      width: 180
    });

    return {
      code: joinUrl,
      dataURL: qrCodeDataURL,
      data: qrData
    };
  } catch (error) {
    throw new Error(`Failed to generate team QR code: ${error.message}`);
  }
};

// Save QR code as file
const saveQRCodeFile = async (qrCodeDataURL, filename) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads/qr-codes');
    
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Remove data URL prefix
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    
    // Save file
    const filePath = path.join(uploadsDir, `${filename}.png`);
    await fs.writeFile(filePath, base64Data, 'base64');
    
    return `/uploads/qr-codes/${filename}.png`;
  } catch (error) {
    throw new Error(`Failed to save QR code file: ${error.message}`);
  }
};

// Generate QR code with custom styling
const generateStyledQR = async (data, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    };

    const qrOptions = { ...defaultOptions, ...options };
    const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);

    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`Failed to generate styled QR code: ${error.message}`);
  }
};

// Parse QR code data
const parseQRData = (qrString) => {
  try {
    // Try to parse as JSON first
    const data = JSON.parse(qrString);
    return {
      success: true,
      data,
      type: data.type || 'unknown'
    };
  } catch (error) {
    // If not JSON, treat as plain string (URL)
    return {
      success: true,
      data: { url: qrString },
      type: 'url'
    };
  }
};

// Validate QR code for check-in
const validateCheckInQR = (qrData, expectedEventId) => {
  try {
    if (qrData.type !== 'event-checkin') {
      return {
        valid: false,
        message: 'Invalid QR code type for check-in'
      };
    }

    if (qrData.eventId !== expectedEventId) {
      return {
        valid: false,
        message: 'QR code is for a different event'
      };
    }

    // Check if QR code is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const age = Date.now() - qrData.timestamp;
    
    if (age > maxAge) {
      return {
        valid: false,
        message: 'QR code has expired'
      };
    }

    return {
      valid: true,
      registrationId: qrData.registrationId,
      eventId: qrData.eventId
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid QR code format'
    };
  }
};

// Generate bulk QR codes for event
const generateBulkEventQRs = async (registrations) => {
  try {
    const qrCodes = [];
    
    for (const registration of registrations) {
      const qr = await generateEventQR(registration._id, registration.event);
      qrCodes.push({
        registrationId: registration._id,
        userId: registration.user,
        qrCode: qr
      });
    }
    
    return qrCodes;
  } catch (error) {
    throw new Error(`Failed to generate bulk QR codes: ${error.message}`);
  }
};

module.exports = {
  generateEventQR,
  generateCertificateQR,
  generateTeamQR,
  saveQRCodeFile,
  generateStyledQR,
  parseQRData,
  validateCheckInQR,
  generateBulkEventQRs
};