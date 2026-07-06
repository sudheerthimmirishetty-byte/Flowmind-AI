const { supabase } = require("../supabase/client");

class WorkflowDefinitionService {
  async createWorkflowDefinition(data) {
    const { data: result, error } = await supabase
      .from("workflow_definitions")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateWorkflowDefinition(id, data) {
    const { data: result, error } = await supabase
      .from("workflow_definitions")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteWorkflowDefinition(id) {
    const { data: result, error } = await supabase
      .from("workflow_definitions")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkflowDefinitions() {
    const { data: result, error } = await supabase
      .from("workflow_definitions")
      .select("*, workflow_types(workflow_code, workflow_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getWorkflowDefinitionById(id) {
    const { data: result, error } = await supabase
      .from("workflow_definitions")
      .select("*, workflow_types(workflow_code, workflow_name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result;
  }
}

module.exports = new WorkflowDefinitionService();
