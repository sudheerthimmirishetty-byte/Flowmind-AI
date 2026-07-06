const { supabase } = require("../supabase/client");

class WorkflowService {
  async createWorkflow(data) {
    // Set initial values if not provided
    const workflowData = {
      ...data,
      workflow_status: data.workflow_status || "In Progress",
      progress_percentage: data.progress_percentage || 0,
      started_at: new Date().toISOString()
    };

    // 1. Create Workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .insert([workflowData])
      .select()
      .single();

    if (workflowError) throw workflowError;

    try {
      // 2. Query existing departments to map tasks if possible
      const { data: departments } = await supabase
        .from("departments")
        .select("id, department_name, department_code")
        .eq("company_id", workflow.company_id);

      const findDeptId = (nameOrCode) => {
        if (!departments || departments.length === 0) return null;
        const lower = nameOrCode.toLowerCase();
        const found = departments.find(
          (d) =>
            d.department_name.toLowerCase().includes(lower) ||
            d.department_code.toLowerCase().includes(lower)
        );
        return found ? found.id : departments[0].id; // Fallback to first department
      };

      const hrDeptId = findDeptId("HR");
      const itDeptId = findDeptId("IT");
      const mgmtDeptId = findDeptId("Management") || findDeptId("Admin");

      // 3. Generate Initial Tasks (7 standard steps)
      const initialTasks = [
        {
          workflow_id: workflow.id,
          department_id: hrDeptId,
          task_name: "HR Verification",
          task_description: "Initial profile and eligibility check",
          execution_order: 1,
          priority: "High",
          status: "In Progress"
        },
        {
          workflow_id: workflow.id,
          department_id: hrDeptId,
          task_name: "Document Upload",
          task_description: "Employee uploads required documents (Aadhar, PAN, degree, etc.)",
          execution_order: 2,
          priority: "High",
          status: "Pending"
        },
        {
          workflow_id: workflow.id,
          department_id: itDeptId,
          task_name: "AI Verification",
          task_description: "AI validates uploaded document authenticity",
          execution_order: 3,
          priority: "Medium",
          status: "Pending"
        },
        {
          workflow_id: workflow.id,
          department_id: mgmtDeptId,
          task_name: "Manager Approval",
          task_description: "Department manager reviews and approves candidate",
          execution_order: 4,
          priority: "Medium",
          status: "Pending"
        },
        {
          workflow_id: workflow.id,
          department_id: itDeptId,
          task_name: "IT Setup",
          task_description: "Laptop, accounts, and tools provisioning",
          execution_order: 5,
          priority: "High",
          status: "Pending"
        },
        {
          workflow_id: workflow.id,
          department_id: hrDeptId,
          task_name: "Orientation",
          task_description: "Company culture and policy orientation session",
          execution_order: 6,
          priority: "Low",
          status: "Pending"
        },
        {
          workflow_id: workflow.id,
          department_id: mgmtDeptId,
          task_name: "Completed",
          task_description: "Onboarding process finalized and signed off",
          execution_order: 7,
          priority: "Low",
          status: "Pending"
        }
      ];

      const { error: tasksError } = await supabase
        .from("tasks")
        .insert(initialTasks);

      if (tasksError) console.error("Error creating initial tasks:", tasksError);

      // 4. Generate Initial Workflow Logs
      const initialLogs = [
        {
          workflow_id: workflow.id,
          action: "Created",
          message: `Workflow ${workflow.workflow_number} has been initialized successfully.`,
          performed_by: "System"
        },
        {
          workflow_id: workflow.id,
          action: "Tasks Generated",
          message: "Standard 7-step execution tasks generated.",
          performed_by: "System"
        }
      ];

      const { error: logsError } = await supabase
        .from("workflow_logs")
        .insert(initialLogs);

      if (logsError) console.error("Error creating initial logs:", logsError);

      // 5. Generate Initial Recommendations
      const initialRecommendations = [
        {
          workflow_id: workflow.id,
          recommendation_type: "Process Efficiency",
          recommendation_text: "Ensure HR Verification is completed within the first 24 hours to expedite downstream steps.",
          confidence_percentage: 95,
          status: "Active"
        },
        {
          workflow_id: workflow.id,
          recommendation_type: "Resource Management",
          recommendation_text: "Pre-order default laptop models for IT Setup to avoid procurement delays.",
          confidence_percentage: 88,
          status: "Active"
        }
      ];

      const { error: recsError } = await supabase
        .from("recommendations")
        .insert(initialRecommendations);

      if (recsError) console.error("Error creating initial recommendations:", recsError);
    } catch (e) {
      // Log error but don't fail the workflow creation itself
      console.error("Workflow automation error:", e);
    }

    return workflow;
  }

