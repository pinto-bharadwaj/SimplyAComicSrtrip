import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createClient } from '@sanity/client';
import nodemailer from 'nodemailer';
import { authenticateToken, generateToken, hashPassword, generateSalt, AuthenticatedRequest } from './auth';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON Body parser with larger limit for complex images descriptions or potential inline data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Paths resolved relative to current working directory (project root)
const uploadsDir = path.join(__dirname, '..', 'src', 'assets', 'images');
const dbPath = path.join(__dirname, '..', 'src', 'projects.json');
const categoriesDbPath = path.join(__dirname, '..', 'src', 'categories.json');
const sectionsDbPath = path.join(__dirname, '..', 'src', 'sections.json');
const commentsDbPath = path.join(__dirname, '..', 'src', 'comments.json');
const adminDbPath = path.join(__dirname, '..', 'src', 'admin.json');
const inquiriesDbPath = path.join(__dirname, '..', 'src', 'inquiries.json');

// Initialize Sanity Client from environment variables
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiToken = process.env.SANITY_API_TOKEN;

let sanityClient: any = null;

if (projectId && apiToken) {
  try {
    sanityClient = createClient({
      projectId,
      dataset,
      useCdn: false, // Set to false for write/real-time read, true for fast cached reads
      apiVersion: '2023-05-03',
      token: apiToken,
    });
    console.log(`Sanity client initialized successfully for project ${projectId}, dataset ${dataset}.`);
  } catch (err) {
    console.error('Failed to initialize Sanity client:', err);
  }
} else {
  console.log('No SANITY_PROJECT_ID or SANITY_API_TOKEN found in environment. Falling back to local files.');
}

const typeMap: Record<string, string> = {
  projects: 'project',
  categories: 'category',
  sections: 'section',
  comments: 'comment',
  inquiries: 'inquiry',
  admin: 'admin',
};

// OTP stored state fallback (used in local development or if DB fails)
const otpStorage = new Map<string, { otp: string; expiresAt: number }>();

// Helper functions for storing and validating OTPs across serverless instances
async function storeOTP(email: string, otp: string, expiresAt: number) {
  const emailKey = email.trim().toLowerCase();
  otpStorage.set(emailKey, { otp, expiresAt });
  if (sanityClient) {
    try {
      const docId = `otp_${emailKey.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      await sanityClient.createOrReplace({
        _type: 'otp',
        _id: docId,
        email: emailKey,
        otp,
        expiresAt,
      });
      console.log(`Stored OTP in Sanity for ${emailKey}`);
    } catch (err) {
      console.error(`Failed to store OTP in Sanity for ${emailKey}:`, err);
    }
  }
}

async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const emailKey = email.trim().toLowerCase();
  let cached = otpStorage.get(emailKey);

  if (sanityClient) {
    try {
      const docId = `otp_${emailKey.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const res = await sanityClient.fetch(`*[_type == "otp" && _id == $docId][0]`, { docId });
      if (res) {
        cached = { otp: res.otp, expiresAt: res.expiresAt };
      }
    } catch (err) {
      console.error(`Failed to fetch OTP from Sanity for ${emailKey}:`, err);
    }
  }

  if (!cached) return false;
  if (cached.expiresAt < Date.now()) return false;
  return cached.otp === otp.trim();
}

async function deleteOTP(email: string) {
  const emailKey = email.trim().toLowerCase();
  otpStorage.delete(emailKey);
  if (sanityClient) {
    try {
      const docId = `otp_${emailKey.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      await sanityClient.delete(docId);
      console.log(`Deleted OTP from Sanity for ${emailKey}`);
    } catch (err) {
      console.error(`Failed to clear OTP from Sanity for ${emailKey}:`, err);
    }
  }
}

// Helper functions for reading and writing data (using Sanity with Local file fallbacks)
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

function saveLocalFile(filePath: string, data: any) {
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

async function getData(collectionName: string, filePath: string, defaultData: any) {
  const docType = typeMap[collectionName];
  if (sanityClient && docType) {
    try {
      if (collectionName === 'admin') {
        const cloudData = await sanityClient.fetch(`*[_type == "admin" && _id == "admin_settings"][0]`);
        if (cloudData) {
          return cloudData;
        }
        // Seed admin to Sanity if not exists
        const localData = readLocalFile(filePath, defaultData);
        await sanityClient.createOrReplace({
          _type: 'admin',
          _id: 'admin_settings',
          ...localData,
        });
        return localData;
      } else {
        let query = `*[_type == $docType]`;
        if (collectionName === 'comments' || collectionName === 'inquiries') {
          query += ` | order(date desc)`;
        }
        const cloudData = await sanityClient.fetch(query, { docType });
        if (cloudData && cloudData.length > 0) {
          // Map _id to id for client compatibility
          return cloudData.map((item: any) => ({
            ...item,
            id: item._id,
          }));
        }

        // Seed Sanity if it returned no documents
        const localData = readLocalFile(filePath, defaultData);
        if (Array.isArray(localData) && localData.length > 0) {
          console.log(`Seeding Sanity collection "${collectionName}" from local file...`);
          const transaction = sanityClient.transaction();
          localData.forEach((item: any) => {
            let id = item.id || item._id;
            if (!id) {
              id = `${docType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }
            const docToSave = {
              ...item,
              _type: docType,
              _id: id,
            };
            delete docToSave.id;
            transaction.createOrReplace(docToSave);
          });
          await transaction.commit();
          console.log(`Seeding of "${collectionName}" completed.`);
        }
        return localData;
      }
    } catch (err) {
      console.error(`Error reading ${collectionName} from Sanity, falling back to local:`, err);
    }
  }
  return readLocalFile(filePath, defaultData);
}

