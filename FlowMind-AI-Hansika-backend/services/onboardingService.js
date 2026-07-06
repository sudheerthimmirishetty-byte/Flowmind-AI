const { supabase } = require("../supabase/client");


/**
 * Retrieves onboarding details for a specific employee.
 */
const getOnboardingDetails = async (employeeId) => {
  const { data, error } = await supabase
    .from('onboarding_details')
    .select('*, employees(employee_name, employee_email, role, department)')
    .eq('employee_id', employeeId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  // Seeding/fallback logic: If employee exists but no onboarding record exists, create one!
  if (!data) {
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .single();
      
    if (empErr) return null; // Employee doesn't exist
    
    // Create new onboarding record
    return await createOnboardingDetails(employeeId);
  }

  return data;
};

/**
 * Creates a default onboarding details entry for a new employee.
 */
const createOnboardingDetails = async (employeeId) => {
  const initialDetails = {
    employee_id: employeeId,
    company_email_created: false,
    laptop_assigned: false,
    id_card_generated: false,
    orientation_completed: false,
    welcome_kit_prepared: false,
    onboarding_status: 'Pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('onboarding_details')
    .insert(initialDetails)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Updates onboarding milestone details and updates the overall status.
 */
const updateOnboardingDetails = async (employeeId, updates) => {
  // Fetch existing first to ensure it exists
  let existing = await getOnboardingDetails(employeeId);
  if (!existing) {
    existing = await createOnboardingDetails(employeeId);
  }

  const allowedFields = [
    'company_email_created',
    'laptop_assigned',
    'id_card_generated',
    'orientation_completed',
    'welcome_kit_prepared',
    'onboarding_status'
  ];

  const updatePayload = {
    updated_at: new Date().toISOString()
  };

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updatePayload[field] = updates[field];
    }
  });

  // Dynamically calculate onboarding status if not explicitly passed
  if (updates.onboarding_status === undefined) {
    const email = updatePayload.company_email_created !== undefined ? updatePayload.company_email_created : existing.company_email_created;
    const laptop = updatePayload.laptop_assigned !== undefined ? updatePayload.laptop_assigned : existing.laptop_assigned;
    const idCard = updatePayload.id_card_generated !== undefined ? updatePayload.id_card_generated : existing.id_card_generated;
    const orientation = updatePayload.orientation_completed !== undefined ? updatePayload.orientation_completed : existing.orientation_completed;
    const kit = updatePayload.welcome_kit_prepared !== undefined ? updatePayload.welcome_kit_prepared : existing.welcome_kit_prepared;

    const completedCount = [email, laptop, idCard, orientation, kit].filter(Boolean).length;

    if (completedCount === 5) {
      updatePayload.onboarding_status = 'Completed';
    } else if (completedCount > 0) {
      updatePayload.onboarding_status = 'In Progress';
    } else {
      updatePayload.onboarding_status = 'Pending';
    }
  }

  const { data, error } = await supabase
    .from('onboarding_details')
    .update(updatePayload)
    .eq('employee_id', employeeId)
    .select()
    .single();

  if (error) throw error;
  
  // Sync the status to the employee table as well
  if (data.onboarding_status) {
    await supabase
      .from('employees')
      .update({ employee_status: data.onboarding_status, updated_at: new Date().toISOString() })
      .eq('id', employeeId);
  }

  return data;
};

module.exports = {
  getOnboardingDetails,
  createOnboardingDetails,
  updateOnboardingDetails
};
