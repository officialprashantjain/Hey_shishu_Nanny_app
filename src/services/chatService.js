/**
 * src/services/chatService.js
 * REST client for Conversation threads, Message history, and Attachment uploads (Nanny App).
 */

import api from './api';

const EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  m4a: 'audio/m4a',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

const chatService = {
  /**
   * Get or initialize a conversation thread between the current nanny and parent
   * @param {Object} params
   * @param {string} params.receiverId
   * @param {string} [params.receiverRole] 'parent' | 'admin' | 'counselor'
   * @param {string} [params.bookingId]
   */
  getOrCreateConversation: async ({ receiverId, receiverRole = 'parent', bookingId = null }) => {
    try {
      const response = await api.post('/chat/conversation', {
        receiverId,
        receiverRole,
        bookingId,
      });
      return response?.data || response;
    } catch (err) {
      console.error('[ChatService] getOrCreateConversation error:', err?.message);
      throw err;
    }
  },

  /**
   * Fetch all active conversation threads for the current logged-in nanny
   */
  getConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response?.data || [];
    } catch (err) {
      console.error('[ChatService] getConversations error:', err?.message);
      return [];
    }
  },

  /**
   * Fetch paginated messages in a conversation
   * @param {string} conversationId
   * @param {Object} [params]
   * @param {number} [params.limit=30]
   * @param {string} [params.before] ISO date string for cursor pagination
   */
  getMessages: async (conversationId, params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.limit) query.append('limit', String(params.limit));
      if (params.before) query.append('before', params.before);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const response = await api.get(`/chat/messages/${conversationId}${qs}`);
      return {
        messages: response?.data || [],
        hasMore: Boolean(response?.hasMore),
      };
    } catch (err) {
      console.error('[ChatService] getMessages error:', err?.message);
      return { messages: [], hasMore: false };
    }
  },

  /**
   * Upload media or document to S3 with automatic extension and MIME resolution
   * @param {string} fileUri
   * @param {string} [fileName]
   * @param {string} [mimeType]
   */
  uploadAttachment: async (fileUri, fileName, mimeType) => {
    try {
      const uriClean = (fileUri || '').split('?')[0];
      const rawExt = uriClean.includes('.') ? uriClean.split('.').pop().toLowerCase() : '';

      let cleanName = fileName || `attachment-${Date.now()}`;
      if (!cleanName.includes('.') && rawExt && rawExt.length <= 4) {
        cleanName = `${cleanName}.${rawExt}`;
      }

      const fileExt = cleanName.includes('.') ? cleanName.split('.').pop().toLowerCase() : rawExt;

      let cleanMime = mimeType;
      if (!cleanMime || cleanMime === 'application/octet-stream') {
        cleanMime = EXT_TO_MIME[fileExt] || 'application/octet-stream';
      }

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: cleanName,
        type: cleanMime,
      });

      const response = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response?.data;
    } catch (err) {
      console.error('[ChatService] uploadAttachment error:', err?.message);
      throw err;
    }
  },
};

export default chatService;
