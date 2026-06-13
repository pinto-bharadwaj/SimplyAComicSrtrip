var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// api/index.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_nodemailer = __toESM(require("nodemailer"), 1);

// api/auth.ts
var import_crypto = __toESM(require("crypto"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "simply-comical-default-fallback-key-2026";
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("[SECURITY WARNING] JWT_SECRET is not configured. Falling back to default session key in production.");
}
function generateToken(payload, expiresInMs = 2 * 60 * 60 * 1e3) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + expiresInMs })).toString("base64url");
  const signature = import_crypto.default.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = import_crypto.default.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}
function generateSalt() {
  return import_crypto.default.randomBytes(16).toString("hex");
}
function hashPassword(password, salt) {
  return import_crypto.default.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Access Denied: Missing authentication token." });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Access Denied: Session token is invalid or expired." });
  }
  req.adminUser = { username: payload.username };
  next();
}

// api/index.ts
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
var uploadsDir = import_path.default.join(__dirname, "..", "src", "assets", "images");
var dbPath = import_path.default.join(__dirname, "..", "src", "projects.json");
var categoriesDbPath = import_path.default.join(__dirname, "..", "src", "categories.json");
var sectionsDbPath = import_path.default.join(__dirname, "..", "src", "sections.json");
var commentsDbPath = import_path.default.join(__dirname, "..", "src", "comments.json");
var adminDbPath = import_path.default.join(__dirname, "..", "src", "admin.json");
var inquiriesDbPath = import_path.default.join(__dirname, "..", "src", "inquiries.json");
var configPath = import_path.default.join(__dirname, "..", "firebase-applet-config.json");
var db = null;
if (import_fs.default.existsSync(configPath)) {
  try {
    const firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
    const fbApp = (0, import_app.initializeApp)(firebaseConfig);
    db = (0, import_firestore.initializeFirestore)(fbApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully from config file with database ID:", firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error("Failed to initialize Firebase from config file:", err);
  }
} else {
  const firebaseConfigStr = process.env.FIREBASE_CONFIG;
  if (firebaseConfigStr) {
    try {
      const firebaseConfig = JSON.parse(firebaseConfigStr);
      const fbApp = (0, import_app.initializeApp)(firebaseConfig);
      db = (0, import_firestore.initializeFirestore)(fbApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
      console.log("Firebase initialized successfully from environment variable.");
    } catch (err) {
      console.error("Failed to initialize Firebase from environment variable:", err);
    }
  } else {
    console.log("No firebase-applet-config.json or FIREBASE_CONFIG env found. Falling back to local files.");
  }
}
var otpStorage = /* @__PURE__ */ new Map();
async function storeOTP(email, otp, expiresAt) {
  const emailKey = email.trim().toLowerCase();
  otpStorage.set(emailKey, { otp, expiresAt });
  if (db) {
    try {
      const docRef = (0, import_firestore.doc)(db, "otps", emailKey);
      await (0, import_firestore.setDoc)(docRef, { otp, expiresAt });
      console.log(`Stored OTP in Firestore for ${emailKey}`);
    } catch (err) {
      console.error(`Failed to store OTP in Firestore for ${emailKey}:`, err);
    }
  }
}
async function verifyOTP(email, otp) {
  const emailKey = email.trim().toLowerCase();
  let cached = otpStorage.get(emailKey);
  if (db) {
    try {
      const docRef = (0, import_firestore.doc)(db, "otps", emailKey);
      const docSnap = await (0, import_firestore.getDoc)(docRef);
      if (docSnap.exists()) {
        cached = docSnap.data();
      }
    } catch (err) {
      console.error(`Failed to fetch OTP from Firestore for ${emailKey}:`, err);
    }
  }
  if (!cached) return false;
  if (cached.expiresAt < Date.now()) return false;
  return cached.otp === otp.trim();
}
async function deleteOTP(email) {
  const emailKey = email.trim().toLowerCase();
  otpStorage.delete(emailKey);
  if (db) {
    try {
      const docRef = (0, import_firestore.doc)(db, "otps", emailKey);
      await (0, import_firestore.setDoc)(docRef, { otp: "", expiresAt: 0 });
    } catch (err) {
      console.error(`Failed to clear OTP from Firestore for ${emailKey}:`, err);
    }
  }
}
function readLocalFile(filePath, defaultData) {
  try {
    if (import_fs.default.existsSync(filePath)) {
      const raw = import_fs.default.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading local file ${filePath}:`, err);
  }
  return defaultData;
}
async function getData(collectionName, filePath, defaultData) {
  if (db) {
    try {
      const docRef = (0, import_firestore.doc)(db, "cms_sync", collectionName);
      const docSnap = await (0, import_firestore.getDoc)(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        if (cloudData) {
          return cloudData;
        }
      }
      const localData = readLocalFile(filePath, defaultData);
      await (0, import_firestore.setDoc)(docRef, { data: localData });
      return localData;
    } catch (err) {
      console.error(`Error reading ${collectionName} from Firestore, falling back to local:`, err);
    }
  }
  return readLocalFile(filePath, defaultData);
}
async function saveData(collectionName, filePath, data) {
  if (db) {
    try {
      const docRef = (0, import_firestore.doc)(db, "cms_sync", collectionName);
      await (0, import_firestore.setDoc)(docRef, { data });
      console.log(`Saved ${collectionName} to Firestore.`);
    } catch (err) {
      console.error(`Error saving ${collectionName} to Firestore:`, err);
    }
  }
  try {
    if (!import_fs.default.existsSync(import_path.default.dirname(filePath))) {
      import_fs.default.mkdirSync(import_path.default.dirname(filePath), { recursive: true });
    }
    import_fs.default.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`Local file write failed for ${filePath} (expected in read-only serverless environments): ${err.message}`);
    try {
      const tmpDir = import_path.default.join("/tmp", "src");
      if (!import_fs.default.existsSync(tmpDir)) {
        import_fs.default.mkdirSync(tmpDir, { recursive: true });
      }
      const tmpPath = import_path.default.join(tmpDir, import_path.default.basename(filePath));
      import_fs.default.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (tmpErr) {
    }
  }
}
var upload = (0, import_multer.default)({
  storage: import_multer.default.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB file limit
});
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await getData("categories", categoriesDbPath, [
      { "id": "all", "name": "All Projects" },
      { "id": "comics", "name": "Comics" },
      { "id": "science_illustrations", "name": "Science Illustrations" },
      { "id": "workshops", "name": "Workshops" },
      { "id": "marketing", "name": "Campaigns & Marketing" },
      { "id": "mascot_design", "name": "Mascot Design" }
    ]);
    return res.json(categories);
  } catch (err) {
    console.error("Error reading categories:", err);
    return res.status(500).json({ error: "Failed to read categories: " + err.message });
  }
});
app.post("/api/categories", authenticateToken, async (req, res) => {
  try {
    const categories = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: "Body must be a JSON array of categories" });
    }
    await saveData("categories", categoriesDbPath, categories);
    return res.json({ success: true, categories });
  } catch (err) {
    console.error("Error writing categories:", err);
    return res.status(500).json({ error: "Failed to write categories: " + err.message });
  }
});
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await getData("projects", dbPath, []);
    return res.json(projects);
  } catch (err) {
    console.error("Error reading projects:", err);
    return res.status(500).json({ error: "Failed to read database: " + err.message });
  }
});
app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const projects = req.body;
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: "Body must be a JSON array of projects" });
    }
    await saveData("projects", dbPath, projects);
    return res.json({ success: true, projects });
  } catch (err) {
    console.error("Error writing projects:", err);
    return res.status(500).json({ error: "Failed to write database: " + err.message });
  }
});
app.get("/api/sections", async (req, res) => {
  try {
    const sections = await getData("sections", sectionsDbPath, []);
    return res.json(sections);
  } catch (err) {
    console.error("Error reading sections:", err);
    return res.status(500).json({ error: "Failed to read sections: " + err.message });
  }
});
app.post("/api/sections", authenticateToken, async (req, res) => {
  try {
    const sections = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: "Body must be a JSON array of sections" });
    }
    await saveData("sections", sectionsDbPath, sections);
    return res.json({ success: true, sections });
  } catch (err) {
    console.error("Error writing sections:", err);
    return res.status(500).json({ error: "Failed to write sections: " + err.message });
  }
});
app.get("/api/comments", async (req, res) => {
  try {
    const comments = await getData("comments", commentsDbPath, []);
    return res.json(comments);
  } catch (err) {
    console.error("Error reading comments:", err);
    return res.status(500).json({ error: "Failed to read comments: " + err.message });
  }
});
app.post("/api/comments", async (req, res) => {
  try {
    const { name, text, rating } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: "Name and text are required fields" });
    }
    const comments = await getData("comments", commentsDbPath, []);
    const newComment = {
      id: "comment_" + Date.now(),
      name: String(name).trim(),
      text: String(text).trim(),
      rating: typeof rating === "number" ? rating : 5,
      date: (/* @__PURE__ */ new Date()).toISOString()
    };
    comments.unshift(newComment);
    await saveData("comments", commentsDbPath, comments);
    return res.json({ success: true, comment: newComment, comments });
  } catch (err) {
    console.error("Error saving comment:", err);
    return res.status(500).json({ error: "Failed to write comment: " + err.message });
  }
});
app.delete("/api/comments/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await getData("comments", commentsDbPath, []);
    const exists = comments.some((c) => c.id === id);
    if (!exists) {
      return res.status(404).json({ error: "Comment not found" });
    }
    const filtered = comments.filter((c) => c.id !== id);
    await saveData("comments", commentsDbPath, filtered);
    return res.json({ success: true, comments: filtered });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return res.status(500).json({ error: "Failed to delete comment: " + err.message });
  }
});
async function sendInquiryEmail(formData) {
  console.log(`[EMAIL DISPATCH] Preparing email to bharadwajpreetham@gmail.com for inquiry from ${formData.name} (${formData.email})`);
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const mailOptions = {
    from: `"Simply Comical Portfolio" <${user || "portfolio@simplycomical.com"}>`,
    to: "bharadwajpreetham@gmail.com",
    subject: `New Inquiry: ${formData.subject || "Collaboration Brief"} - From ${formData.name}`,
    text: `Hello Preetham,

You have received a new inquiry through your Simply Comical Portfolio website.

--- Sender Details ---
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject || "N/A"}

--- Message ---
${formData.message}

-----------
Sent automatically from Vercel.
`,
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
        <td style="padding: 4px 0; color: #111; font-weight: bold;">${formData.subject || "Collaboration Brief"}</td>
      </tr>
    </table>
  </div>
  
  <h3 style="font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 0.05em; margin-bottom: 8px;">Message Details</h3>
  <div style="background-color: #fff; border: 1px solid #e5e5e5; padding: 15px; font-style: italic; white-space: pre-wrap; font-size: 14px; line-height: 1.5; color: #444; border-radius: 2px;">${formData.message}</div>
  
  <p style="font-size: 11px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
    Sent automatically from Vercel. System Time: ${(/* @__PURE__ */ new Date()).toISOString()}
  </p>
</div>
`
  };
  if (user && pass) {
    try {
      const transporter = import_nodemailer.default.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SUCCESS] Email sent successfully via SMTP to bharadwajpreetham@gmail.com`);
    } catch (smtpErr) {
      console.error(`[EMAIL SMTP ERROR] Failed to send email via SMTP:`, smtpErr);
    }
  } else {
    console.log(`[EMAIL NOTICE] No SMTP credentials in environment (SMTP_USER/SMTP_PASS).`);
    try {
      const testAccount = await import_nodemailer.default.createTestAccount();
      console.log(`[EMAIL NOTICE] Created Ethereal test account: ${testAccount.user}`);
      const testTransporter = import_nodemailer.default.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      const info = await testTransporter.sendMail(mailOptions);
      console.log(`[EMAIL SUCCESS] Email routed via test SMTP:`, info.messageId);
      console.log(`[EMAIL PREVIEW URL] View test email at:`, import_nodemailer.default.getTestMessageUrl(info));
    } catch (testErr) {
      console.error(`[EMAIL TEST SMTP ERROR] Failed to dispatch via test SMTP:`, testErr);
    }
  }
  try {
    const logPath = import_path.default.join(process.cwd(), "outgoing_emails.log");
    const emailLogEntry = `
=============================================
DATE: ${(/* @__PURE__ */ new Date()).toISOString()}
TO: bharadwajpreetham@gmail.com
FROM: ${formData.name} <${formData.email}>
SUBJECT: ${formData.subject || "N/A"}
MESSAGE:
${formData.message}
=============================================
`;
    import_fs.default.appendFileSync(logPath, emailLogEntry, "utf-8");
    console.log(`[EMAIL BACKUP LOG] Saved outgoing email to: outgoing_emails.log`);
  } catch (logErr) {
    console.warn(`[EMAIL BACKUP LOG WARNING] Could not write email log file (expected in serverless):`, logErr);
  }
}
async function sendOTPEmail(email, otp) {
  console.log(`[OTP EMAIL] Sending verification code ${otp} to ${email}`);
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const mailOptions = {
    from: `"Simply Comical Security" <${user || "security@simplycomical.com"}>`,
    to: email,
    subject: `Secure OTP: ${otp} - Admin Panel Verification`,
    text: `Hello,

You have requested an administrative credential update on your Simply Comical Portfolio website.

Your secure verification code is: ${otp}

This OTP is valid for 10 minutes. If you did not request this update, please ignore this email and review your admin panel access immediately.

Sent automatically from Vercel.
`,
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
    Sent automatically from Vercel. System Time: ${(/* @__PURE__ */ new Date()).toISOString()}
  </p>
</div>
`
  };
  if (user && pass) {
    try {
      const transporter = import_nodemailer.default.createTransport({
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
app.get("/api/inquiries", authenticateToken, async (req, res) => {
  try {
    const inquiries = await getData("inquiries", inquiriesDbPath, []);
    return res.json(inquiries);
  } catch (err) {
    console.error("Error reading inquiries:", err);
    return res.status(500).json({ error: "Failed to read inquiries: " + err.message });
  }
});
app.post("/api/inquiries", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required fields." });
    }
    const inquiries = await getData("inquiries", inquiriesDbPath, []);
    const newInquiry = {
      id: "inquiry_" + Date.now(),
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject || "Project Brief Selection").trim(),
      message: String(message).trim(),
      date: (/* @__PURE__ */ new Date()).toISOString()
    };
    inquiries.unshift(newInquiry);
    await saveData("inquiries", inquiriesDbPath, inquiries);
    sendInquiryEmail(newInquiry).catch((err) => console.error("Failed to send email:", err));
    return res.json({ success: true, inquiry: newInquiry, inquiries });
  } catch (err) {
    console.error("Error writing inquiry:", err);
    return res.status(500).json({ error: "Failed to submit inquiry: " + err.message });
  }
});
app.delete("/api/inquiries/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inquiries = await getData("inquiries", inquiriesDbPath, []);
    const exists = inquiries.some((i) => i.id === id);
    if (!exists) {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    const filtered = inquiries.filter((i) => i.id !== id);
    await saveData("inquiries", inquiriesDbPath, filtered);
    return res.json({ success: true, inquiries: filtered });
  } catch (err) {
    console.error("Error deleting inquiry:", err);
    return res.status(500).json({ error: "Failed to delete inquiry: " + err.message });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const adminConfig = await getData("admin", adminDbPath, {
      username: "admin",
      password: "admin",
      email: "bharadwajpreetham@gmail.com"
    });
    const targetUsername = adminConfig.username || "admin";
    const givenUser = String(username || "").trim().toLowerCase();
    const targetUser = String(targetUsername).trim().toLowerCase();
    let isPasswordCorrect = false;
    if (adminConfig.passwordHash && adminConfig.salt) {
      const computedHash = hashPassword(password, adminConfig.salt);
      isPasswordCorrect = computedHash === adminConfig.passwordHash;
    } else if (adminConfig.password) {
      isPasswordCorrect = password === adminConfig.password;
      if (isPasswordCorrect) {
        const salt = generateSalt();
        const passwordHash = hashPassword(password, salt);
        const upgradedConfig = {
          username: targetUsername,
          passwordHash,
          salt,
          email: adminConfig.email || "bharadwajpreetham@gmail.com"
        };
        await saveData("admin", adminDbPath, upgradedConfig);
        console.log("Admin password upgraded to secure hash format successfully.");
      }
    }
    if (givenUser === targetUser && isPasswordCorrect) {
      const token = generateToken({ username: targetUsername });
      return res.json({ success: true, token });
    } else {
      return res.status(401).json({ error: "Incorrect username or password." });
    }
  } catch (err) {
    console.error("Error in login endpoint:", err);
    return res.status(500).json({ error: "Authentication service down: " + err.message });
  }
});
app.get("/api/admin/info", authenticateToken, async (req, res) => {
  try {
    const adminConfig = await getData("admin", adminDbPath, {
      username: "admin",
      password: "admin",
      email: "bharadwajpreetham@gmail.com"
    });
    return res.json({
      username: adminConfig.username || "admin",
      email: adminConfig.email || "bharadwajpreetham@gmail.com"
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve admin details: " + err.message });
  }
});
app.post("/api/admin/send-otp", authenticateToken, async (req, res) => {
  try {
    const { email, currentPassword } = req.body;
    if (!email || !currentPassword) {
      return res.status(400).json({ error: "Email and current password are required." });
    }
    const adminConfig = await getData("admin", adminDbPath, {
      username: "admin",
      password: "admin",
      email: "bharadwajpreetham@gmail.com"
    });
    const currentPasswordCorrect = adminConfig.passwordHash && adminConfig.salt ? hashPassword(currentPassword, adminConfig.salt) === adminConfig.passwordHash : currentPassword === adminConfig.password;
    if (!currentPasswordCorrect) {
      return res.status(401).json({ error: "Current password does not match." });
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 10 * 60 * 1e3;
    await storeOTP(email, otp, expiresAt);
    console.log(`[SECURE CENTRAL SECURITY OTP] Dynamic verification code generated for ${email} is: ${otp}`);
    sendOTPEmail(email, otp).catch((err) => console.error("Failed to send OTP email:", err));
    const isProduction = process.env.NODE_ENV === "production";
    return res.json({
      success: true,
      message: `A secure verification OTP has been triggered and sent to ${email}.`,
      // Expose OTP for developers to verify and test locally, but hide in production!
      ...!isProduction ? { simulatedOtp: otp } : {}
    });
  } catch (err) {
    console.error("Error generating OTP:", err);
    return res.status(500).json({ error: "Failed to trigger verification OTP: " + err.message });
  }
});
app.post("/api/admin/change-credentials", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newUsername, newEmail, newPassword, otp } = req.body;
    if (!currentPassword || !newUsername || !newEmail || !newPassword || !otp) {
      return res.status(400).json({ error: "All fields including validation OTP are required." });
    }
    const adminConfig = await getData("admin", adminDbPath, {
      username: "admin",
      password: "admin",
      email: "bharadwajpreetham@gmail.com"
    });
    const currentPasswordCorrect = adminConfig.passwordHash && adminConfig.salt ? hashPassword(currentPassword, adminConfig.salt) === adminConfig.passwordHash : currentPassword === adminConfig.password;
    if (!currentPasswordCorrect) {
      return res.status(401).json({ error: "Verification failed: Current password does not match." });
    }
    const otpIsValid = await verifyOTP(newEmail, otp);
    if (!otpIsValid) {
      return res.status(400).json({ error: "The verification OTP has expired or is incorrect." });
    }
    await deleteOTP(newEmail);
    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);
    const newConfig = {
      username: String(newUsername).trim(),
      passwordHash,
      salt,
      email: String(newEmail).trim()
    };
    await saveData("admin", adminDbPath, newConfig);
    return res.json({ success: true, message: "All admin credentials (username, password, email) successfully updated!" });
  } catch (err) {
    console.error("Error changing credentials:", err);
    return res.status(500).json({ error: "Failed to modify credentials: " + err.message });
  }
});
app.post("/api/upload", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const file = req.file;
    const ext = import_path.default.extname(file.originalname) || ".png";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `uploaded_${uniqueSuffix}${ext}`;
    const localFilePath = import_path.default.join(uploadsDir, filename);
    try {
      if (!import_fs.default.existsSync(uploadsDir)) {
        import_fs.default.mkdirSync(uploadsDir, { recursive: true });
      }
      import_fs.default.writeFileSync(localFilePath, file.buffer);
      console.log(`Saved uploaded file to local disk: ${localFilePath}`);
      const filePathRelative = `/src/assets/images/${filename}`;
      return res.json({ success: true, url: filePathRelative, filename });
    } catch (writeErr) {
      console.warn(`Local write failed. Returning Base64 data URL fallback:`, writeErr.message);
      const base64Data = file.buffer.toString("base64");
      const mimeType = file.mimetype || "image/png";
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return res.json({ success: true, url: dataUrl, filename });
    }
  } catch (err) {
    console.error("Error handling uploaded file:", err);
    return res.status(500).json({ error: "Failed to store image: " + err.message });
  }
});
var api_default = app;

// server.ts
async function startServer() {
  const PORT = 3e3;
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    api_default.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    api_default.use(import_express2.default.static(distPath));
    api_default.use("/src/assets", import_express2.default.static(import_path2.default.join(process.cwd(), "src", "assets")));
    api_default.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
    console.log("Production static asset serving loaded.");
  }
  api_default.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
