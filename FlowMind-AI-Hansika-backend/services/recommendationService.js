const { supabase } = require("../supabase/client");

class RecommendationService {
  async createRecommendation(data) {
    const { data: result, error } = await supabase
      .from("recommendations")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkflowRecommendations(workflowId) {
    const { data: result, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getConfidencePercentage(id) {
    const { data: result, error } = await supabase
      .from("recommendations")
      .select("confidence_percentage")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.confidence_percentage : null;
  }

  async getRecommendationStatus(id) {
    const { data: result, error } = await supabase
      .from("recommendations")
      .select("status")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.status : null;
  }

  async getRecommendationHistory(workflowId) {
    // History is represented by the log of recommendations or active/archived recommendations
    const { data: result, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return result;
  }
}

module.exports = new RecommendationService();
