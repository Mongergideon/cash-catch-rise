
import React from 'react';

interface EmailTemplateProps {
  userFirstName?: string;
  verificationUrl: string;
  appName: string;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({ 
  userFirstName, 
  verificationUrl, 
  appName 
}) => {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333333',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header with logo/branding */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          borderBottom: '2px solid #4CAF50',
          paddingBottom: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: 'linear-gradient(135deg, #4CAF50, #45a049)',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ 
              color: 'white', 
              fontSize: '24px', 
              fontWeight: 'bold' 
            }}>₦</span>
          </div>
          <h1 style={{ 
            color: '#4CAF50', 
            margin: '10px 0 0 0',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            {appName}
          </h1>
        </div>

        {/* Welcome message */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '24px',
            marginBottom: '15px'
          }}>
            Welcome{userFirstName ? `, ${userFirstName}` : ''}! 🎉
          </h2>
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '15px',
            color: '#555'
          }}>
            Thank you for joining our cash earning community! You're just one step away from starting your money-making journey.
          </p>
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '20px',
            color: '#555'
          }}>
            Please verify your email address by clicking the button below:
          </p>
        </div>

        {/* Verification button */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <a 
            href={verificationUrl}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '15px 30px',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'inline-block',
              boxShadow: '0 4px 6px rgba(76, 175, 80, 0.3)'
            }}
          >
            Verify My Email Address
          </a>
        </div>

        {/* Benefits section */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '25px'
        }}>
          <h3 style={{ 
            color: '#4CAF50', 
            fontSize: '18px',
            marginBottom: '15px'
          }}>
            What's waiting for you:
          </h3>
          <ul style={{ 
            paddingLeft: '20px',
            color: '#555'
          }}>
            <li style={{ marginBottom: '8px' }}>🎮 Play fun games and earn real money</li>
            <li style={{ marginBottom: '8px' }}>💰 Daily bonuses up to ₦500</li>
            <li style={{ marginBottom: '8px' }}>👥 Refer friends and earn ₦500 per referral</li>
            <li style={{ marginBottom: '8px' }}>🏆 Unlock premium games with higher earnings</li>
          </ul>
        </div>

        {/* Alternative link */}
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '5px',
          marginBottom: '25px'
        }}>
          <p style={{ 
            fontSize: '14px', 
            margin: '0',
            color: '#856404'
          }}>
            <strong>Having trouble with the button?</strong><br/>
            Copy and paste this link into your browser: <br/>
            <a href={verificationUrl} style={{ 
              color: '#4CAF50',
              wordBreak: 'break-all'
            }}>
              {verificationUrl}
            </a>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #eee',
          paddingTop: '20px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '14px', 
            color: '#666',
            margin: '0 0 10px 0'
          }}>
            This link will expire in 24 hours for security reasons.
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#999',
            margin: '0'
          }}>
            If you didn't create an account with us, please ignore this email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplate;
