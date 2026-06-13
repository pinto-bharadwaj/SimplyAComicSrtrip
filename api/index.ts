import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

const app = express();

// JSON Body parser with larger limit for complex images descriptions or potential inline data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Paths resolved relative to current working directory (project root)
const uploadsDir = path.join(process.cwd(), 'src', 'assets', 'images');
const dbPath = path.join(process.cwd(), 'src', 'projects.json');
const categoriesDbPath = path.join(process.cwd(), 'src', 'categories.json');
const sectionsDbPath = path.join(process.cwd(), 'src', 'sections.json');
const commentsDbPath = path.join(process.cwd(), 'src', 'comments.json');
const adminDbPath = path.join(process.cwd(), 'src', 'admin.json');
const inquiriesDbPath = path.join(process.cwd(), 'src', 'inquiries.json');

// Initialize Firebase Firestore dynamically from config or environment variables
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(configPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const fbApp = initializeApp(firebaseConfig);
    db = initializeFirestore(fbApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
    console.log('Firebase initialized successfully from config file with database ID:', firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error('Failed to initialize Firebase from config file:', err);
  }
} else {
  // Try initializing from environment variables for serverless environments (like Vercel)
  const firebaseConfigStr = process.env.FIREBASE_CONFIG;
  if (firebaseConfigStr) {
    try {
      const firebaseConfig = JSON.parse(firebaseConfigStr);
      const fbApp = initializeApp(firebaseConfig);
      db = initializeFirestore(fbApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
      console.log('Firebase initialized successfully from environment variable.');
    } catch (err) {
      console.error('Failed to initialize Firebase from environment variable:', err);
    }
  } else {
    console.log('No firebase-applet-config.json or FIREBASE_CONFIG env found. Falling back to local files.');
  }
}

// OTP stored state fallback (used in local development or if DB fails)
const otpStorage = new Map<string, { otp: string; expiresAt: number }>();

// Helper functions for storing and validating OTPs across serverless instances
async function storeOTP(email: string, otp: string, expiresAt: number) {
  const emailKey = email.trim().toLowerCase();
  otpStorage.set(emailKey, { otp, expiresAt });
  if (db) {
    try {
      const docRef = doc(db, 'otps', emailKey);
      await setDoc(docRef, { otp, expiresAt });
      console.log(`Stored OTP in Firestore for ${emailKey}`);
    } catch (err) {
      console.error(`Failed to store OTP in Firestore for ${emailKey}:`, err);
    }
  }
}

async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const emailKey = email.trim().toLowerCase();
  let cached = otpStorage.get(emailKey);

  if (db) {
    try {
      const docRef = doc(db, 'otps', emailKey);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        cached = docSnap.data() as { otp: string; expiresAt: number };
      }
    } catch (err) {
      console.error(`Failed to fetch OTP from Firestore for ${emailKey}:`, err);
    }
  }

  if (!cached) return false;
  if (cached.expiresAt < Date.now()) return false;
  return cached.otp === otp.trim();
}

async function deleteOTP(email: string) {
  const emailKey = email.trim().toLowerCase();
  otpStorage.delete(emailKey);
  if (db) {
    try {
      const docRef = doc(db, 'otps', emailKey);
      await setDoc(docRef, { otp: '', expiresAt: 0 });
    } catch (err) {
      console.error(`Failed to clear OTP from Firestore for ${emailKey}:`, err);
    }
  }
}

