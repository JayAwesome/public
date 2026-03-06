let currentAssessmentId = null;
let currentAnswers = null;

// Prevent pinch zoom on form inputs for better UX
document.addEventListener('touchmove', (e) => {
  if (e.scale !== 1) {
    e.preventDefault();
  }
}, { passive: false });

// Fetch CSRF token on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set viewport for mobile optimization
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    document.head.appendChild(meta);
  }

  fetch('/api/csrf-token')
    .then(res => res.json())
    .then(data => {
      document.getElementById('csrfToken').value = data.csrfToken;
      console.log('CSRF token loaded');
    })
    .catch(err => console.error('Failed to load CSRF token:', err));

  document.getElementById('riskForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('downloadPdf').addEventListener('click', downloadPdf);

  // Add input feedback on mobile
  const selects = document.querySelectorAll('.answer');
  selects.forEach(select => {
    select.addEventListener('change', () => {
      select.style.borderColor = '#22d3ee';
    });
  });
});

async function handleFormSubmit(e) {
  e.preventDefault();

  const answers = Array.from(document.querySelectorAll('.answer'))
    .map(select => select.value);

  // Validate all answers are selected
  if (answers.some(a => a === '')) {
    alert('Please answer all questions');
    return;
  }

  const csrfToken = document.getElementById('csrfToken').value;
  
  console.log('Submitting answers:', answers);
  console.log('CSRF Token:', csrfToken);

  try {
    const response = await fetch('/api/submit-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({ answers }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      alert(`Error: ${data.error}`);
      return;
    }

    currentAssessmentId = data.assessmentId;
    currentAnswers = answers;

    displayResults(data);
    document.getElementById('downloadPdf').style.display = 'block';
    showRiskModal(data);
  } catch (error) {
    console.error('Detailed error:', error);
    alert('Failed to submit assessment: ' + error.message);
  }
}

const RISK_CONFIG = {
  'Low Risk': {
    class: 'low-risk',
    icon: '✓',
    message: 'Your cybersecurity posture is strong. Keep up the great work and stay vigilant.',
  },
  'Medium Risk': {
    class: 'medium-risk',
    icon: '⚠',
    message: 'Some gaps need attention. Address the items below to strengthen your defenses.',
  },
  'High Risk': {
    class: 'high-risk',
    icon: '🔥',
    message: 'Urgent action required. Multiple vulnerabilities put your business at risk.',
  },
  'Critical Risk': {
    class: 'critical-risk',
    icon: '🚨',
    message: 'Immediate attention required. Your organization is at severe risk of a security incident.',
  },
};

function showRiskModal(data) {
  const modal = document.getElementById('riskModal');
  const config = RISK_CONFIG[data.riskLevel] || RISK_CONFIG['Medium Risk'];

  modal.className = `risk-modal ${config.class}`;
  document.getElementById('riskModalIcon').textContent = config.icon;
  document.getElementById('riskModalTitle').textContent = data.riskLevel.toUpperCase();
  document.getElementById('riskModalScore').textContent = `Score: ${data.riskScore} / 12`;
  document.getElementById('riskModalMessage').textContent = config.message;

  modal.removeAttribute('hidden');
  modal.setAttribute('data-visible', 'true');
  document.body.style.overflow = 'hidden';

  const escHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  const closeModal = () => {
    modal.setAttribute('data-visible', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', escHandler);
    setTimeout(() => {
      modal.setAttribute('hidden', '');
      document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  document.getElementById('riskModalClose').onclick = closeModal;
  modal.querySelector('.risk-modal-backdrop').onclick = closeModal;
  document.addEventListener('keydown', escHandler);
}

function displayResults(data) {
  const resultDiv = document.getElementById('result');
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
  
  let checklistHtml = '<ul class="checklist">';
  currentAnswers.forEach((answer, index) => {
    const answerValue = parseInt(answer);
    const isYes = answerValue === 0;
    const icon = isYes ? '✓' : '✗';
    const className = isYes ? 'yes' : 'no';
    checklistHtml += `<li class="${className}"><span class="icon">${icon}</span> ${index + 1}. ${questions[index]}: <strong>${isYes ? 'Yes' : 'No'}</strong></li>`;
  });
  checklistHtml += '</ul>';
  
  resultDiv.innerHTML = `
    <div class="result-box ${data.riskLevel.toLowerCase().replace(' ', '-')}">
      <h2>Your Risk Assessment</h2>
      <p class="risk-score">Risk Score: ${data.riskScore}/12</p>
      <p class="risk-level">Risk Level: <strong>${data.riskLevel}</strong></p>
      <p class="assessment-id">Assessment ID: ${data.assessmentId}</p>
      <h3>Your Answers:</h3>
      ${checklistHtml}
    </div>
  `;
}

async function downloadPdf() {
  const csrfToken = document.getElementById('csrfToken').value;

  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({
        answers: currentAnswers,
        assessmentId: currentAssessmentId,
      }),
    });

    if (!response.ok) {
      alert('Failed to generate PDF');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment_${currentAssessmentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to download PDF');
  }
}