import axios from 'axios';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

const paymongoAPI = axios.create({
  baseURL: 'https://api.paymongo.com/v1',
  auth: {
    username: PAYMONGO_SECRET_KEY,
    password: '',
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function createGCashSource(amount, currency, redirectUrl) {
  // amount is in cents, currency like 'PHP'
  try {
    const sourcePayload = {
      data: {
        attributes: {
          type: "gcash",
          amount,
          currency,
          redirect: {
            success: redirectUrl + "?status=success",
            failed: redirectUrl + "?status=failed",
          },
          // optional: billing info if you want
        },
      },
    };

    const response = await paymongoAPI.post('/sources', sourcePayload);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

export async function createPaymentIntent(amount, currency, paymentMethodType = 'source') {
  try {
    const intentPayload = {
      data: {
        attributes: {
          amount,
          currency,
          payment_method_allowed: [paymentMethodType],
          payment_method_options: {
            [paymentMethodType]: {},
          },
          description: "Payment from Your Store",
        },
      },
    };

    const response = await paymongoAPI.post('/payment_intents', intentPayload);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

export async function attachSourceToPaymentIntent(paymentIntentId, sourceId) {
  try {
    const payload = {
      data: {
        attributes: {
          source: {
            id: sourceId,
            type: "source",
          },
        },
      },
    };
    const response = await paymongoAPI.post(`/payment_intents/${paymentIntentId}/attach`, payload);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}