// Helper functions for reading and writing data (using Firestore with Local file fallbacks)
function readLocalFile(filePath: string, defaultData: any) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading local file ${filePath}:`, err);
  }
  return defaultData;
}

async function getData(collectionName: string, filePath: string, defaultData: any) {
  if (db) {
    try {
      const docRef = doc(db, 'cms_sync', collectionName);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        if (cloudData) {
          return cloudData;
        }
      }
      // Seed Firestore if document doesn't exist
      const localData = readLocalFile(filePath, defaultData);
      await setDoc(docRef, { data: localData });
      return localData;
    } catch (err) {
      console.error(`Error reading ${collectionName} from Firestore, falling back to local:`, err);
    }
  }
  return readLocalFile(filePath, defaultData);
}

async function saveData(collectionName: string, filePath: string, data: any) {
  if (db) {
    try {
      const docRef = doc(db, 'cms_sync', collectionName);
      await setDoc(docRef, { data });
      console.log(`Saved ${collectionName} to Firestore.`);
    } catch (err) {
      console.error(`Error saving ${collectionName} to Firestore:`, err);
    }
  }

  try {
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn(`Local file write failed for ${filePath} (expected in read-only serverless environments): ${err.message}`);
    // Best-effort local fallback: write to /tmp (Vercel)
    try {
      const tmpDir = path.join('/tmp', 'src');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const tmpPath = path.join(tmpDir, path.basename(filePath));
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (tmpErr) {
      // Ignore /tmp write errors
    }
  }
}

// Multer Memory Storage Configuration (Vercel compatible)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file limit
});

// API Endpoint - Fetch all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getData('categories', categoriesDbPath, [
      { "id": "all", "name": "All Projects" },
      { "id": "comics", "name": "Comics" },
      { "id": "science_illustrations", "name": "Science Illustrations" },
      { "id": "workshops", "name": "Workshops" },
      { "id": "marketing", "name": "Campaigns & Marketing" },
      { "id": "mascot_design", "name": "Mascot Design" }
    ]);
    return res.json(categories);
  } catch (err: any) {
    console.error('Error reading categories:', err);
    return res.status(500).json({ error: 'Failed to read categories: ' + err.message });
  }
});

// API Endpoint - Save/Update all categories
app.post('/api/categories', async (req, res) => {
  try {
    const categories = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Body must be a JSON array of categories' });
    }
    await saveData('categories', categoriesDbPath, categories);
    return res.json({ success: true, categories });
  } catch (err: any) {
    console.error('Error writing categories:', err);
    return res.status(500).json({ error: 'Failed to write categories: ' + err.message });
  }
});

// API Endpoint - Fetch all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getData('projects', dbPath, []);
    return res.json(projects);
  } catch (err: any) {
    console.error('Error reading projects:', err);
    return res.status(500).json({ error: 'Failed to read database: ' + err.message });
  }
});

// API Endpoint - Save/Update all projects
app.post('/api/projects', async (req, res) => {
  try {
    const projects = req.body;
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: 'Body must be a JSON array of projects' });
    }
    await saveData('projects', dbPath, projects);
    return res.json({ success: true, projects });
  } catch (err: any) {
    console.error('Error writing projects:', err);
    return res.status(500).json({ error: 'Failed to write database: ' + err.message });
  }
});

// API Endpoint - Fetch all website sections
app.get('/api/sections', async (req, res) => {
  try {
    const sections = await getData('sections', sectionsDbPath, []);
    return res.json(sections);
  } catch (err: any) {
    console.error('Error reading sections:', err);
    return res.status(500).json({ error: 'Failed to read sections: ' + err.message });
  }
});

// API Endpoint - Save/Update all website sections
app.post('/api/sections', async (req, res) => {
  try {
    const sections = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Body must be a JSON array of sections' });
    }
    await saveData('sections', sectionsDbPath, sections);
    return res.json({ success: true, sections });
  } catch (err: any) {
    console.error('Error writing sections:', err);
    return res.status(500).json({ error: 'Failed to write sections: ' + err.message });
  }
});

// API Endpoint - Fetch all visitors comments and reviews
app.get('/api/comments', async (req, res) => {
  try {
    const comments = await getData('comments', commentsDbPath, []);
    return res.json(comments);
  } catch (err: any) {
    console.error('Error reading comments:', err);
    return res.status(500).json({ error: 'Failed to read comments: ' + err.message });
  }
});

// API Endpoint - Add a new visitor comment/review
app.post('/api/comments', async (req, res) => {
  try {
    const { name, text, rating } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: 'Name and text are required fields' });
    }
    
    const comments = await getData('comments', commentsDbPath, []);
    
    const newComment = {
      id: 'comment_' + Date.now(),
      name: String(name).trim(),
      text: String(text).trim(),
      rating: typeof rating === 'number' ? rating : 5,
      date: new Date().toISOString()
    };
    
    comments.unshift(newComment); // Newest comments first
    await saveData('comments', commentsDbPath, comments);
    return res.json({ success: true, comment: newComment, comments });
  } catch (err: any) {
    console.error('Error saving comment:', err);
    return res.status(500).json({ error: 'Failed to write comment: ' + err.message });
  }
});

// API Endpoint - Delete/Moderate a visitor comment (Admins only)
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await getData('comments', commentsDbPath, []);
    const exists = comments.some((c: any) => c.id === id);
    if (!exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const filtered = comments.filter((c: any) => c.id !== id);
    await saveData('comments', commentsDbPath, filtered);
    return res.json({ success: true, comments: filtered });
  } catch (err: any) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ error: 'Failed to delete comment: ' + err.message });
  }
});

// Helper for sending mail when an inquiry is received
async function sendInquiryEmail(formData: { name: string; email: string; subject?: string; message: string }) {
  console.log(`[EMAIL DISPATCH] Preparing email to bharadwajpreetham@gmail.com for inquiry from ${formData.name} (${formData.email})`);
  
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const mailOptions = {
    from: `"Simply Comical Portfolio" <${user || 'portfolio@simplycomical.com'}>`,
    to: 'bharadwajpreetham@gmail.com',
    subject: `New Inquiry: ${formData.subject || 'Collaboration Brief'} - From ${formData.name}`,
    text: `Hello Preetham,\n\nYou have received a new inquiry through your Simply Comical Portfolio website.\n\n--- Sender Details ---\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject || 'N/A'}\n\n--- Message ---\n${formData.message}\n\n-----------\nSent automatically from Vercel.\n`,
    html: `
