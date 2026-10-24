import api from './api';

const walletService = {
  /**
   * Get wallet summary: available balance, pending (locked) balance, this month's earnings, total sessions
   */
  getWalletOverview: async () => {
    return api.get('/nanny/wallet');
  },

  /**
   * Get earnings/transaction history list with pagination and optional category filter ('all' | 'earnings' | 'withdrawals')
   */
  getEarningsHistory: async (page = 1, limit = 20, category = 'all') => {
    return api.get(`/nanny/wallet/transactions?page=${page}&limit=${limit}&category=${category}`);
  },

  /**
   * Get detail for a specific transaction
   */
  getTransactionDetail: async (transactionId) => {
    return api.get(`/nanny/wallet/transactions/${transactionId}`);
  },

  /**
   * Submit withdrawal request
   * @param {Object} data { amount, upiId, bankDetails, payoutMethod }
   */
  requestWithdrawal: async (data) => {
    return api.post('/nanny/wallet/withdraw', data);
  },
};

export default walletService;
