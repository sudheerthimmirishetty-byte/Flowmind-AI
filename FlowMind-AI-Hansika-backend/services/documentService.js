const { supabase } = require("../supabase/client");

const generateDocWithAI = async (type, employee) => {
  const prompt = `You are an automated corporate onboarding assistant for FlowMind AI.
Generate a professional, fully-populated "${type}" for the following candidate:
- Name: ${employee.employee_name}
- Email: ${employee.employee_email}
- Phone: ${employee.phone || "N/A"}
- Role: ${employee.role}
- Department: ${employee.department}
- Salary Package: ${employee.salary} INR per annum
- Reporting Manager: ${employee.manager_name || "N/A"}
- Joining Date: ${employee.joining_date}

Format the document beautifully in markdown or text. Do not include markdown code blocks wrapping the outer text, just output the raw document content directly. Make it realistic, detailed, and completely populated (do not use brackets or placeholders).`;

  try {
    const aiEngine = require("./ai/aiEngine");
    const response = await aiEngine.execute({ prompt });
    if (response.success && response.data?.content) {
      return response.data.content.trim();
    }
    throw new Error("AI Engine returned unsuccessful or empty response.");
  } catch (err) {
    console.error(`AI Generation failed for ${type}, using fallback template:`, err);
    if (type === "Offer Letter") {
      return `OFFER LETTER

Date: ${new Date().toLocaleDateString()}

Dear ${employee.employee_name},

We are pleased to offer you employment with FlowMind AI Technologies in the position of ${employee.role}.

1. Department: ${employee.department}
2. Joining Date: ${employee.joining_date}
3. Annual CTC: ${employee.salary} INR
4. Reporting Manager: ${employee.manager_name || "N/A"}

Please sign and return this copy to signify your acceptance.

Sincerely,
HR Department
FlowMind AI Technologies`;
    }
    if (type === "Appointment Letter") {
      return `APPOINTMENT LETTER

Dear ${employee.employee_name},

We write to confirm your appointment as ${employee.role} at FlowMind AI Technologies starting on ${employee.joining_date}.

You will be under probation for a period of 6 months. Your salary package is ${employee.salary} per annum.

Welcome to our team!

Sincerely,
Management Board
FlowMind AI Technologies`;
    }
    if (type === "Welcome Email") {
      return `Subject: Welcome to the FlowMind AI Family!

Dear ${employee.employee_name},

We are thrilled to welcome you to FlowMind AI as our new ${employee.role} in the ${employee.department} department.

Your first day will be ${employee.joining_date}, reporting to ${employee.manager_name || "N/A"}.

Over the next few days, you will receive setup links and orientation schedules. Please reach out if you have any questions.

Best regards,
Onboarding Team
FlowMind AI Technologies`;
    }
    return `ONBOARDING CHECKLIST

Candidate Name: ${employee.employee_name}
Role: ${employee.role}
Department: ${employee.department}

[ ] Submit signed Offer Letter and personal credentials (Aadhar, PAN)
[ ] Provision IT Hardware and laptop configuration
[ ] Corporate email account creation
[ ] Complete HR orientation session
[ ] Manager and buddy introduction meeting`;
  }
};

