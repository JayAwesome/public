const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate Limiting
const isProduction = process.env.NODE_ENV === 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 10 : 200,
  skip: (req) => req.user?.isAdmin,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many assessment submissions. Please wait and try again later.' });
  },
});

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// CSRF Protection
const csrfProtection = csrf({ cookie: true });

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Apply general rate limiting to API routes only (exclude static assets)
app.use('/api', limiter);

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Routes

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/api/submit-assessment', submitLimiter, csrfProtection, (req, res) => {
  try {
    const { answers } = req.body;

    // Input validation
    if (!answers || !Array.isArray(answers) || answers.length !== 12) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const validAnswers = answers.every(a => [0, 1].includes(parseInt(a)));
    if (!validAnswers) {
      return res.status(400).json({ error: 'Invalid answer values' });
    }

    // Calculate risk
    const riskScore = calculateRisk(answers);
    const assessmentId = uuidv4();

    // Log assessment
    logAssessment(assessmentId, riskScore, req.ip);

    res.json({
      success: true,
      assessmentId,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
    });
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/generate-pdf', submitLimiter, csrfProtection, (req, res) => {
  try {
    const { answers, assessmentId } = req.body;

    if (!answers || !assessmentId) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const riskScore = calculateRisk(answers);
    const riskLevel = getRiskLevel(riskScore);

    const doc = new PDFDocument();
    const filename = `assessment_${assessmentId}.pdf`;
    const filepath = path.join(__dirname, 'reports', filename);

    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports');
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // PDF Content
    doc.fontSize(20).text('CyberSafe Local - Risk Assessment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Assessment ID: ${assessmentId}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Risk Assessment Results', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Risk Score: ${riskScore}/12`);
    doc.text(`Risk Level: ${riskLevel}`);
    doc.moveDown();

    const questions = [
      'Strong, unique passwords',
      'Two-Factor Authentication',
      'Weekly data backups',
      'Regular system updates',
      'Antivirus software',
      'Separate user accounts',
      'Restricted admin privileges',
      'Staff phishing training',
      'Secured Wi-Fi encryption',
      'Secure data storage',
      'Incident response plan',
      'Login activity monitoring',
    ];

    doc.text('Detailed Answers:', { underline: true });
    answers.forEach((answer, index) => {
      const answerValue = parseInt(answer);
      doc.text(`${index + 1}. ${questions[index]}: ${answerValue === 0 ? 'Yes' : 'No'}`);
    });

    doc.moveDown();
    doc.text('Recommendations:', { underline: true });
    doc.text(getRecommendations(riskScore));

    doc.end();

    stream.on('finish', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(filepath);
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper Functions
function calculateRisk(answers) {
  return answers.reduce((sum, answer) => sum + parseInt(answer), 0);
}

function getRiskLevel(score) {
  if (score <= 2) return 'Low Risk';
  if (score <= 5) return 'Medium Risk';
  if (score <= 8) return 'High Risk';
  return 'Critical Risk';
}

function getRecommendations(score) {
  if (score <= 2) return 'Your organization has strong cybersecurity practices. Continue monitoring and regular updates.';
  if (score <= 5) return 'Implement the missing security measures listed above to reduce risk.';
  if (score <= 8) return 'Urgent: Address the critical gaps in your cybersecurity posture immediately.';
  return 'Critical: Your organization is at severe risk. Implement all recommended measures immediately.';
}

function logAssessment(assessmentId, riskScore, ip) {
  const logEntry = `[${new Date().toISOString()}] Assessment ${assessmentId} - Risk Score: ${riskScore} - IP: ${ip}\n`;
  fs.appendFileSync('logs/assessments.log', logEntry, { flag: 'a' });
}

// React Router Catch-All
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// Error Handling
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ error: 'Invalid CSRF token' });
  } else {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!fs.existsSync('logs')) fs.mkdirSync('logs');
});