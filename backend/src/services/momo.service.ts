import crypto from 'crypto';

/**
 * MoMo Payment Service — Tích hợp MoMo Sandbox/Production
 * Docs: https://developers.momo.vn
 */

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMOBKUN20180529';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'klm05TvNBzhg7h7j';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'at67qH6mk8w5Y1nAyMoTKhpAoTkJbW17';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || 'https://techstore-backend-l1zs.onrender.com/api/payments/momo/ipn';

export interface MomoCreatePaymentResult {
  success: boolean;
  payUrl?: string;
  qrCodeUrl?: string;
  deeplink?: string;
  message?: string;
  requestId?: string;
}

export class MomoService {
  /**
   * Tạo URL thanh toán MoMo
   */
  public static async createPaymentUrl(
    orderId: string,
    amount: number,
    orderInfo: string,
    redirectUrl: string
  ): Promise<MomoCreatePaymentResult> {
    try {
      const requestId = `${MOMO_PARTNER_CODE}-${orderId}-${Date.now()}`;
      const requestType = 'payWithMethod';
      const extraData = Buffer.from(JSON.stringify({ orderId })).toString('base64');
      const lang = 'vi';

      // Build raw signature string (thứ tự phải đúng alphabetically theo key)
      const rawSignature = [
        `accessKey=${MOMO_ACCESS_KEY}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `ipnUrl=${MOMO_IPN_URL}`,
        `orderId=${requestId}`,
        `orderInfo=${orderInfo}`,
        `partnerCode=${MOMO_PARTNER_CODE}`,
        `redirectUrl=${redirectUrl}`,
        `requestId=${requestId}`,
        `requestType=${requestType}`,
      ].join('&');

      // HMAC SHA256 signature
      const signature = crypto
        .createHmac('sha256', MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

      const requestBody = {
        partnerCode: MOMO_PARTNER_CODE,
        accessKey: MOMO_ACCESS_KEY,
        requestId,
        amount: String(amount),
        orderId: requestId,
        orderInfo,
        redirectUrl,
        ipnUrl: MOMO_IPN_URL,
        extraData,
        requestType,
        signature,
        lang,
      };

      const response = await fetch(MOMO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(requestBody)).toString(),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as any;

      if (data.resultCode === 0) {
        return {
          success: true,
          payUrl: data.payUrl,
          qrCodeUrl: data.qrCodeUrl,
          deeplink: data.deeplink,
          requestId,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Không thể tạo giao dịch MoMo',
          requestId,
        };
      }
    } catch (error: any) {
      console.error('MoMo createPaymentUrl error:', error);
      return {
        success: false,
        message: error.message || 'Lỗi kết nối đến cổng thanh toán MoMo',
      };
    }
  }

  /**
   * Xác thực chữ ký IPN từ MoMo callback
   */
  public static verifyIpnSignature(body: any): boolean {
    try {
      const {
        partnerCode, orderId, requestId, amount, orderInfo,
        orderType, transId, resultCode, message, payType,
        responseTime, extraData, signature
      } = body;

      const rawSignature = [
        `accessKey=${MOMO_ACCESS_KEY}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `message=${message}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `orderType=${orderType}`,
        `partnerCode=${partnerCode}`,
        `payType=${payType}`,
        `requestId=${requestId}`,
        `responseTime=${responseTime}`,
        `resultCode=${resultCode}`,
        `transId=${transId}`,
      ].join('&');

      const expectedSignature = crypto
        .createHmac('sha256', MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  /**
   * Xác thực chữ ký Redirect từ MoMo (khi khách quay về)
   */
  public static verifyRedirectSignature(query: any): boolean {
    try {
      const {
        partnerCode, orderId, requestId, amount, orderInfo,
        orderType, transId, resultCode, message, payType,
        responseTime, extraData, signature
      } = query;

      const rawSignature = [
        `accessKey=${MOMO_ACCESS_KEY}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `message=${message}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `orderType=${orderType}`,
        `partnerCode=${partnerCode}`,
        `payType=${payType}`,
        `requestId=${requestId}`,
        `responseTime=${responseTime}`,
        `resultCode=${resultCode}`,
        `transId=${transId}`,
      ].join('&');

      const expectedSignature = crypto
        .createHmac('sha256', MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}
