import api from "./api";

const supportService = {
  /**
   * Get all tickets created by the logged-in nanny
   * GET /support/tickets/my
   */
  getMyTickets: (status) => {
    let url = "/support/tickets/my";
    if (status && status !== "All") {
      url += `?status=${encodeURIComponent(status)}`;
    }
    return api.get(url);
  },

  /**
   * Create a new support ticket
   * POST /support/tickets
   */
  createTicket: ({ subject, category, priority, description, relatedBookingId, attachments }) => {
    return api.post("/support/tickets", {
      subject,
      category,
      priority,
      description,
      relatedBookingId,
      attachments,
    });
  },

  /**
   * Get ticket details with conversation messages
   * GET /support/tickets/:id
   */
  getTicketDetails: (ticketId) => {
    return api.get(`/support/tickets/${ticketId}`);
  },

  /**
   * Send a reply in a ticket conversation
   * POST /support/tickets/:id/reply
   */
  replyTicket: (ticketId, message, attachments) => {
    return api.post(`/support/tickets/${ticketId}/reply`, {
      message,
      attachments,
    });
  },

  /**
   * Close a resolved ticket
   * PATCH /support/tickets/:id/close
   */
  closeTicket: (ticketId) => {
    return api.patch(`/support/tickets/${ticketId}/close`);
  },
};

export default supportService;
