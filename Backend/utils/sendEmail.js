const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, type = 'general') => {
  try {
    console.log('Preparing to send email:', { to, subject, type });

    let htmlTemplate;

    if (type === 'otp') {
      // Extract OTP from text - more reliable method
      const otpMatch = text.match(/Your OTP is: (\d{6})|Your new OTP is: (\d{6})|Your password reset OTP is: (\d{6})/);
      let otp = '123456'; // default fallback

      if (otpMatch) {
        // Find the first non-undefined group
        for (let i = 1; i < otpMatch.length; i++) {
          if (otpMatch[i]) {
            otp = otpMatch[i];
            break;
          }
        }
      }

      // OTP Gmail-compatible HTML template
      htmlTemplate = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>TaskFlow OTP Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td bgcolor="#667eea" align="center" style="padding: 30px 0; background: linear-gradient(to right, #667eea, #764ba2);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">TaskFlow</h1>
                          <p style="color: #e0f7ff; margin: 8px 0 0 0; font-size: 16px;">Your Personal Task Management Solution</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Your Verification Code</h2>
                          <p style="color: #666666; margin: 0 0 30px 0; line-height: 1.6; font-size: 16px;">
                            Use this code within 5 minutes to complete your action.
                          </p>
                        </td>
                      </tr>

                      <!-- OTP Code -->
                      <tr>
                        <td align="center">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                            <tr>
                              <td align="center" style="background-color: #f8f9fa; padding: 25px; border: 2px dashed #667eea; border-radius: 8px;">
                                <span style="font-size: 32px; font-weight: bold; color: #333333; letter-spacing: 8px; display: inline-block; padding: 10px;">
                                  ${otp}
                                </span>
                                <p style="color: #666666; margin: 15px 0 0 0; font-size: 14px;">
                                  ⏰ Expires in 5 minutes
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Warning -->
                      <tr>
                        <td style="padding: 30px 0 0 0;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;">
                            <tr>
                              <td style="padding: 20px;">
                                <p style="color: #856404; margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
                                  <strong>⚠️ Security Notice:</strong> If you didn't request this code, please ignore this email or contact our support team immediately.
                                </p>
                                <a href="mailto:sachinkumar1029yadav@gmail.com" style="background-color: #667eea; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 14px;">
                                  Contact Support
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td bgcolor="#667eea" align="center" style="padding: 20px 0; background: linear-gradient(to right, #667eea, #764ba2);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <p style="color: #ffffff; margin: 0; font-size: 12px;">© 2025 TaskFlow. All rights reserved.</p>
                          <p style="color: #e0f7ff; margin: 5px 0 0 0; font-size: 12px;">1234 App Street, Tech City, TC 12345</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
    } else if (type === 'reminder') {
      // Reminder email template
      htmlTemplate = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>TaskFlow Task Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td bgcolor="#f59e0b" align="center" style="padding: 30px 0; background: linear-gradient(to right, #f59e0b, #d97706);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">⏰ TaskFlow</h1>
                          <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px;">Task Reminder</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Task Due Soon!</h2>
                          <p style="color: #666666; margin: 0 0 30px 0; line-height: 1.6; font-size: 16px;">
                            ${text}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td bgcolor="#f59e0b" align="center" style="padding: 20px 0; background: linear-gradient(to right, #f59e0b, #d97706);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <p style="color: #ffffff; margin: 0; font-size: 12px;">© 2025 TaskFlow. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
    } else if (type === 'overdue') {
      // Overdue email template
      htmlTemplate = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>TaskFlow Overdue Task</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td bgcolor="#ef4444" align="center" style="padding: 30px 0; background: linear-gradient(to right, #ef4444, #dc2626);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">⚠️ TaskFlow</h1>
                          <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 16px;">Overdue Task Alert</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Task Deadline Passed</h2>
                          <p style="color: #666666; margin: 0 0 30px 0; line-height: 1.6; font-size: 16px;">
                            ${text}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td bgcolor="#ef4444" align="center" style="padding: 20px 0; background: linear-gradient(to right, #ef4444, #dc2626);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <p style="color: #ffffff; margin: 0; font-size: 12px;">© 2025 TaskFlow. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
    } else if (type === 'completion') {
      // Completion email template
      htmlTemplate = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>TaskFlow Task Completed</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td bgcolor="#10b981" align="center" style="padding: 30px 0; background: linear-gradient(to right, #10b981, #059669);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 TaskFlow</h1>
                          <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Task Completed Successfully</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Congratulations!</h2>
                          <p style="color: #666666; margin: 0 0 30px 0; line-height: 1.6; font-size: 16px;">
                            ${text}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td bgcolor="#10b981" align="center" style="padding: 20px 0; background: linear-gradient(to right, #10b981, #059669);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <p style="color: #ffffff; margin: 0; font-size: 12px;">© 2025 TaskFlow. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
    } else {
      // General email template
      htmlTemplate = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>TaskFlow Notification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td bgcolor="#667eea" align="center" style="padding: 30px 0; background: linear-gradient(to right, #667eea, #764ba2);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">TaskFlow</h1>
                          <p style="color: #e0f7ff; margin: 8px 0 0 0; font-size: 16px;">Your Personal Task Management Solution</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <p style="color: #666666; margin: 0; line-height: 1.6; font-size: 16px;">
                            ${text}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td bgcolor="#667eea" align="center" style="padding: 20px 0; background: linear-gradient(to right, #667eea, #764ba2);">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="80%">
                      <tr>
                        <td align="center">
                          <p style="color: #ffffff; margin: 0; font-size: 12px;">© 2025 TaskFlow. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
    }

    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS environment variables.');
    }

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('Sending email with credentials:', {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? '[REDACTED]' : 'MISSING'
    });

    await transport.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: htmlTemplate
    });

    console.log("✅ Email sent successfully to:", to);
  } catch (error) {
    console.error("❌ ❌✅Email sending error:", error);
    throw error;
  }
};

module.exports = sendEmail;