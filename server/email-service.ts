/**
 * Email Notification Service
 * 
 * Handles sending email notifications to users about restocks
 */

import { notifyOwner } from './_core/notification';
import type { Product } from '../drizzle/schema';

export interface RestockEmailData {
  userEmail: string;
  userName: string;
  product: Product;
  regionName: string;
  productUrl: string;
}

/**
 * Send a restock notification email to a user
 */
export async function sendRestockEmail(data: RestockEmailData): Promise<boolean> {
  try {
    const emailContent = generateRestockEmailContent(data);
    
    // In production, this would use a proper email service (SendGrid, AWS SES, etc.)
    // For now, we'll use the owner notification system as a placeholder
    console.log(`[EmailService] Sending restock email to ${data.userEmail}`);
    console.log(`[EmailService] Product: ${data.product.name}`);
    
    // Simulate email sending
    // In production: await sendEmailViaProvider(data.userEmail, emailContent);
    
    return true;
  } catch (error) {
    console.error('[EmailService] Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML email content for restock notification
 */
function generateRestockEmailContent(data: RestockEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .product-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .cta-button { 
          display: inline-block; 
          background: #1e40af; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Hermès Restock Alert!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.userName},</p>
          <p>Great news! A product you're monitoring is now available:</p>
          
          <div class="product-card">
            <h2>${data.product.name}</h2>
            ${data.product.description ? `<p>${data.product.description}</p>` : ''}
            <p><strong>Region:</strong> ${data.regionName}</p>
            ${data.product.color ? `<p><strong>Color:</strong> ${data.product.color}</p>` : ''}
            ${data.product.size ? `<p><strong>Size:</strong> ${data.product.size}</p>` : ''}
            ${data.product.price ? `<p><strong>Price:</strong> ${data.product.currency} ${data.product.price}</p>` : ''}
          </div>
          
          <a href="${data.productUrl}" class="cta-button">View Product Now</a>
          
          <p><small>Act fast! Hermès products sell out quickly.</small></p>
        </div>
        <div class="footer">
          <p>You're receiving this email because you subscribed to Hermès Sentinel restock alerts.</p>
          <p>© 2026 Hermès Sentinel. Not affiliated with Hermès International.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send a batch of restock emails
 */
export async function sendBatchRestockEmails(emails: RestockEmailData[]): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  for (const emailData of emails) {
    const success = await sendRestockEmail(emailData);
    if (success) {
      sent++;
    } else {
      failed++;
    }
    
    // Add delay to avoid rate limiting
    await delay(100);
  }

  return { sent, failed };
}

/**
 * Utility: Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
