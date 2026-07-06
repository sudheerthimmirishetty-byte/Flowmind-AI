const { supabase } = require("../supabase/client");

class WorkflowTypeService {
  async createWorkflowType(data) {
    const { data: result, error } = await supabase
      .from("workflow_types")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateWorkflowType(id, data) {
    const { data: result, error } = await supabase
      .from("workflow_types")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteWorkflowType(id) {
    const { data: result, error } = await supabase
      .from("workflow_types")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkflowTypes() {
    const { data: result, error } = await supabase
      .from("workflow_types")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getWorkflowTypeById(id) {
    const { data: result, error } = await supabase
      .from("workflow_types")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result;
  }
}

module.exports = new WorkflowTypeService();
