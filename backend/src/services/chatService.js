const db = require('../config/database');
const KnowledgeService = require('./knowledgeService');
const LeadService = require('./leadService');

class ChatService {
  // Define conversation states for lead capture
  static STATES = {
    IDLE: 'IDLE',
    AWAITING_NAME: 'AWAITING_NAME',
    AWAITING_COMPANY: 'AWAITING_COMPANY',
    AWAITING_EMAIL: 'AWAITING_EMAIL',
    AWAITING_MOBILE: 'AWAITING_MOBILE',
    AWAITING_EMPLOYEES: 'AWAITING_EMPLOYEES',
    AWAITING_REQUIREMENT: 'AWAITING_REQUIREMENT',
    AWAITING_TIME: 'AWAITING_TIME',
    COMPLETED: 'COMPLETED'
  };

  /**
   * Main entry point for a chat message
   */
  static async processMessage(sessionToken, userMessage) {
    const message =
      typeof userMessage === 'string'
        ? userMessage.trim()
        : '';

    // Prevent empty/null messages from entering the state machine
    if (!message) {
      return this.createResponse(
        'Please enter a message.',
        0,
        'SYSTEM'
      );
    }

    let session = await this.getSession(sessionToken);

    // 1. GLOBAL CANCEL INTENT
    if (this.isCancelCommand(message)) {
      if (
        session.state !== this.STATES.IDLE &&
        session.state !== this.STATES.COMPLETED
      ) {
        await this.updateSessionState(
          sessionToken,
          this.STATES.IDLE,
          {},
          true
        );

        return this.createResponse(
          "No problem. I've cancelled the demo request. How else can I help you?",
          1.0,
          'SYSTEM'
        );
      }
    }

    // 2. ACTIVE CONVERSATION FLOW
    if (
      session.state !== this.STATES.IDLE &&
      session.state !== this.STATES.COMPLETED
    ) {
      return await this.handleLeadCaptureState(session, message);
    }

    // 3. KNOWLEDGE BASE SEARCH
    const kbResult = await KnowledgeService.search(message);

    if (kbResult) {
      return this.createResponse(
        kbResult.answer_text,
        kbResult.confidence,
        'LOCAL_DB'
      );
    }

    // 4. INTENT DETECTION
    if (this.isLeadTrigger(message)) {
      await this.updateSessionState(
        sessionToken,
        this.STATES.AWAITING_NAME
      );

      return this.createResponse(
        "Great! I'd love to set up a demo for you. First, what's your full name?",
        1.0,
        'SYSTEM'
      );
    }

    // 5. SAFE FALLBACK
    return this.createResponse(
      "I'm sorry, I don't have verified information about that in my knowledge base yet. Would you like to schedule a demo or talk with our team?",
      0,
      'FALLBACK'
    );
  }

  /**
   * Detect commands that cancel the current lead/demo flow
   */
  static isCancelCommand(message) {
    if (typeof message !== 'string') {
      return false;
    }

    const cancels = [
      'stop',
      'cancel',
      'exit',
      'quit',
      'never mind',
      'nevermind',
      'not interested',
      'go back',
      'end'
    ];

    const lower = message.trim().toLowerCase();

    return cancels.some(
      (c) =>
        lower === c ||
        lower.includes(c + ' demo') ||
        lower.includes('cancel ' + c)
    );
  }

  /**
   * Detect whether the user wants to start a demo/sales flow
   */
  static isLeadTrigger(message) {
    if (typeof message !== 'string') {
      return false;
    }

    const triggers = [
      'demo',
      'contact sales',
      'talk to sales',
      'want a demo',
      'schedule demo',
      'book a demo',
      'request demo'
    ];

    const lower = message.toLowerCase();

    return triggers.some((t) => lower.includes(t));
  }
  static async getSession(token) {
    const sessionToken = token || require('crypto').randomUUID();

    const res = await db.query(
      'SELECT * FROM conversations WHERE session_id = $1',
      [sessionToken]
    );

    if (res.rows.length > 0) {
      return {
        ...res.rows[0],
        sessionToken,
        state: res.rows[0].state || this.STATES.IDLE
      };
    }

    const insertRes = await db.query(
      'INSERT INTO conversations (session_id, status) VALUES ($1, \'ACTIVE\') RETURNING *',
      [sessionToken]
    );

    return {
      ...insertRes.rows[0],
      sessionToken,
      state: insertRes.rows[0].state || this.STATES.IDLE
    };
  }

