const { supabase } = require("../supabase/client");

class TaskService {
  async createTask(data) {
    const { data: result, error } = await supabase
      .from("tasks")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateTask(id, data) {
    const { data: result, error } = await supabase
      .from("tasks")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteTask(id) {
    const { data: result, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async assignTask(id, userId) {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .update({ assigned_user: userId, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (taskError) throw taskError;

    // Create log for assignment
    await supabase.from("workflow_logs").insert([
      {
        workflow_id: task.workflow_id,
        action: "Task Assigned",
        message: `Task "${task.task_name}" has been assigned to user.`,
        performed_by: "System"
      }
    ]);

    return task;
  }

  async completeTask(id, performedBy = "System") {
    // 1. Update task to Completed
    const { data: completedTask, error: taskError } = await supabase
      .from("tasks")
      .update({
        status: "Completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (taskError) throw taskError;

    const workflowId = completedTask.workflow_id;

    // 2. Fetch all tasks for the workflow to recalculate progress
    const { data: allTasks, error: fetchTasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("execution_order", { ascending: true });

    if (fetchTasksError) throw fetchTasksError;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "Completed").length;
    const progressPct = Math.round((completedTasks / totalTasks) * 100);

    // 3. Log task completion
    await supabase.from("workflow_logs").insert([
      {
        workflow_id: workflowId,
        action: "Task Completed",
        message: `Task "${completedTask.task_name}" was completed.`,
        performed_by: performedBy
      }
    ]);

    // 4. Determine and advance to next task in execution order
    let nextTask = null;
    const currentOrder = completedTask.execution_order;
    const pendingTasks = allTasks.filter(
      (t) => t.execution_order > currentOrder && t.status === "Pending"
    );

    if (pendingTasks.length > 0) {
      // Get the next task in order
      const targetNextTask = pendingTasks[0];
      const { data: updatedNext, error: nextTaskError } = await supabase
        .from("tasks")
        .update({ status: "In Progress", updated_at: new Date().toISOString() })
        .eq("id", targetNextTask.id)
        .select()
        .single();

      if (!nextTaskError) {
        nextTask = updatedNext;
        // Log next task activation
        await supabase.from("workflow_logs").insert([
          {
            workflow_id: workflowId,
            action: "Task Active",
            message: `Task "${nextTask.task_name}" is now in progress.`,
            performed_by: "System"
          }
        ]);
      }
    }

    // 5. Update workflow status and progress
    const workflowUpdate = {
      progress_percentage: progressPct,
      updated_at: new Date().toISOString()
    };

    if (completedTasks === totalTasks) {
      workflowUpdate.workflow_status = "Completed";
      workflowUpdate.completed_at = new Date().toISOString();

      // Log workflow completion
      await supabase.from("workflow_logs").insert([
        {
          workflow_id: workflowId,
          action: "Workflow Completed",
          message: "All tasks completed. Workflow finalized.",
          performed_by: "System"
        }
      ]);
    } else {
      workflowUpdate.workflow_status = "In Progress";
    }

    await supabase
      .from("workflows")
      .update(workflowUpdate)
      .eq("id", workflowId);

    return {
      completedTask,
      nextTask,
      progressPercentage: progressPct,
      workflowStatus: workflowUpdate.workflow_status || "In Progress"
    };
  }

  async getPendingTasks() {
    const { data: result, error } = await supabase
      .from("tasks")
      .select("*, workflows(workflow_number)")
      .eq("status", "Pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getCompletedTasks() {
    const { data: result, error } = await supabase
      .from("tasks")
      .select("*, workflows(workflow_number)")
      .eq("status", "Completed")
      .order("completed_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getDepartmentTasks(departmentId) {
    const { data: result, error } = await supabase
      .from("tasks")
      .select("*, workflows(workflow_number)")
      .eq("department_id", departmentId)
      .order("execution_order", { ascending: true });

    if (error) throw error;
    return result;
  }

  async getWorkflowTasks(workflowId) {
    const { data: result, error } = await supabase
      .from("tasks")
      .select("*, departments(department_name)")
      .eq("workflow_id", workflowId)
      .order("execution_order", { ascending: true });

    if (error) throw error;
    return result;
  }

  async getTaskStatus(id) {
    const { data: result, error } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.status : null;
  }

  async getTaskHistory(id) {
    // Return logs relevant to this task based on text search or workflow id
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("workflow_id, task_name")
      .eq("id", id)
      .single();

    if (taskError) throw taskError;

    const { data: logs, error: logsError } = await supabase
      .from("workflow_logs")
      .select("*")
      .eq("workflow_id", task.workflow_id)
      .like("message", `%${task.task_name}%`)
      .order("created_at", { ascending: false });

    if (logsError) throw logsError;
    return logs;
  }

  async getTaskPriority(id) {
    const { data: result, error } = await supabase
      .from("tasks")
      .select("priority")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.priority : null;
  }

  async updateExecutionOrder(id, order) {
    const { data: result, error } = await supabase
      .from("tasks")
      .update({ execution_order: order, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }
}

module.exports = new TaskService();
