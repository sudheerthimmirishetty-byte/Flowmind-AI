const { supabase } = require("../supabase/client");


/**
 * Logs an AI agent execution entry.
 */
const logExecution = async (payload) => {
  const executionData = {
    workflow_id: payload.workflow_id,
    agent_id: payload.agent_id,
    input_data: typeof payload.input_data === 'object' ? JSON.stringify(payload.input_data) : payload.input_data,
    output_data: typeof payload.output_data === 'object' ? JSON.stringify(payload.output_data) : payload.output_data,
    execution_time_ms: payload.execution_time_ms || 0,
    confidence_percentage: payload.confidence_percentage || 100,
    status: payload.status || 'success',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('agent_executions')
    .insert(executionData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Gets all agent execution logs.
 */
const getExecutions = async (limit = 50) => {
  const { data, error } = await supabase
    .from('agent_executions')
    .select('*, ai_agents(agent_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Gets execution logs for a specific workflow.
 */
const getExecutionsByWorkflowId = async (workflowId) => {
  const { data, error } = await supabase
    .from('agent_executions')
    .select('*, ai_agents(agent_name)')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

module.exports = {
  logExecution,
  getExecutions,
  getExecutionsByWorkflowId
};