async function saveData(collectionName: string, filePath: string, data: any) {
  const docType = typeMap[collectionName];
  if (sanityClient && docType) {
    try {
      if (collectionName === 'admin') {
        await sanityClient.createOrReplace({
          _type: 'admin',
          _id: 'admin_settings',
          ...data,
        });
        console.log(`Saved admin settings to Sanity.`);
      } else if (Array.isArray(data)) {
        console.log(`Syncing array for ${collectionName} to Sanity...`);
        // Get existing document IDs in Sanity of this type
        const existingDocs = await sanityClient.fetch(`*[_type == $docType]{_id}`, { docType });
        const existingIds = existingDocs.map((doc: any) => doc._id);

        const incomingIds = new Set<string>();
        const transaction = sanityClient.transaction();

        data.forEach((item: any) => {
          let id = item.id || item._id;
          if (!id) {
            id = `${docType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          }
          const docToSave = {
            ...item,
            _type: docType,
            _id: id,
          };
          delete docToSave.id;
          transaction.createOrReplace(docToSave);
          incomingIds.add(id);
        });

        // Delete items that are in Sanity but not in the incoming array
        const idsToDelete = existingIds.filter((id: string) => !incomingIds.has(id));
        idsToDelete.forEach((id: string) => {
          transaction.delete(id);
        });

        await transaction.commit();
        console.log(`Successfully synced ${collectionName} to Sanity. Created/Updated: ${data.length}, Deleted: ${idsToDelete.length}`);
      }
    } catch (err) {
      console.error(`Error saving ${collectionName} to Sanity:`, err);
    }
  }

  saveLocalFile(filePath, data);
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
app.post('/api/categories', authenticateToken, async (req, res) => {
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
app.post('/api/projects', authenticateToken, async (req, res) => {
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
app.post('/api/sections', authenticateToken, async (req, res) => {
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
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
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

// Helper for sending verification OTP via email
async function sendOTPEmail(email: string, otp: string) {
  console.log(`[OTP EMAIL] Sending verification code ${otp} to ${email}`);
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const mailOptions = {
    from: `"Simply Comical Security" <${user || 'security@simplycomical.com'}>`,
    to: email,
    subject: `Secure OTP: ${otp} - Admin Panel Verification`,
    text: `Hello,\n\nYou have requested an administrative credential update on your Simply Comical Portfolio website.\n\nYour secure verification code is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this update, please ignore this email and review your admin panel access immediately.\n\nSent automatically from Vercel.\n`,
    html: `
<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e5e5e5; border-radius: 4px;">
  <h2 style="color: #d32f2f; border-bottom: 2px solid #FFDF20; padding-bottom: 10px; margin-top: 0; font-weight: normal; text-transform: uppercase; font-size: 18px; letter-spacing: 0.05em;">Security OTP Dispatched</h2>
  <p>Hello,</p>
  <p>You have requested an administrative credential update on your <strong>Simply Comical Portfolio</strong> website.</p>
  
  <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #d32f2f; margin: 20px 0; text-align: center;">
    <p style="margin-top: 0; font-size: 13px; text-transform: uppercase; color: #666; letter-spacing: 0.05em;">Verification Code</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 0.2em; color: #111; margin: 10px 0;">${otp}</div>
    <p style="margin-bottom: 0; font-size: 11px; color: #888;">Valid for 10 minutes from receipt.</p>
  </div>
  
  <p>If you did not initiate this request, please ignore this email and verify your administrator console security rules.</p>
  
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
      console.log(`[OTP EMAIL SUCCESS] OTP sent successfully via SMTP to ${email}`);
    } catch (smtpErr) {
      console.error(`[OTP EMAIL SMTP ERROR] Failed to send OTP email:`, smtpErr);
    }
  } else {
    console.log(`[OTP EMAIL NOTICE] No SMTP credentials. OTP verification code is: ${otp}`);
  }
}

// API Endpoint - Fetch all inquiries
app.get('/api/inquiries', authenticateToken, async (req, res) => {
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
app.delete('/api/inquiries/:id', authenticateToken, async (req, res) => {
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
    const givenUser = String(username || '').trim().toLowerCase();
    const targetUser = String(targetUsername).trim().toLowerCase();
    
    let isPasswordCorrect = false;
    if (adminConfig.passwordHash && adminConfig.salt) {
      const computedHash = hashPassword(password, adminConfig.salt);
      isPasswordCorrect = (computedHash === adminConfig.passwordHash);
    } else if (adminConfig.password) {
      isPasswordCorrect = (password === adminConfig.password);
      // Automatically upgrade plain-text password to hashed!
      if (isPasswordCorrect) {
        const salt = generateSalt();
        const passwordHash = hashPassword(password, salt);
        const upgradedConfig = {
          username: targetUsername,
          passwordHash,
          salt,
          email: adminConfig.email || 'bharadwajpreetham@gmail.com'
        };
        await saveData('admin', adminDbPath, upgradedConfig);
        console.log('Admin password upgraded to secure hash format successfully.');
      }
    }
    
    if (givenUser === targetUser && isPasswordCorrect) {
      const token = generateToken({ username: targetUsername });
      return res.json({ success: true, token });
    } else {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }
  } catch (err: any) {
    console.error('Error in login endpoint:', err);
    return res.status(500).json({ error: 'Authentication service down: ' + err.message });
  }
});

// API Endpoint - Fetch admin info securely (excludes password)
app.get('/api/admin/info', authenticateToken, async (req, res) => {
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
app.post('/api/admin/send-otp', authenticateToken, async (req, res) => {
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
    
    const currentPasswordCorrect = adminConfig.passwordHash && adminConfig.salt
      ? hashPassword(currentPassword, adminConfig.salt) === adminConfig.passwordHash
      : currentPassword === adminConfig.password;
    
    if (!currentPasswordCorrect) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }
    
    // Generate 6-digit dynamic OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await storeOTP(email, otp, expiresAt);
    
    console.log(`[SECURE CENTRAL SECURITY OTP] Dynamic verification code generated for ${email} is: ${otp}`);
    
    // Async OTP email dispatch
    sendOTPEmail(email, otp).catch(err => console.error('Failed to send OTP email:', err));

    const isProduction = process.env.NODE_ENV === 'production';
    
    return res.json({ 
      success: true, 
      message: `A secure verification OTP has been triggered and sent to ${email}.`,
      // Expose OTP for developers to verify and test locally, but hide in production!
      ...(!isProduction ? { simulatedOtp: otp } : {})
    });
  } catch (err: any) {
    console.error('Error generating OTP:', err);
    return res.status(500).json({ error: 'Failed to trigger verification OTP: ' + err.message });
  }
});

// API Endpoint - Multi-credential modification (username, password, email)
app.post('/api/admin/change-credentials', authenticateToken, async (req, res) => {
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
    
    const currentPasswordCorrect = adminConfig.passwordHash && adminConfig.salt
      ? hashPassword(currentPassword, adminConfig.salt) === adminConfig.passwordHash
      : currentPassword === adminConfig.password;
    
    if (!currentPasswordCorrect) {
      return res.status(401).json({ error: 'Verification failed: Current password does not match.' });
    }
    
    // Validate OTP
    const otpIsValid = await verifyOTP(newEmail, otp);
    if (!otpIsValid) {
      return res.status(400).json({ error: 'The verification OTP has expired or is incorrect.' });
    }
    
    // OTP matched perfectly! Purge OTP and save new credentials
    await deleteOTP(newEmail);
    
    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);
    
    const newConfig = {
      username: String(newUsername).trim(),
      passwordHash,
      salt,
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
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
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
