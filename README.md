# CyberSafe Local

A cybersecurity risk self-assessment tool for SMEs (Small and Medium-sized Enterprises). This application helps organizations evaluate their security posture through a comprehensive questionnaire and generates risk reports.

## Features

- **12-Question Assessment**: Evaluate cybersecurity practices across key areas
- **Risk Scoring**: Automatic risk level calculation (Low, Medium, High, Critical)
- **PDF Report Generation**: Download detailed assessment reports
- **CSRF Protection**: Security-first approach with token validation
- **Rate Limiting**: Protection against abuse and unauthorized access
- **Encrypted Data**: TLS/SSL encryption for data in transit
- **Privacy Policy**: Compliant with GDPR, CCPA, and PIPEDA regulations

## Assessment Questions

1. Strong, unique passwords
2. Two-Factor Authentication (2FA)
3. Weekly data backups
4. Regular system updates
5. Antivirus software
6. Separate user accounts
7. Restricted admin privileges
8. Staff phishing training
9. Secured Wi-Fi encryption
10. Secure data storage
11. Incident response plan
12. Login activity monitoring

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express.js
- **Security**: 
  - CSRF protection (csurf)
  - Helmet.js for HTTP headers
  - Rate limiting (express-rate-limit)
  - Cookie-based session management
- **PDF Generation**: PDFKit
- **Additional**: dotenv for environment configuration

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/JayAwesome/cybersafe-local.git
cd cybersafe-local
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
ALLOWED_ORIGIN=http://localhost:3000
```

4. Start the server:
```bash
npm start
# or
node server.js
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
cybersafe-local/
├── index.html          # Main assessment form
├── privacy.html        # Privacy policy page
├── script.js          # Frontend logic
├── style.css          # Styling
├── server.js          # Express server and API routes
├── package.json       # Dependencies
├── .gitignore         # Git ignore rules
├── README.md          # This file
└── logs/              # Assessment logs (auto-created)
```

## API Endpoints

### GET `/api/csrf-token`
Fetch a CSRF token for form submission.

**Response:**
```json
{
  "csrfToken": "token-value"
}
```

### POST `/api/submit-assessment`
Submit assessment answers.

**Request Body:**
```json
{
  "answers": [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]
}
```

**Response:**
```json
{
  "success": true,
  "assessmentId": "uuid",
  "riskScore": 6,
  "riskLevel": "High Risk"
}
```

### POST `/api/generate-pdf`
Generate and download a PDF report.

**Request Body:**
```json
{
  "answers": [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0],
  "assessmentId": "uuid"
}
```

## Security Features

### CSRF Protection
- Cookie-based token validation
- Token required for all POST requests
- Automatic token generation and validation

### Rate Limiting
- General: 100 requests per 15 minutes
- Assessment submission: 10 requests per hour
- Admin bypass available

### HTTP Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (Deny)
- X-Content-Type-Options (nosniff)
- XSS Protection

### Data Protection
- TLS/SSL encryption in production
- Secure HttpOnly cookies
- SameSite cookie policy
- Input validation and sanitization

## Risk Levels

| Score Range | Risk Level | Recommendation |
|-------------|-----------|-----------------|
| 0-2 | Low Risk | Continue monitoring and regular updates |
| 3-5 | Medium Risk | Implement missing security measures |
| 6-8 | High Risk | Address critical gaps immediately |
| 9-12 | Critical Risk | Emergency security remediation required |

## Data Retention

- **Assessment Records**: 12 months from completion (user can request deletion)
- **Access Logs**: 30 days for security and debugging
- **PDF Reports**: Generated on-demand, not permanently stored

## Privacy & Compliance

- GDPR compliant (EU)
- CCPA compliant (California, USA)
- PIPEDA compliant (Canada)
- Field-level encryption ready
- Data portability and deletion rights

View the full [Privacy Policy](privacy.html) for details.

## Development

### Run in Development Mode
```bash
node server.js
```

### Environment Variables

```env
PORT              # Server port (default: 3000)
NODE_ENV          # Environment (development/production)
SESSION_SECRET    # Session encryption secret
ALLOWED_ORIGIN    # CORS allowed origin
```

## Dependencies

```json
{
  "express": "^4.x",
  "helmet": "^7.x",
  "cors": "^2.x",
  "express-rate-limit": "^6.x",
  "express-session": "^1.x",
  "csurf": "^1.x",
  "cookie-parser": "^1.x",
  "body-parser": "^1.x",
  "pdfkit": "^0.x",
  "uuid": "^9.x",
  "dotenv": "^16.x"
}
```

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Email: support@cybersafelocal.com

## Changelog

### v1.0.0 (March 6, 2026)
- Initial release
- Complete assessment questionnaire
- PDF report generation
- CSRF protection
- Rate limiting
- Privacy policy
- Security headers

## Contributors

- Jay Awesome (JayAwesome)

## Acknowledgments

Built as part of the 3MTT cybersecurity training program.
