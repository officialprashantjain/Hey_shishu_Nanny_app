import api from "./api";

/**
 * Call Service
 * ────────────
 * Reusable client SDK for initiating, accepting, declining, and ending
 * 1-to-1 Audio & Video calls via HeyShishu backend.
 */
export const callService = {
  /**
   * Initiate a new audio or video call
   * @param {Object} params
   * @param {string} params.receiverId - MongoDB ObjectId of recipient
   * @param {string} [params.receiverRole] - 'parent' | 'nanny'
   * @param {'audio' | 'video'} [params.callType='video']
   * @param {string} [params.bookingId] - Optional booking reference
   */
  initiateCall: async ({ receiverId, receiverRole, callType = "video", bookingId }) => {
    try {
      const response = await api.post("/calls/initiate", {
        receiverId,
        receiverRole,
        callType,
        bookingId,
      });
      return response;
    } catch (error) {
      console.error("[callService.initiateCall] Error:", error);
      throw error;
    }
  },

  /**
   * Poll current call status (ringing / accepted / declined / missed)
   * @param {string} callId
   */
  getCallStatus: async (callId) => {
    try {
      const response = await api.get(`/calls/${callId}/status`);
      return response;
    } catch (error) {
      console.error("[callService.getCallStatus] Error:", error);
      throw error;
    }
  },

  /**
   * Accept an incoming call and receive Agora RTC credentials
   * @param {string} callId
   */
  acceptCall: async (callId) => {
    try {
      const response = await api.post(`/calls/${callId}/accept`);
      return response;
    } catch (error) {
      console.error("[callService.acceptCall] Error:", error);
      throw error;
    }
  },

  /**
   * Decline an incoming call
   * @param {string} callId
   */
  declineCall: async (callId) => {
    try {
      const response = await api.post(`/calls/${callId}/decline`);
      return response.data || response;
    } catch (error) {
      console.error("[callService.declineCall] Error:", error);
      throw error;
    }
  },

  /**
   * End an active or ongoing call
   * @param {string} callId
   * @param {string} [reason='caller_hangup']
   */
  endCall: async (callId, reason = "caller_hangup") => {
    try {
      const response = await api.post(`/calls/${callId}/end`, { reason });
      return response.data || response;
    } catch (error) {
      console.error("[callService.endCall] Error:", error);
      throw error;
    }
  },

  /**
   * Fetch call history
   */
  getCallHistory: async (page = 1, limit = 20) => {
    try {
      const response = await api.get("/calls/history", {
        params: { page, limit },
      });
      return response.data || response;
    } catch (error) {
      console.error("[callService.getCallHistory] Error:", error);
      throw error;
    }
  },

  /**
   * Check for active incoming ringing calls targeting this user
   */
  getActiveIncomingCall: async () => {
    try {
      const response = await api.get("/calls/active-incoming");
      return response;
    } catch (error) {
      // Don't spam console if 401 or network glitch during polling
      return { status: "error", data: { hasIncoming: false, call: null } };
    }
  },

  /**
   * Register or update FCM device token with backend
   * @param {string} fcmToken
   */
  registerDeviceToken: async (fcmToken) => {
    try {
      const response = await api.post("/calls/device-token", { fcmToken });
      return response.data || response;
    } catch (error) {
      console.error("[callService.registerDeviceToken] Error:", error);
      throw error;
    }
  },
};

export default callService;

