import axios from 'axios';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

const BASE_URL = MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

/**
 * Get M-Pesa OAuth access token
 */
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  
  try {
    const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('[M-Pesa] Failed to get access token:', error);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

/**
 * Generate M-Pesa password for STK Push
 */
function generatePassword(): { password: string; timestamp: string } {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  
  return { password, timestamp };
}

/**
 * Initiate M-Pesa STK Push (Lipa Na M-Pesa Online)
 */
export async function initiateMpesaPayment(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
}> {
  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();
    
    // Format phone number (remove + and ensure it starts with 254)
    let phone = params.phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (!phone.startsWith('254')) {
      phone = '254' + phone;
    }
    
    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(params.amount),
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };
    
    console.log('[M-Pesa] Initiating STK Push:', {
      phone,
      amount: params.amount,
      reference: params.accountReference,
    });
    
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('[M-Pesa] STK Push response:', response.data);
    
    return {
      success: response.data.ResponseCode === '0',
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage,
    };
  } catch (error: any) {
    console.error('[M-Pesa] STK Push failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
  }
}

/**
 * Query M-Pesa transaction status
 */
export async function queryMpesaTransaction(checkoutRequestId: string): Promise<{
  success: boolean;
  resultCode?: string;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
}> {
  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();
    
    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };
    
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return {
      success: response.data.ResultCode === '0',
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      mpesaReceiptNumber: response.data.MpesaReceiptNumber,
    };
  } catch (error: any) {
    console.error('[M-Pesa] Query failed:', error.response?.data || error.message);
    throw new Error('Failed to query M-Pesa transaction');
  }
}

/**
 * Process M-Pesa callback data
 */
export function processMpesaCallback(callbackData: any): {
  success: boolean;
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: string;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
} {
  const body = callbackData.Body?.stkCallback;
  
  if (!body) {
    throw new Error('Invalid M-Pesa callback data');
  }
  
  const result: any = {
    success: body.ResultCode === 0,
    merchantRequestId: body.MerchantRequestID,
    checkoutRequestId: body.CheckoutRequestID,
    resultCode: body.ResultCode.toString(),
    resultDesc: body.ResultDesc,
  };
  
  // Extract metadata if payment was successful
  if (body.CallbackMetadata?.Item) {
    const metadata = body.CallbackMetadata.Item;
    
    for (const item of metadata) {
      switch (item.Name) {
        case 'Amount':
          result.amount = item.Value;
          break;
        case 'MpesaReceiptNumber':
          result.mpesaReceiptNumber = item.Value;
          break;
        case 'TransactionDate':
          result.transactionDate = item.Value;
          break;
        case 'PhoneNumber':
          result.phoneNumber = item.Value;
          break;
      }
    }
  }
  
  return result;
}