  /**
   * Update conversation state and lead-capture context
   */
  static async updateSessionState(
    token,
    newState,
    leadData = {},
    clear = false
  ) {
    try {
      await db.query(
        "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS state VARCHAR(50) DEFAULT 'IDLE'"
      );

      await db.query(
        "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'"
      );
    } catch (error) {
      console.error(
        'Unable to ensure conversation columns:',
        error.message
      );
    }

    await db.query(
      'UPDATE conversations SET state = $1 WHERE session_id = $2',
      [newState, token]
    );

    if (clear) {
      await db.query(
        "UPDATE conversations SET context = '{}'::jsonb WHERE session_id = $1",
        [token]
      );

      return;
    }

    if (
      leadData &&
      typeof leadData === 'object' &&
      Object.keys(leadData).length > 0
    ) {
      await db.query(
        "UPDATE conversations SET context = COALESCE(context, '{}'::jsonb) || $1::jsonb WHERE session_id = $2",
        [JSON.stringify(leadData), token]
      );
    }
  }

  /**
   * Get accumulated lead information for the conversation
   */
  static async getSessionContext(token) {
    const res = await db.query(
      'SELECT context FROM conversations WHERE session_id = $1',
      [token]
    );

    return res.rows[0]?.context || {};
  }

  /**
   * Handle the active demo/lead-capture state machine
   */
  static async handleLeadCaptureState(session, message) {
    const cleanMessage =
      typeof message === 'string'
        ? message.trim()
        : '';

    if (!cleanMessage) {
      return this.createResponse(
        'Please enter a valid response.',
        0,
        'SYSTEM'
      );
    }

    // Allow the chatbot to answer known questions during the demo flow
    const kbResult = await KnowledgeService.search(cleanMessage);

    if (kbResult) {
      return this.createResponse(
        `${kbResult.answer_text}\n\nWould you like to continue with your demo request?`,
        kbResult.confidence,
        'LOCAL_DB'
      );
    }

    const context = await this.getSessionContext(
      session.session_id
    );

    let responseText;

    switch (session.state) {
      /**
       * NAME
       */
      case this.STATES.AWAITING_NAME: {
        const name = cleanMessage;

        const invalidNameInputs = [
          'pricing',
          'help',
          'demo',
          'yes',
          'no'
        ];

        if (
          name.length < 2 ||
          invalidNameInputs.includes(name.toLowerCase())
        ) {
          return this.createResponse(
            'Please provide a valid name.',
            1.0,
            'SYSTEM'
          );
        }

        await this.updateSessionState(
          session.session_id,
          this.STATES.AWAITING_COMPANY,
          { name }
        );

        responseText =
          'Thanks! What is your company name?';

        break;
      }

      /**
       * COMPANY
       */
      case this.STATES.AWAITING_COMPANY: {
        const company = cleanMessage;

        if (company.length < 2) {
          return this.createResponse(
            'Please provide a valid company name.',
            1.0,
            'SYSTEM'
          );
        }

        await this.updateSessionState(
          session.session_id,
          this.STATES.AWAITING_EMAIL,
          { company }
        );

        responseText =
          'Got it. What is your work email address?';

        break;
      }

      /**
       * EMAIL
       */
      case this.STATES.AWAITING_EMAIL: {
        const email = cleanMessage;

        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
          return this.createResponse(
            "That doesn't look like a valid email. Please try again.",
            1.0,
            'SYSTEM'
          );
        }

        await this.updateSessionState(
          session.session_id,
          this.STATES.AWAITING_MOBILE,
          { email }
        );

        responseText =
          'Thanks! What is the best mobile number to reach you at?';

        break;
      }

      /**
       * MOBILE
       */
      case this.STATES.AWAITING_MOBILE: {
        const mobile = cleanMessage;

        // Allows digits, spaces, +, -, and parentheses
        const mobileRegex =
          /^[\d\s+\-()]+$/;

        // Count actual digits instead of just string length
        const digitCount =
          mobile.replace(/\D/g, '').length;

        if (
          !mobileRegex.test(mobile) ||
          digitCount < 7 ||
          digitCount > 15
        ) {
          return this.createResponse(
            'Please provide a valid phone number.',
            1.0,
            'SYSTEM'
          );
        }

        await this.updateSessionState(
          session.session_id,
          this.STATES.AWAITING_EMPLOYEES,
          { mobile }
        );

        responseText =
          'Great! How many employees does your company have?';

        break;
      }

      /**
       * EMPLOYEE COUNT
       */
      case this.STATES.AWAITING_EMPLOYEES: {
        const employeeCount = cleanMessage;

        /*
         * Accepts:
         * 20
         * 100
         * 20-50
         * 20 - 50
         * 100+
         */
        const employeeRegex =
          /^\d+(\s*-\s*\d+|\+)?$/;

        if (!employeeRegex.test(employeeCount)) {
          return this.createResponse(
            'Please provide a numeric employee count or range.',
            1.0,
            'SYSTEM'
          );
        }

        await this.updateSessionState(
          session.session_id,
          this.STATES.AWAITING_REQUIREMENT,
          { employeeCount }
        );

        responseText =
          'Briefly, what is your main requirement or challenge?';

        break;
      }

      /**
       * REQUIREMENT
       */
      case this.STATES.AWAITING_REQUIREMENT: {
        const requirement = cleanMessage;

        if (requirement.length < 3) {
          return this.createResponse(
            'Please briefly describe your requirement or challenge.',
            1.0,
            'SYSTEM'
          );
        }

        await this.updateSessionState(
          session.session_id,
          this.STATES.AWAITING_TIME,
          { requirement }
        );

        responseText =
          'Lastly, when is your preferred time for a demo (e.g., Tomorrow at 10 AM)?';

        break;
      }

      /**
       * DEMO TIME
       */
      case this.STATES.AWAITING_TIME: {
        const preferredDemoTime = cleanMessage;

        if (preferredDemoTime.length < 3) {
          return this.createResponse(
            'Please provide a valid time for the demo.',
            1.0,
            'SYSTEM'
          );
        }

        /*
         * Context was loaded before processing this message.
         * It already contains:
         *
         * name
         * company
         * email
         * mobile
         * employeeCount
         * requirement
         *
         * We add preferredDemoTime here before creating the lead.
         */
        const finalContext = {
          ...context,
          preferredDemoTime
        };

        // Save lead
        const lead =
          await LeadService.createLead(finalContext);

        // Make sure the lead was actually created
        if (!lead || !lead.id) {
          throw new Error(
            'LeadService did not return a valid lead.'
          );
        }

        // Mark conversation as completed
        await this.updateSessionState(
          session.session_id,
          this.STATES.COMPLETED,
          {},
          true
        );

        // Link lead to conversation
        await db.query(
          'UPDATE conversations SET lead_id = $1 WHERE session_id = $2',
          [lead.id, session.session_id]
        );

        responseText =
          'Thank you! Your demo request has been successfully submitted. Our team will contact you shortly.';

        break;
      }

      /**
       * SAFETY FALLBACK
       *
       * Prevents responseText from becoming undefined,
       * which would later cause messages.content = NULL.
       */
      default: {
        console.error(
          `Unknown conversation state: ${session.state}`
        );

        await this.updateSessionState(
          session.session_id,
          this.STATES.IDLE,
          {},
          true
        );

        return this.createResponse(
          "Something went wrong with the current conversation. I've reset the chat flow. Please try again.",
          0,
          'SYSTEM'
        );
      }
    }

