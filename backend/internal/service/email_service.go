package service

import (
	"bytes"
	"fmt"
	"log/slog"
	"net/smtp"
	"text/template"
)

type EmailConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

type EmailService struct {
	config EmailConfig
	logger *slog.Logger
}

func NewEmailService(cfg EmailConfig, logger *slog.Logger) *EmailService {
	return &EmailService{
		config: cfg,
		logger: logger,
	}
}

const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #111827; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; color: #16a34a; text-decoration: none; }
  .content { font-size: 16px; line-height: 1.6; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
  .btn { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 20px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">Sadaqah Platform</a>
    </div>
    <div class="content">
      {{.Body}}
    </div>
    <div class="footer">
      &copy; 2026 Sadaqah Platform. All rights reserved.<br>
      This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>
`

// Send sends an HTML email asynchronously
func (s *EmailService) Send(to string, subject string, htmlBody string) {
	go func() {
		err := s.sendSync(to, subject, htmlBody)
		if err != nil {
			s.logger.Error("Failed to send email", "to", to, "error", err)
		} else {
			s.logger.Info("Email sent successfully", "to", to, "subject", subject)
		}
	}()
}

func (s *EmailService) sendSync(to string, subject string, htmlBody string) error {
	if s.config.Host == "" {
		s.logger.Warn("SMTP host not configured, skipping email delivery")
		return nil
	}

	tmpl, err := template.New("email").Parse(baseTemplate)
	if err != nil {
		return err
	}

	var bodyBuffer bytes.Buffer
	err = tmpl.Execute(&bodyBuffer, map[string]string{
		"Body": htmlBody,
	})
	if err != nil {
		return err
	}

	mimeHeaders := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	msg := []byte(fmt.Sprintf("To: %s\r\nFrom: %s\r\nSubject: %s\r\n%s\r\n%s", to, s.config.From, subject, mimeHeaders, bodyBuffer.String()))

	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)

	addr := fmt.Sprintf("%s:%s", s.config.Host, s.config.Port)
	return smtp.SendMail(addr, auth, s.config.From, []string{to}, msg)
}

// Pre-defined Emails

func (s *EmailService) SendWelcomeEmail(to string, name string) {
	body := fmt.Sprintf(`
		<h2>Welcome to Sadaqah, %s!</h2>
		<p>Thank you for joining our platform. We are thrilled to have you.</p>
		<p>Please complete your profile so you can start benefiting from our programs.</p>
		<a href="#" class="btn">Complete Profile</a>
	`, name)
	s.Send(to, "Welcome to Sadaqah Platform", body)
}

func (s *EmailService) SendDonationReceipt(to string, amount float64, currency string, receiptNo string) {
	body := fmt.Sprintf(`
		<h2>Donation Receipt</h2>
		<p>Thank you for your generous donation!</p>
		<p><strong>Amount:</strong> %.2f %s</p>
		<p><strong>Receipt No:</strong> %s</p>
		<p>May Allah reward you for your generosity.</p>
	`, amount, currency, receiptNo)
	s.Send(to, "Your Donation Receipt - "+receiptNo, body)
}
