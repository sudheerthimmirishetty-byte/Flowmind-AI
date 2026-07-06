const { supabase } = require("../supabase/client");
const { processCommand: runProcessCommand } = require('./ai');

/**
 * Delegates a natural-language business command to the FlowMind AI orchestrator.
 * @param {string} command
 * @returns {Promise<object>}
 */
const processCommand = async (command) => runProcessCommand(command);

/**
 * Handles general chatbot message conversation.
 */
const getChatResponse = async (message, context = {}) => {
  const lower = message.toLowerCase();
  let textResponse = '';
  
  if (/document|upload|file|aadhar|pan|passport|certificate|letter/.test(lower)) {
    textResponse = 'You need to upload: Aadhar Card, PAN Card, Passport, Degree Certificate, Experience Certificate, and Offer Letter. All files should be PDF or JPG under 10 MB. Head to the Document Center to get started!';
  } else if (/long|duration|days|weeks|timeline|complete|finish|how.*time/.test(lower)) {
    textResponse = 'The typical onboarding process takes 7–10 business days from document submission to orientation. Your progress is tracked in real-time on the dashboard. 📅';
  } else if (/manager|hr|contact|sarah|who.*help|report/.test(lower)) {
    textResponse = 'Your onboarding manager is Sarah Johnson (HR). You can reach her at hr@company.com or call +91-9800000001 during business hours (Mon–Fri, 9 AM–6 PM IST). 👩‍💼';
  } else if (/it|laptop|computer|email|setup|software|system|access/.test(lower)) {
    textResponse = 'IT setup includes: laptop configuration, corporate email setup, system access provisioning, and software installation (VS Code, Slack, Zoom, etc.). This happens after manager approval — usually on your joining day. 💻';
  } else if (/orientation|session|training|schedule|when|date|july/.test(lower)) {
    textResponse = 'Your orientation is scheduled for July 15, 2026 at 10:00 AM IST in Conference Room A (3rd Floor, Block B). You will receive a calendar invite 48 hours before. 🎉';
  } else if (/salary|pay|payroll|ctc|package|compensation/.test(lower)) {
    textResponse = 'Salary details and CTC breakdown are shared by HR during your offer discussion. For payroll-related queries, contact payroll@company.com. Your first salary will be processed after completing the probation formalities. 💰';
  } else if (/leave|holiday|vacation|pto|time.?off/.test(lower)) {
    textResponse = 'You are entitled to 18 casual/sick leaves and 12 earned leaves per year (pro-rated for joining month). National and company holidays are listed in the HR portal. Leave requests go through your reporting manager. 🌴';
  } else if (/policy|code of conduct|rules|guidelines/.test(lower)) {
    textResponse = 'Our company policies are available in the Employee Handbook (shared in your onboarding email). Key highlights: flexible work hours, remote-friendly culture, zero-tolerance harassment policy. 📋';
  } else {
    textResponse = 'I understand your question. Let me connect you with our HR team for a detailed answer. Alternatively, you can email hr@company.com or call +91-9800000001 during business hours. Is there anything else I can help you with? 😊';
  }

  return {
    response: textResponse,
    timestamp: new Date().toISOString()
  };
};

/**
 * Gets list of AI agents
 */
const getAgents = async () => {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*');
    
  if (error) throw error;
  
  if (!data || data.length === 0) {
    return [
      { id: '11111111-1111-1111-1111-111111111111', agent_name: 'Workflow Detection Agent', description: 'Analyzes inputs to classify processes.', version: '1.0.0', status: 'active' },
      { id: '22222222-2222-2222-2222-222222222222', agent_name: 'Workflow Orchestrator', description: 'Plans and coordinates tasks.', version: '1.0.0', status: 'active' },
      { id: '33333333-3333-3333-3333-333333333333', agent_name: 'HR Agent', description: 'Manages employee metadata and records.', version: '1.1.0', status: 'active' },
      { id: '44444444-4444-4444-4444-444444444444', agent_name: 'IT Agent', description: 'Triggers laptop and account setups.', version: '1.0.0', status: 'active' },
      { id: '55555555-5555-5555-5555-555555555555', agent_name: 'Finance Agent', description: 'Validates salary and payroll accounts.', version: '1.0.0', status: 'active' }
    ];
  }
  return data;
};

/**
 * Gets details of a single agent
 */
const getAgentById = async (id) => {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Updates agent status
 */
const updateAgentStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('ai_agents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

module.exports = {
  processCommand,
  getChatResponse,
  getAgents,
  getAgentById,
  updateAgentStatus
};