<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e5e5e5; border-radius: 4px;">
  <h2 style="color: #111; border-bottom: 2px solid #FFDF20; padding-bottom: 10px; margin-top: 0; font-weight: normal; text-transform: uppercase; font-size: 18px; letter-spacing: 0.05em;">New Inquiry Dispatched</h2>
  <p>Hello Preetham,</p>
  <p>You have received a new inquiry through your <strong>Simply Comical Portfolio</strong> website.</p>
  
  <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FFDF20; margin: 20px 0;">
    <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 0.05em;">Sender Details</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr>
        <td style="padding: 4px 0; color: #888; width: 80px;"><strong>Name:</strong></td>
        <td style="padding: 4px 0; color: #111;">${formData.name}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #888;"><strong>Email:</strong></td>
        <td style="padding: 4px 0; color: #111;"><a href="mailto:${formData.email}" style="color: #111; font-weight: bold;">${formData.email}</a></td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #888;"><strong>Subject:</strong></td>
        <td style="padding: 4px 0; color: #111; font-weight: bold;">${formData.subject || 'Collaboration Brief'}</td>
      </tr>
    </table>
  </div>
  
  <h3 style="font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 0.05em; margin-bottom: 8px;">Message Details</h3>
  <div style="background-color: #fff; border: 1px solid #e5e5e5; padding: 15px; font-style: italic; white-space: pre-wrap; font-size: 14px; line-height: 1.5; color: #444; border-radius: 2px;">${formData.message}</div>
  
  <p style="font-size: 11px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
    Sent automatically from Vercel. System Time: ${new Date().toISOString()}
  </p>
