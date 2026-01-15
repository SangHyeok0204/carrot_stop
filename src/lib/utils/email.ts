/**
 * 이메일 발송 유틸리티
 * 
 * 지원하는 서비스:
 * - Resend (권장): https://resend.com
 * - SendGrid: https://sendgrid.com
 * 
 * 환경변수 설정:
 * - RESEND_API_KEY (Resend 사용 시)
 * - SENDGRID_API_KEY (SendGrid 사용 시)
 * - EMAIL_FROM (발신자 이메일 주소)
 * - ADMIN_EMAIL (관리자 이메일 주소)
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Resend를 사용한 이메일 발송
 */
async function sendEmailWithResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const from = options.from || process.env.EMAIL_FROM || 'noreply@example.com';
  const to = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '이메일 발송 실패');
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error: any) {
    console.error('Resend 이메일 발송 오류:', error);
    return {
      success: false,
      error: error.message || '이메일 발송 실패',
    };
  }
}

/**
 * SendGrid를 사용한 이메일 발송
 */
async function sendEmailWithSendGrid(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const from = options.from || process.env.EMAIL_FROM || 'noreply@example.com';
  const to = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: to.map(email => ({ email })),
            subject: options.subject,
          },
        ],
        from: { email: from },
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
          ...(options.text ? [{
            type: 'text/plain',
            value: options.text,
          }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API 오류: ${response.status} - ${errorText}`);
    }

    return {
      success: true,
      messageId: response.headers.get('x-message-id') || undefined,
    };
  } catch (error: any) {
    console.error('SendGrid 이메일 발송 오류:', error);
    return {
      success: false,
      error: error.message || '이메일 발송 실패',
    };
  }
}

/**
 * 이메일 발송 (자동으로 사용 가능한 서비스 선택)
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Resend 우선 사용
  if (process.env.RESEND_API_KEY) {
    return sendEmailWithResend(options);
  }

  // SendGrid 사용
  if (process.env.SENDGRID_API_KEY) {
    return sendEmailWithSendGrid(options);
  }

  // 이메일 서비스가 설정되지 않은 경우
  console.warn('⚠️  이메일 서비스가 설정되지 않았습니다. RESEND_API_KEY 또는 SENDGRID_API_KEY를 설정하세요.');
  console.log('📧 이메일 발송 시뮬레이션:', {
    to: options.to,
    subject: options.subject,
  });

  // 개발 환경에서는 실제 발송 없이 성공으로 처리
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      messageId: 'dev-simulation',
    };
  }

  return {
    success: false,
    error: '이메일 서비스가 설정되지 않았습니다.',
  };
}

/**
 * 문의 접수 알림 이메일 (관리자에게)
 */
export async function sendContactNotificationToAdmin(contact: {
  id: string;
  name: string;
  email: string;
  message: string;
}): Promise<EmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL 환경변수가 설정되지 않았습니다.');
    return {
      success: false,
      error: 'ADMIN_EMAIL이 설정되지 않았습니다.',
    };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7C3AED; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .info { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #7C3AED; }
        .message { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>새로운 문의가 접수되었습니다</h1>
        </div>
        <div class="content">
          <div class="info">
            <strong>문의 ID:</strong> ${contact.id}<br>
            <strong>이름:</strong> ${contact.name}<br>
            <strong>이메일:</strong> ${contact.email}
          </div>
          <div class="message">
            <strong>문의 내용:</strong><br>
            ${contact.message}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[문의 접수] ${contact.name}님의 문의`,
    html,
    text: `새로운 문의가 접수되었습니다.\n\n이름: ${contact.name}\n이메일: ${contact.email}\n\n문의 내용:\n${contact.message}`,
  });
}

/**
 * 문의 접수 확인 이메일 (사용자에게)
 */
export async function sendContactConfirmationToUser(contact: {
  name: string;
  email: string;
}): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7C3AED; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>문의가 접수되었습니다</h1>
        </div>
        <div class="content">
          <p>${contact.name}님,</p>
          <p>문의해 주셔서 감사합니다. 접수하신 내용을 검토한 후 빠른 시일 내에 답변드리겠습니다.</p>
          <p>감사합니다.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: contact.email,
    subject: '문의 접수 확인',
    html,
    text: `${contact.name}님, 문의가 접수되었습니다. 검토 후 답변드리겠습니다.`,
  });
}

