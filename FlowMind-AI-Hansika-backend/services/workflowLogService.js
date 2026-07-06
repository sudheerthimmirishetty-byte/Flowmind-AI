const { supabase } = require("../supabase/client");

class WorkflowLogService {
  async createWorkflowLog(data) {
    const { data: result, error } = await supabase
      .from("workflow_logs")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkflowHistory(workflowId) {
    const { data: result, error } = await supabase
      .from("workflow_logs")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getActivityTimeline(workflowId) {
    const { data: result, error } = await supabase
      .from("workflow_logs")
      .select("id, action, message, performed_by, created_at")
      .eq("workflow_id", workflowId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return result;
  }

  async getRecentLogs(limit = 10) {
    const { data: result, error } = await supabase
      .from("workflow_logs")
      .select("*, workflows(workflow_number)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return result;
  }

  async getActionHistory(workflowId, actionType = null) {
    let query = supabase
      .from("workflow_logs")
      .select("*")
      .eq("workflow_id", workflowId);

    if (actionType) {
      query = query.eq("action", actionType);
    }

    const { data: result, error } = await query.order("created_at", {
      ascending: false
    });

    if (error) throw error;
    return result;
  }
}

module.exports = new WorkflowLogService();
