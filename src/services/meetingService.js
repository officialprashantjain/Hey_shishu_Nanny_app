import api from './api';

const meetingService = {
  /**
   * Fetch meetings visible to the current nanny (webinars, 1-to-1s, group)
   * @param {Object} [params] - e.g. { status: 'live' | 'scheduled' }
   */
  listMyMeetings: async (params = {}) => {
    return api.get('/trainee/meetings', { params });
  },

  /**
   * Fetch safe meeting details
   * @param {string} meetingId
   */
  getMeeting: async (meetingId) => {
    return api.get(`/trainee/meetings/${meetingId}`);
  },

  /**
   * Request Agora token & channel details for joining a meeting
   * @param {string} meetingId
   */
  getToken: async (meetingId) => {
    return api.post(`/meetings/${meetingId}/token`);
  },

  /**
   * Start meeting (applicable for parent_nanny calls)
   * @param {string} meetingId
   */
  startMeeting: async (meetingId) => {
    return api.patch(`/trainee/meetings/${meetingId}/start`);
  },

  /**
   * End meeting (applicable for parent_nanny calls)
   * @param {string} meetingId
   */
  endMeeting: async (meetingId) => {
    return api.patch(`/trainee/meetings/${meetingId}/end`);
  },
};

export default meetingService;