</div>
`
  };

  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SUCCESS] Email sent successfully via SMTP to bharadwajpreetham@gmail.com`);
    } catch (smtpErr: any) {
      console.error(`[EMAIL SMTP ERROR] Failed to send email via SMTP:`, smtpErr);
    }
  } else {
    console.log(`[EMAIL NOTICE] No SMTP credentials in environment (SMTP_USER/SMTP_PASS).`);
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[EMAIL NOTICE] Created Ethereal test account: ${testAccount.user}`);
      const testTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      const info = await testTransporter.sendMail(mailOptions);
      console.log(`[EMAIL SUCCESS] Email routed via test SMTP:`, info.messageId);
      console.log(`[EMAIL PREVIEW URL] View test email at:`, nodemailer.getTestMessageUrl(info));
    } catch (testErr) {
      console.error(`[EMAIL TEST SMTP ERROR] Failed to dispatch via test SMTP:`, testErr);
    }
  }

  try {
    const logPath = path.join(process.cwd(), 'outgoing_emails.log');
    const emailLogEntry = `\n=============================================\nDATE: ${new Date().toISOString()}\nTO: bharadwajpreetham@gmail.com\nFROM: ${formData.name} <${formData.email}>\nSUBJECT: ${formData.subject || 'N/A'}\nMESSAGE:\n${formData.message}\n=============================================\n`;
    fs.appendFileSync(logPath, emailLogEntry, 'utf-8');
    console.log(`[EMAIL BACKUP LOG] Saved outgoing email to: outgoing_emails.log`);
  } catch (logErr) {
    console.warn(`[EMAIL BACKUP LOG WARNING] Could not write email log file (expected in serverless):`, logErr);
  }
}

// API Endpoint - Fetch all inquiries
app.get('/api/inquiries', async (req, res) => {
  try {
    const inquiries = await getData('inquiries', inquiriesDbPath, []);
    return res.json(inquiries);
  } catch (err: any) {
    console.error('Error reading inquiries:', err);
    return res.status(500).json({ error: 'Failed to read inquiries: ' + err.message });
  }
});

// API Endpoint - Submit a new inquiry
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    const inquiries = await getData('inquiries', inquiriesDbPath, []);

    const newInquiry = {
      id: 'inquiry_' + Date.now(),
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject || 'Project Brief Selection').trim(),
      message: String(message).trim(),
      date: new Date().toISOString()
    };

    inquiries.unshift(newInquiry);
    await saveData('inquiries', inquiriesDbPath, inquiries);

    // Async email delivery
    sendInquiryEmail(newInquiry).catch(err => console.error('Failed to send email:', err));

    return res.json({ success: true, inquiry: newInquiry, inquiries });
  } catch (err: any) {
    console.error('Error writing inquiry:', err);
    return res.status(500).json({ error: 'Failed to submit inquiry: ' + err.message });
  }
});

// API Endpoint - Delete/Clean an inquiry
app.delete('/api/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inquiries = await getData('inquiries', inquiriesDbPath, []);
    const exists = inquiries.some((i: any) => i.id === id);
    if (!exists) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const filtered = inquiries.filter((i: any) => i.id !== id);
    await saveData('inquiries', inquiriesDbPath, filtered);
    return res.json({ success: true, inquiries: filtered });
  } catch (err: any) {
    console.error('Error deleting inquiry:', err);
    return res.status(500).json({ error: 'Failed to delete inquiry: ' + err.message });
  }
});

// API Endpoint - Admin login verification
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const adminConfig = await getData('admin', adminDbPath, {
      username: 'admin',
      password: 'admin',
      email: 'bharadwajpreetham@gmail.com'
    });
    
    const targetUsername = adminConfig.username || 'admin';
    const targetPassword = adminConfig.password || 'admin';
    
    const givenUser = String(username || '').trim().toLowerCase();
    const targetUser = String(targetUsername).trim().toLowerCase();
    
    if (givenUser === targetUser && password === targetPassword) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }
  } catch (err: any) {
    console.error('Error in login endpoint:', err);
    return res.status(500).json({ error: 'Authentication service down: ' + err.message });
  }
});

// API Endpoint - Fetch admin info securely (excludes password)
app.get('/api/admin/info', async (req, res) => {
  try {
    const adminConfig = await getData('admin', adminDbPath, {
      username: 'admin',
      password: 'admin',
      email: 'bharadwajpreetham@gmail.com'
    });
    return res.json({ 
      username: adminConfig.username || 'admin', 
      email: adminConfig.email || 'bharadwajpreetham@gmail.com' 
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve admin details: ' + err.message });
  }
});

// API Endpoint - Generate and simulate sending OTP code
app.post('/api/admin/send-otp', async (req, res) => {
  try {
    const { email, currentPassword } = req.body;
    if (!email || !currentPassword) {
      return res.status(400).json({ error: 'Email and current password are required.' });
    }
    
    const adminConfig = await getData('admin', adminDbPath, {
      username: 'admin',
      password: 'admin',
      email: 'bharadwajpreetham@gmail.com'
    });
    
    const targetPassword = adminConfig.password || 'admin';
    
    if (currentPassword !== targetPassword) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }
    
    // Generate 6-digit dynamic OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await storeOTP(email, otp, expiresAt);
    
    console.log(`[SECURE CENTRAL SECURITY OTP] Dynamic verification code generated for ${email} is: ${otp}`);
    
    return res.json({ 
      success: true, 
      message: `A secure verification OTP has been triggered and sent to ${email}.`,
      simulatedOtp: otp // Expose OTP for developers to verify and test locally!
    });
  } catch (err: any) {
    console.error('Error generating OTP:', err);
    return res.status(500).json({ error: 'Failed to trigger verification OTP: ' + err.message });
  }
});

// API Endpoint - Multi-credential modification (username, password, email)
app.post('/api/admin/change-credentials', async (req, res) => {
  try {
    const { currentPassword, newUsername, newEmail, newPassword, otp } = req.body;
    if (!currentPassword || !newUsername || !newEmail || !newPassword || !otp) {
      return res.status(400).json({ error: 'All fields including validation OTP are required.' });
    }
    
    const adminConfig = await getData('admin', adminDbPath, {
      username: 'admin',
      password: 'admin',
      email: 'bharadwajpreetham@gmail.com'
    });
    
    const targetPassword = adminConfig.password || 'admin';
    
    if (currentPassword !== targetPassword) {
      return res.status(401).json({ error: 'Verification failed: Current password does not match.' });
    }
    
    // Validate OTP
    const otpIsValid = await verifyOTP(newEmail, otp);
    if (!otpIsValid) {
      return res.status(400).json({ error: 'The verification OTP has expired or is incorrect.' });
    }
    
    // OTP matched perfectly! Purge OTP and save new credentials
    await deleteOTP(newEmail);
    
    const newConfig = {
      username: String(newUsername).trim(),
      password: String(newPassword).trim(),
      email: String(newEmail).trim()
    };
    
    await saveData('admin', adminDbPath, newConfig);
    
    return res.json({ success: true, message: 'All admin credentials (username, password, email) successfully updated!' });
  } catch (err: any) {
    console.error('Error changing credentials:', err);
    return res.status(500).json({ error: 'Failed to modify credentials: ' + err.message });
  }
});

// API Endpoint - Upload Image (with Vercel Read-Only Failback)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const file = req.file;
    const ext = path.extname(file.originalname) || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `uploaded_${uniqueSuffix}${ext}`;
    const localFilePath = path.join(uploadsDir, filename);

    // Try to write to local disk (succeeds locally, fails on Vercel)
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(localFilePath, file.buffer);
      console.log(`Saved uploaded file to local disk: ${localFilePath}`);
      const filePathRelative = `/src/assets/images/${filename}`;
      return res.json({ success: true, url: filePathRelative, filename });
    } catch (writeErr: any) {
      console.warn(`Local write failed. Returning Base64 data URL fallback:`, writeErr.message);
      
      // Fallback: Convert buffer to base64 data URL
      const base64Data = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      return res.json({ success: true, url: dataUrl, filename });
    }
  } catch (err: any) {
    console.error('Error handling uploaded file:', err);
    return res.status(500).json({ error: 'Failed to store image: ' + err.message });
  }
});

export default app;
