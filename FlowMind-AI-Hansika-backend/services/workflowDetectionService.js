const { supabase } = require("../supabase/client");


/**
 * Automatically classifies a command and saves the result in workflow_detection_results table.
 */
const detectAndLogWorkflow = async (workflowId, command) => {
  const lower = command.toLowerCase();
  let detectedWorkflow = 'Employee Onboarding';
  let confidence = 85;
  let reason = 'Defaulting to Employee Onboarding as standard enterprise workflow.';

  if (/leave|pto|vacation|time\s*off/.test(lower)) {
    detectedWorkflow = 'Leave Request';
    confidence = 95;
    reason = 'Matched keywords: leave/pto/vacation.';
  } else if (/travel|trip|flight|hotel|tour/.test(lower)) {
    detectedWorkflow = 'Travel Request';
    confidence = 92;
    reason = 'Matched keywords: travel/trip/flight.';
  } else if (/purchase|buy|procure|order|equipment/.test(lower)) {
    detectedWorkflow = 'Purchase Request';
    confidence = 90;
    reason = 'Matched keywords: purchase/buy/procure/equipment.';
  } else if (/exit|resign|terminate|quit|clearance/.test(lower)) {
    detectedWorkflow = 'Exit Process';
    confidence = 95;
    reason = 'Matched keywords: exit/resign/quit/clearance.';
  } else if (/interview|candidate|hiring|recruit|schedule\s*interview/.test(lower)) {
    detectedWorkflow = 'Interview Process';
    confidence = 88;
    reason = 'Matched keywords: interview/candidate/hiring.';
  } else if (/hire|onboard|register|new\s*employee/.test(lower)) {
    detectedWorkflow = 'Employee Onboarding';
    confidence = 98;
    reason = 'High confidence matching employee creation keywords: hire/onboard/new employee.';
  }

  const detectionPayload = {
    workflow_id: workflowId,
    detected_workflow: detectedWorkflow,
    confidence_percentage: confidence,
    reason: reason,
    detected_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('workflow_detection_results')
    .insert(detectionPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Gets all detection results
 */
const getDetectionResults = async (limit = 50) => {
  const { data, error } = await supabase
    .from('workflow_detection_results')
    .select('*, workflows(workflow_number, natural_language_command)')
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Gets detection result by workflow ID
 */
const getDetectionResultByWorkflowId = async (workflowId) => {
  const { data, error } = await supabase
    .from('workflow_detection_results')
    .select('*')
    .eq('workflow_id', workflowId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

module.exports = {
  detectAndLogWorkflow,
  getDetectionResults,
  getDetectionResultByWorkflowId
};
