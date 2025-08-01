const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { generateCertificateQR } = require('./qrCode');

// Generate certificate PDF
const generateCertificate = async (certificateData) => {
  try {
    const {
      userName,
      eventTitle,
      eventDate,
      certificateType,
      organizerName,
      position,
      score,
      certificateId,
      verificationCode
    } = certificateData;

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set up the certificate design
    await setupCertificateDesign(doc, certificateData);

    // Add certificate content
    await addCertificateContent(doc, certificateData);

    // Add QR code for verification
    await addVerificationQR(doc, certificateId, verificationCode);

    // Finalize the PDF
    doc.end();

    // Return the PDF buffer
    return new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to generate certificate: ${error.message}`);
  }
};

// Set up certificate design and styling
const setupCertificateDesign = async (doc, certificateData) => {
  const { certificateType } = certificateData;

  // Set background color based on certificate type
  const bgColors = {
    participation: '#f8fafc',
    winner: '#fef3c7',
    completion: '#ecfdf5',
    achievement: '#ede9fe',
    appreciation: '#fce7f3'
  };

  // Add background
  doc.rect(0, 0, doc.page.width, doc.page.height)
     .fill(bgColors[certificateType] || bgColors.participation);

  // Add decorative border
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
     .lineWidth(3)
     .stroke('#1f2937');

  // Add inner decorative border
  doc.rect(45, 45, doc.page.width - 90, doc.page.height - 90)
     .lineWidth(1)
     .stroke('#6b7280');

  // Add header decoration
  doc.rect(80, 80, doc.page.width - 160, 80)
     .fill('#1f2937');

  // Add मंथन logo/title
  doc.fontSize(36)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('मंथन', 0, 105, { align: 'center' });

  doc.fontSize(14)
     .text('Event Management System', 0, 145, { align: 'center' });
};

// Add main certificate content
const addCertificateContent = async (doc, certificateData) => {
  const {
    userName,
    eventTitle,
    eventDate,
    certificateType,
    organizerName,
    position,
    score,
    department
  } = certificateData;

  // Certificate title
  const titles = {
    participation: 'Certificate of Participation',
    winner: 'Certificate of Achievement',
    completion: 'Certificate of Completion',
    achievement: 'Certificate of Excellence',
    appreciation: 'Certificate of Appreciation'
  };

  doc.fontSize(28)
     .fillColor('#1f2937')
     .font('Helvetica-Bold')
     .text(titles[certificateType] || titles.participation, 0, 200, { align: 'center' });

  // "This is to certify that" text
  doc.fontSize(16)
     .fillColor('#374151')
     .font('Helvetica')
     .text('This is to certify that', 0, 260, { align: 'center' });

  // User name
  doc.fontSize(32)
     .fillColor('#1f2937')
     .font('Helvetica-Bold')
     .text(userName, 0, 300, { align: 'center' });

  // Achievement text based on certificate type
  let achievementText = '';
  switch (certificateType) {
    case 'participation':
      achievementText = `has successfully participated in`;
      break;
    case 'winner':
      achievementText = `has achieved ${position || 'Winner'} position in`;
      break;
    case 'completion':
      achievementText = `has successfully completed`;
      break;
    case 'achievement':
      achievementText = `has demonstrated excellence in`;
      break;
    case 'appreciation':
      achievementText = `is appreciated for contribution to`;
      break;
    default:
      achievementText = `has participated in`;
  }

  doc.fontSize(16)
     .fillColor('#374151')
     .font('Helvetica')
     .text(achievementText, 0, 360, { align: 'center' });

  // Event title
  doc.fontSize(24)
     .fillColor('#1f2937')
     .font('Helvetica-Bold')
     .text(eventTitle, 0, 390, { align: 'center' });

  // Event date
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fontSize(14)
     .fillColor('#6b7280')
     .font('Helvetica')
     .text(`Held on ${formattedDate}`, 0, 430, { align: 'center' });

  // Additional information for winners
  if (certificateType === 'winner' && score) {
    doc.fontSize(12)
       .text(`Score: ${score}`, 0, 450, { align: 'center' });
  }

  // Department information
  if (department) {
    doc.fontSize(12)
       .text(`Department: ${department}`, 0, 470, { align: 'center' });
  }

  // Signature section
  const signatureY = 520;
  
  // Left signature (Organizer)
  doc.fontSize(12)
     .fillColor('#1f2937')
     .text('_____________________', 150, signatureY);
  
  doc.fontSize(10)
     .fillColor('#6b7280')
     .text(organizerName || 'Event Organizer', 150, signatureY + 20);
  
  doc.text('Organizer', 150, signatureY + 35);

  // Right signature (Admin/Authority)
  doc.fontSize(12)
     .fillColor('#1f2937')
     .text('_____________________', doc.page.width - 250, signatureY);
  
  doc.fontSize(10)
     .fillColor('#6b7280')
     .text('मंथन Team', doc.page.width - 250, signatureY + 20);
  
  doc.text('Authorized Signatory', doc.page.width - 250, signatureY + 35);
};

// Add verification QR code
const addVerificationQR = async (doc, certificateId, verificationCode) => {
  try {
    const qrCode = await generateCertificateQR(certificateId, verificationCode);
    
    // Convert data URL to buffer
    const base64Data = qrCode.dataURL.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');
    
    // Add QR code to bottom right
    doc.image(qrBuffer, doc.page.width - 120, doc.page.height - 120, {
      fit: [80, 80]
    });

    // Add verification text
    doc.fontSize(8)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text('Scan to verify', doc.page.width - 120, doc.page.height - 35, {
         width: 80,
         align: 'center'
       });

    // Add certificate ID
    doc.fontSize(8)
       .text(`ID: ${certificateId}`, 50, doc.page.height - 30);

  } catch (error) {
    console.error('Failed to add QR code to certificate:', error);
    // Continue without QR code if generation fails
  }
};

// Save certificate to file
const saveCertificateFile = async (pdfBuffer, filename) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads/certificates');
    
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Save file
    const filePath = path.join(uploadsDir, `${filename}.pdf`);
    await fs.writeFile(filePath, pdfBuffer);
    
    return `/uploads/certificates/${filename}.pdf`;
  } catch (error) {
    throw new Error(`Failed to save certificate file: ${error.message}`);
  }
};

// Generate certificate with custom template
const generateCustomCertificate = async (certificateData, templateOptions = {}) => {
  try {
    const {
      backgroundColor = '#ffffff',
      primaryColor = '#1f2937',
      secondaryColor = '#6b7280',
      accentColor = '#3b82f6',
      fontFamily = 'Helvetica'
    } = templateOptions;

    // Use custom styling options
    const customData = {
      ...certificateData,
      styling: {
        backgroundColor,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily
      }
    };

    return await generateCertificate(customData);
  } catch (error) {
    throw new Error(`Failed to generate custom certificate: ${error.message}`);
  }
};

// Generate bulk certificates
const generateBulkCertificates = async (certificatesData) => {
  try {
    const certificates = [];
    
    for (const certData of certificatesData) {
      const pdfBuffer = await generateCertificate(certData);
      const filename = `cert_${certData.certificateId}`;
      const filePath = await saveCertificateFile(pdfBuffer, filename);
      
      certificates.push({
        certificateId: certData.certificateId,
        userId: certData.userId,
        filePath,
        buffer: pdfBuffer
      });
    }
    
    return certificates;
  } catch (error) {
    throw new Error(`Failed to generate bulk certificates: ${error.message}`);
  }
};

// Validate certificate data
const validateCertificateData = (certificateData) => {
  const required = ['userName', 'eventTitle', 'eventDate', 'certificateType', 'certificateId', 'verificationCode'];
  
  for (const field of required) {
    if (!certificateData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const validTypes = ['participation', 'winner', 'completion', 'achievement', 'appreciation'];
  if (!validTypes.includes(certificateData.certificateType)) {
    throw new Error(`Invalid certificate type: ${certificateData.certificateType}`);
  }

  return true;
};

module.exports = {
  generateCertificate,
  generateCustomCertificate,
  generateBulkCertificates,
  saveCertificateFile,
  validateCertificateData
};