class DocumentService {
  async createDocument(data) {
    const { data: result, error } = await supabase
      .from("documents")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateDocument(id, data) {
    const { data: result, error } = await supabase
      .from("documents")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteDocument(id) {
    const { data: result, error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkflowDocuments(workflowId) {
    const { data: result, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return result;
  }

  async generateAllOnboardingDocuments(employeeId, workflowId, employeeDetails) {
    const docTypes = [
      { type: "Offer Letter", name: `Offer_Letter_${employeeDetails.employee_name.replace(/\s+/g, "_")}.md` },
      { type: "Appointment Letter", name: `Appointment_Letter_${employeeDetails.employee_name.replace(/\s+/g, "_")}.md` },
      { type: "Welcome Email", name: `Welcome_Email_${employeeDetails.employee_name.replace(/\s+/g, "_")}.md` },
      { type: "Onboarding Checklist", name: `Onboarding_Checklist_${employeeDetails.employee_name.replace(/\s+/g, "_")}.md` },
    ];

    const results = [];
    for (const d of docTypes) {
      const docData = {
        employee_id: employeeId,
        workflow_id: workflowId,
        document_name: d.name,
        document_type: d.type,
        generated_content: "Document generation in progress...",
        generated_by: "AI HR Agent",
        status: "Pending",
        file_url: `https://storage.flowmindai.local/documents/${employeeId}/${d.name}`
      };

      const createdDoc = await this.createDocument(docData);
      results.push(createdDoc);

      // Trigger AI generation asynchronously
      generateDocWithAI(d.type, employeeDetails)
        .then(async (content) => {
          await this.updateDocument(createdDoc.id, {
            generated_content: content,
            status: "Approved"
          });
        })
        .catch(async (err) => {
          await this.updateDocument(createdDoc.id, {
            generated_content: "Failed to generate document content using AI.",
            status: "Rejected"
          });
        });
    }

    return results;
  }

  async regenerateDocument(id) {
    const { data: doc, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !doc) throw new Error("Document not found");

    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("*")
      .eq("id", doc.employee_id)
      .single();

    if (empErr || !employee) throw new Error("Associated employee not found");

    await this.updateDocument(id, {
      status: "Pending",
      generated_content: "Regeneration in progress..."
    });

    try {
      const content = await generateDocWithAI(doc.document_type, employee);
      return await this.updateDocument(id, {
        generated_content: content,
        status: "Approved"
      });
    } catch (err) {
      await this.updateDocument(id, {
        generated_content: "Failed to regenerate document content.",
        status: "Rejected"
      });
      throw err;
    }
  }

  async generateOfferLetter(workflowId, employeeDetails) {
    const documentName = `Offer_Letter_${employeeDetails.employee_name.replace(/\s+/g, "_")}.pdf`;
    const documentData = {
      workflow_id: workflowId,
      document_name: documentName,
      document_type: "Offer Letter",
      file_url: employeeDetails.file_url || `https://storage.flowmindai.local/documents/offers/${Date.now()}_offer.pdf`,
      generated_by: "AI HR Agent",
      status: "Approved"
    };

    const doc = await this.createDocument(documentData);

    await supabase.from("workflow_logs").insert([
      {
        workflow_id: workflowId,
        action: "Document Generated",
        message: `Offer Letter "${documentName}" has been generated.`,
        performed_by: "AI HR Agent"
      }
    ]);

    return doc;
  }

  async generateAppointmentLetter(workflowId, employeeDetails) {
    const documentName = `Appointment_Letter_${employeeDetails.employee_name.replace(/\s+/g, "_")}.pdf`;
    const documentData = {
      workflow_id: workflowId,
      document_name: documentName,
      document_type: "Appointment Letter",
      file_url: employeeDetails.file_url || `https://storage.flowmindai.local/documents/appointments/${Date.now()}_appointment.pdf`,
      generated_by: "AI HR Agent",
      status: "Approved"
    };

    const doc = await this.createDocument(documentData);

    await supabase.from("workflow_logs").insert([
      {
        workflow_id: workflowId,
        action: "Document Generated",
        message: `Appointment Letter "${documentName}" has been generated.`,
        performed_by: "AI HR Agent"
      }
    ]);

    return doc;
  }

  async generateWelcomeLetter(workflowId, employeeDetails) {
    const documentName = `Welcome_Letter_${employeeDetails.employee_name.replace(/\s+/g, "_")}.pdf`;
    const documentData = {
      workflow_id: workflowId,
      document_name: documentName,
      document_type: "Welcome Letter",
      file_url: employeeDetails.file_url || `https://storage.flowmindai.local/documents/welcome/${Date.now()}_welcome.pdf`,
      generated_by: "AI HR Agent",
      status: "Approved"
    };

    const doc = await this.createDocument(documentData);

    await supabase.from("workflow_logs").insert([
      {
        workflow_id: workflowId,
        action: "Document Generated",
        message: `Welcome Letter "${documentName}" has been generated.`,
        performed_by: "AI HR Agent"
      }
    ]);

    return doc;
  }

  async getDocumentStatus(id) {
    const { data: result, error } = await supabase
      .from("documents")
      .select("status")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result ? result.status : null;
  }

  async downloadDocument(id) {
    const { data: result, error } = await supabase
      .from("documents")
      .select("document_name, file_url, generated_content")
      .eq("id", id)
      .single();

    if (error) throw error;
    return result;
  }
}

module.exports = new DocumentService();