    /*
     * Final safety check.
     *
     * We previously had a bug where responseText was undefined.
     * That caused PostgreSQL to throw:
     *
     * null value in column "content" violates not-null constraint
     */
    if (
      typeof responseText !== 'string' ||
      !responseText.trim()
    ) {
      console.error(
        'Lead flow attempted to return an empty response.',
        {
          state: session.state,
          sessionToken: session.session_id
        }
      );

      return this.createResponse(
        'Something went wrong while processing your request. Please try again.',
        0,
        'SYSTEM'
      );
    }

    return this.createResponse(
      responseText,
      1.0,
      'SYSTEM'
    );
  }

  /**
   * Standard response object
   */
  static createResponse(
    text,
    confidence = 1.0,
    source = 'SYSTEM'
  ) {
    /*
     * Never allow undefined/null bot content.
     * This protects the messages table's NOT NULL constraint.
     */
    const safeText =
      typeof text === 'string' && text.trim()
        ? text
        : 'Something went wrong while generating a response. Please try again.';

    return {
      text: safeText,
      confidence,
      source
    };
  }

  /**
   * Save user/bot message to conversation history
   */
  static async logMessage(
    sessionToken,
    sender,
    content,
    confidenceScore = null,
    source = null
  ) {
    /*
     * Protect PostgreSQL from NULL message content.
     */
    if (
      typeof content !== 'string' ||
      !content.trim()
    ) {
      throw new Error(
        `Cannot log an empty message. Sender: ${sender}`
      );
    }

    const session =
      await this.getSession(sessionToken);

    await db.query(
      `INSERT INTO messages
  (
      conversation_id,
      sender,
      message,
      confidence_score,
      response_source
  )
  VALUES ($1, $2, $3, $4, $5)`,
      [
        session.id,
        sender,
        content,
        confidenceScore,
        source
      ]
    );
  }
}

module.exports = ChatService;