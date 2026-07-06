const bcrypt = require("bcryptjs");
const { supabase } = require("../supabase/client");

async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Create a default company
    const defaultCompany = {
      id: "99999999-9999-9999-9999-999999999999",
      company_name: "FlowMind AI Technologies",
      industry: "Software",
      website: "https://flowmind.ai",
      logo_url: "https://flowmind.ai/logo.png"
    };

    console.log("Inserting default company...");
    const { error: companyErr } = await supabase
      .from("companies")
      .upsert([defaultCompany], { onConflict: "id" });

    if (companyErr) {
      console.warn("Could not insert company (it may already exist or table mismatch):", companyErr.message);
    } else {
      console.log("Default company inserted successfully!");
    }

    // 2. Insert standard departments
    const departments = [
      { id: "10000000-0000-0000-0000-000000000001", company_id: defaultCompany.id, department_name: "Human Resources", department_code: "HR" },
      { id: "10000000-0000-0000-0000-000000000002", company_id: defaultCompany.id, department_name: "Engineering", department_code: "ENG" },
      { id: "10000000-0000-0000-0000-000000000003", company_id: defaultCompany.id, department_name: "Finance", department_code: "FIN" },
      { id: "10000000-0000-0000-0000-000000000004", company_id: defaultCompany.id, department_name: "IT Setup", department_code: "IT" },
      { id: "10000000-0000-0000-0000-000000000005", company_id: defaultCompany.id, department_name: "Operations", department_code: "OPS" }
    ];

    console.log("Inserting departments...");
    const { error: deptErr } = await supabase
      .from("departments")
      .upsert(departments, { onConflict: "id" });

    if (deptErr) {
      console.warn("Could not insert departments:", deptErr.message);
    } else {
      console.log("Departments inserted successfully!");
    }

    // 3. Create default users (HR admin and Employee)
    const hrPasswordHash = await bcrypt.hash("hr123", 12);
    const empPasswordHash = await bcrypt.hash("emp123", 12);

    const users = [
      {
        id: "20000000-0000-0000-0000-000000000001",
        company_id: defaultCompany.id,
        full_name: "Sarah HR Admin",
        email: "hr@company.com",
        password_hash: hrPasswordHash,
        role: "hr",
        status: "active"
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        company_id: defaultCompany.id,
        full_name: "Arjun Employee",
        email: "employee@company.com",
        password_hash: empPasswordHash,
        role: "employee",
        status: "active"
      }
    ];

    console.log("Inserting seed users...");
    const { error: usersErr } = await supabase
      .from("users")
      .upsert(users, { onConflict: "id" });

    if (usersErr) {
      console.warn("Could not insert users:", usersErr.message);
    } else {
      console.log("Seed users inserted successfully!");
    }

    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Seeding execution failed:", err);
  }
}

seed();
