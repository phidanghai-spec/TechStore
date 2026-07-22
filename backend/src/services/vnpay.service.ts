import crypto from 'crypto';

/**
 * VNPAY Payment Service — Tích hợp Cổng thanh toán VNPAY (v2.1.0)
 * Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || 'CGXZ029Y';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'RAM2W092GHUYSYSTBAERBNLL64B3BEAY';
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const BACKEND_URL = process.env.BACKEND_URL || 'https://techstore-backend-l1zs.onrender.com';
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || `${BACKEND_URL}/api/payments/vnpay/vnpay_return`;

function formatVnPayDate(date: Date): string {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      sorted[key] = String(obj[key]);
    }
  }
  return sorted;
}

export interface VnpayCreateResult {
  success: boolean;
  payUrl?: string;
  message?: string;
  txnRef?: string;
}

export interface VnpayVerifyResult {
  isValid: boolean;
  orderId: string;
  txnRef: string;
  responseCode: string;
  amount: number;
}

export class VnpayService {
  /**
   * Tạo URL thanh toán VNPAY (chuyển hướng khách sang sandbox/production)
   */
  public static createPaymentUrl(
    ipAddr: string,
    orderId: string,
    amount: number,
    orderInfo: string,
    bankCode?: string
  ): VnpayCreateResult {
    try {
      const createDate = formatVnPayDate(new Date());
      const txnRef = `${orderId}_${Date.now()}`;
      const vnpAmount = Math.round(amount * 100);

      const vnpParams: Record<string, any> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY_TMN_CODE,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo || `Thanh toan don hang #${orderId.substring(0, 8).toUpperCase()}`,
        vnp_OrderType: 'other',
        vnp_Amount: vnpAmount,
        vnp_ReturnUrl: VNPAY_RETURN_URL,
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_CreateDate: createDate,
      };

      if (bankCode && bankCode.trim() !== '') {
        vnpParams.vnp_BankCode = bankCode.trim();
      }

      // Sort object keys alphabetically
      const sortedParams = sortObject(vnpParams);

      // Build sign string and query string
      const signDataParts: string[] = [];
      const queryParts: string[] = [];

      for (const [key, value] of Object.entries(sortedParams)) {
        signDataParts.push(`${key}=${value}`);
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }

      const signData = signDataParts.join('&');
      const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      queryParts.push(`vnp_SecureHash=${signed}`);
      const payUrl = `${VNPAY_URL}?${queryParts.join('&')}`;

      return {
        success: true,
        payUrl,
        txnRef,
      };
    } catch (error: any) {
      console.error('VnpayService createPaymentUrl error:', error);
      return {
        success: false,
        message: error?.message || 'Không thể tạo liên kết thanh toán VNPAY.',
      };
    }
  }

  /**
   * Kiểm tra chữ ký HMAC-SHA512 từ VNPAY Return/IPN response
   */
  public static verifyIpn(vnpParams: Record<string, any>): VnpayVerifyResult {
    const secureHash = vnpParams['vnp_SecureHash'];
    const paramsCopy = { ...vnpParams };
    delete paramsCopy['vnp_SecureHash'];
    delete paramsCopy['vnp_SecureHashType'];

    const sortedParams = sortObject(paramsCopy);

    const signDataParts: string[] = [];
    for (const [key, value] of Object.entries(sortedParams)) {
      signDataParts.push(`${key}=${value}`);
    }

    const signData = signDataParts.join('&');
    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
    const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = typeof secureHash === 'string' && secureHash.toLowerCase() === checkSum.toLowerCase();
    const txnRef = String(vnpParams['vnp_TxnRef'] || '');
    const realOrderId = txnRef.includes('_') ? txnRef.split('_')[0] : txnRef;
    const responseCode = String(vnpParams['vnp_ResponseCode'] || '');
    const amount = parseInt(String(vnpParams['vnp_Amount'] || '0')) / 100;

    return {
      isValid,
      orderId: realOrderId,
      txnRef,
      responseCode,
      amount,
    };
  }
}