  async updateWorkflow(id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    if (data.workflow_status === "Completed") {
      updateData.completed_at = new Date().toISOString();
      updateData.progress_percentage = 100;
    }

    const { data: result, error } = await supabase
      .from("workflows")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteWorkflow(id) {
    const { data: result, error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkflows() {
    const { data: result, error } = await supabase
      .from("workflows")
      .select("*, workflow_types(workflow_code, workflow_name), workflow_definitions(display_name, version)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getWorkflowById(id) {
    const { data: result, error } = await supabase
      .from("workflows")
      .select("*, workflow_types(workflow_code, workflow_name), workflow_definitions(display_name, version)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkflowStatus(id) {
    const { data: result, error } = await supabase
      .from("workflows")
      .select("workflow_status")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.workflow_status : null;
  }

  async getWorkflowProgress(id) {
    const { data: result, error } = await supabase
      .from("workflows")
      .select("progress_percentage")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.progress_percentage : null;
  }

  async getWorkflowHistory(id) {
    const { data: result, error } = await supabase
      .from("workflow_logs")
      .select("*")
      .eq("workflow_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async getWorkflowPriority(id) {
    const { data: result, error } = await supabase
      .from("workflows")
      .select("priority")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.priority : null;
  }

  async getWorkflowTimeline(id) {
    const { data: result, error } = await supabase
      .from("tasks")
      .select("*, departments(department_name)")
      .eq("workflow_id", id)
      .order("execution_order", { ascending: true });

    if (error) throw error;
    return result;
  }

  async getWorkflowSummary(id) {
    const workflow = await this.getWorkflowById(id);

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("status")
      .eq("workflow_id", id);

    if (tasksError) throw tasksError;

    const totalTasks = tasks ? tasks.length : 0;
    const completedTasks = tasks ? tasks.filter((t) => t.status === "Completed").length : 0;
    const activeTask = tasks ? tasks.find((t) => t.status === "In Progress") : null;

    return {
      workflow_id: workflow.id,
      workflow_number: workflow.workflow_number,
      status: workflow.workflow_status,
      progress: workflow.progress_percentage,
      priority: workflow.priority,
      task_completion: `${completedTasks}/${totalTasks}`,
      current_stage: activeTask ? activeTask.task_name : "N/A",
      started_at: workflow.started_at,
      completed_at: workflow.completed_at
    };
  }

  async triggerN8nAutomation(employeeId, workflowId, employee) {
    const axios = require("axios");
    const n8nUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/flowmind/onboarding";
    
    const payload = {
      success: true,
      workflowId: workflowId,
      workflow: "employee_onboarding",
      employee_id: employeeId,
      workflow_id: workflowId,
      employee_name: employee.employee_name,
      employee_email: employee.employee_email,
      phone: employee.phone || "",
      role: employee.role,
      department: employee.department,
      joining_date: employee.joining_date,
      salary: employee.salary,
      manager_name: employee.manager_name || "",
      workflow_status: "In Progress",
      timestamp: new Date().toISOString(),
      informationExtraction: {
        success: true,
        extractedInformation: {
          employeeName: employee.employee_name,
          employeeEmail: employee.employee_email,
          phone: employee.phone || "",
          role: employee.role,
          department: employee.department,
          joiningDate: employee.joining_date,
          salary: String(employee.salary),
          reportingManager: employee.manager_name || ""
        }
      },
      workflowPlan: {
        success: true,
        estimatedDuration: "10 business days",
        stages: [
          { name: "Initiation", duration: "1 day", description: "Collect details and assign manager" },
          { name: "IT Setup", duration: "3 days", description: "Prepare accounts and hardware" },
          { name: "Verification", duration: "2 days", description: "Verify legal documents" },
          { name: "Orientation", duration: "4 days", description: "Induct employee and train" }
        ]
      },
      departmentTasks: {
        success: true,
        totalDepartments: 5,
        totalTasks: 15,
        departments: [
          {
            department: "Human Resources",
            tasks: [
              { task_name: "Employee Profile", description: "Create internal profile for candidate." },
              { task_name: "HR Verification", description: "Verify personal and academic credentials." },
              { task_name: "Offer Confirmation", description: "Confirm offer acceptance." }
            ]
          },
          {
            department: "IT Setup",
            tasks: [
              { task_name: "Company Email", description: "Provision corporate email mailbox." },
              { task_name: "Laptop Assignment", description: "Allocate hardware laptop profile." },
              { task_name: "Software Access", description: "Grant access to standard developer software." }
            ]
          },
          {
            department: "Finance",
            tasks: [
              { task_name: "Payroll Setup", description: "Configure payroll account profile." },
              { task_name: "Bank Verification", description: "Verify candidate bank accounts." },
              { task_name: "Tax Profile", description: "Enroll in local tax withholdings." }
            ]
          },
          {
            department: "Admin",
            tasks: [
              { task_name: "ID Card", description: "Generate internal security entry badge." },
              { task_name: "Desk Allocation", description: "Assign physical workstation seat." },
              { task_name: "Welcome Kit", description: "Prepare company swag and orientation handbook." }
            ]
          },
          {
            department: "Management",
            tasks: [
              { task_name: "Mentor Assignment", description: "Pair candidate with senior developer mentor." },
              { task_name: "Team Introduction", description: "Introduce candidate to team members." },
              { task_name: "First Week Plan", description: "Establish tasks and goals for week 1." }
            ]
          }
        ]
      },
      documents: {
        success: true,
        documents: [
          { document_type: "Offer Letter", name: `Offer_Letter_${employee.employee_name.replace(/\s+/g, "_")}.md`, required: true },
          { document_type: "Appointment Letter", name: `Appointment_Letter_${employee.employee_name.replace(/\s+/g, "_")}.md`, required: true },
          { document_type: "Welcome Email", name: `Welcome_Email_${employee.employee_name.replace(/\s+/g, "_")}.md`, required: true },
          { document_type: "Onboarding Checklist", name: `Onboarding_Checklist_${employee.employee_name.replace(/\s+/g, "_")}.md`, required: true }
        ]
      },
      recommendations: {
        success: true,
        recommendations: [
          { title: "Expedite IT setup", description: "Provision developer tools before joining date." },
          { title: "Assign buddy developer", description: "Assign onboarding developer buddy." }
        ]
      },
      summary: {
        employee: employee.employee_name,
        role: employee.role,
        estimatedDuration: "10 business days",
        departments: 5,
        tasks: 15,
        documents: 4,
        recommendations: 2
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        engine: "FlowMind AI",
        version: "1.0"
      }
    };

    try {
      const res = await axios.post(n8nUrl, payload, { timeout: 15000 });
      
      if (res.status === 200 && res.data) {
        const data = res.data;
        
        await supabase
          .from("workflows")
          .update({
            workflow_status: data.workflowStatus || "Completed",
            progress_percentage: data.executionStatistics?.progressPercentage || 100,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", workflowId);

        await supabase
          .from("employees")
          .update({
            employee_status: data.workflowStatus || "Completed",
            updated_at: new Date().toISOString()
          })
          .eq("id", employeeId);

        await supabase
          .from("onboarding_details")
          .update({
            company_email_created: true,
            laptop_assigned: true,
            id_card_generated: true,
            orientation_completed: true,
            welcome_kit_prepared: true,
            onboarding_status: data.workflowStatus || "Completed",
            updated_at: new Date().toISOString()
          })
          .eq("employee_id", employeeId);

        const tasksToInsert = [];
        const departments = payload.departmentTasks.departments;
        let order = 1;
        for (const dept of departments) {
          const { data: dbDept } = await supabase
            .from("departments")
            .select("id")
            .ilike("department_name", `%${dept.department === 'Management' ? 'HR' : dept.department === 'Admin' ? 'IT' : dept.department}%`)
            .limit(1)
            .maybeSingle();

          const deptId = dbDept?.id || "10000000-0000-0000-0000-000000000001";

          for (const task of dept.tasks) {
            tasksToInsert.push({
              workflow_id: workflowId,
              department_id: deptId,
              task_name: task.task_name,
              task_description: task.description,
              execution_order: order++,
              priority: "Medium",
              status: "Completed",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        await supabase.from("tasks").delete().eq("workflow_id", workflowId);
        await supabase.from("tasks").insert(tasksToInsert);

        await supabase.from("workflow_logs").insert([
          {
            workflow_id: workflowId,
            action: "Completed",
            message: `Onboarding workflow completed. 15 tasks executed successfully across 5 departments.`,
            performed_by: "n8n Automation Engine"
          }
        ]);
        
        console.log(`n8n onboarding automation succeeded for employee ${employeeId}`);
      }
    } catch (err) {
      console.error(`n8n onboarding automation failed or offline:`, err.message);
      
      await supabase
        .from("workflows")
        .update({
          workflow_status: "Pending Automation",
          progress_percentage: 15,
          updated_at: new Date().toISOString()
        })
        .eq("id", workflowId);

      await supabase
        .from("employees")
        .update({
          employee_status: "Pending Automation",
          updated_at: new Date().toISOString()
        })
        .eq("id", employeeId);

      await supabase.from("workflow_logs").insert([
        {
          workflow_id: workflowId,
          action: "Failed Trigger",
          message: `n8n webhook offline. Workflow marked as 'Pending Automation'.`,
          performed_by: "System"
        }
      ]);
    }
  }

  async retryAutomation(workflowId) {
    const { data: employee, error } = await supabase
      .from("employees")
      .select("*")
      .eq("workflow_id", workflowId)
      .single();

    if (error || !employee) {
      throw new Error("Associated employee not found for this workflow ID");
    }

    await this.triggerN8nAutomation(employee.id, workflowId, employee);

    return await this.getWorkflowById(workflowId);
  }
}

module.exports = new WorkflowService();
