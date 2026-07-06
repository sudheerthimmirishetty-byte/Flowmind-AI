/**
 * supabase/client.js
 *
 * Supabase client singleton with automatic in-memory fallback.
 * If the SUPABASE_URL contains "your-project-id", it automatically
 * spins up an in-memory mock database to ensure the system is fully
 * functional and testable without active network credentials.
 */

"use strict";

const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

let supabase;
let supabaseAnon;

// Determine if we should use the mock database fallback
const useMock = !env.SUPABASE_URL || env.SUPABASE_URL.includes("your-project-id");

if (!useMock) {
  try {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      db: { schema: "public" },
    });

    supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  } catch (e) {
    console.warn("Failed to initialize real Supabase client. Falling back to mock DB.");
    setupMockDb();
  }
} else {
  console.log("Using in-memory mock database fallback for Supabase.");
  setupMockDb();
}

function setupMockDb() {
  // In-memory tables
  const db = {
    companies: [
      {
        id: "99999999-9999-9999-9999-999999999999",
        company_name: "FlowMind AI Technologies",
        industry: "Software",
        website: "https://flowmind.ai",
        logo_url: "https://flowmind.ai/logo.png"
      }
    ],
    departments: [
      { id: "10000000-0000-0000-0000-000000000001", company_id: "99999999-9999-9999-9999-999999999999", department_name: "Human Resources", department_code: "HR" },
      { id: "10000000-0000-0000-0000-000000000002", company_id: "99999999-9999-9999-9999-999999999999", department_name: "Engineering", department_code: "ENG" },
      { id: "10000000-0000-0000-0000-000000000003", company_id: "99999999-9999-9999-9999-999999999999", department_name: "Finance", department_code: "FIN" },
      { id: "10000000-0000-0000-0000-000000000004", company_id: "99999999-9999-9999-9999-999999999999", department_name: "IT Setup", department_code: "IT" },
      { id: "10000000-0000-0000-0000-000000000005", company_id: "99999999-9999-9999-9999-999999999999", department_name: "Operations", department_code: "OPS" }
    ],
    users: [
      {
        id: "20000000-0000-0000-0000-000000000001",
        company_id: "99999999-9999-9999-9999-999999999999",
        full_name: "Sarah HR Admin",
        email: "hr@company.com",
        password_hash: bcrypt.hashSync("hr1234", 10),
        role: "hr",
        status: "active"
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        company_id: "99999999-9999-9999-9999-999999999999",
        full_name: "Arjun Employee",
        email: "employee@company.com",
        password_hash: bcrypt.hashSync("emp1234", 10),
        role: "employee",
        status: "active"
      }
    ],
    employees: [],
    workflows: [],
    tasks: [],
    workflow_logs: [],
    recommendations: [],
    ai_agents: [
      { id: '11111111-1111-1111-1111-111111111111', agent_name: 'Workflow Detection Agent', description: 'Analyzes inputs to classify processes.', version: '1.0.0', status: 'active' },
      { id: '22222222-2222-2222-2222-222222222222', agent_name: 'Workflow Orchestrator', description: 'Plans and coordinates tasks.', version: '1.0.0', status: 'active' },
      { id: '33333333-3333-3333-3333-333333333333', agent_name: 'HR Agent', description: 'Manages employee metadata and records.', version: '1.1.0', status: 'active' },
      { id: '44444444-4444-4444-4444-444444444444', agent_name: 'IT Agent', description: 'Triggers laptop and account setups.', version: '1.0.0', status: 'active' },
      { id: '55555555-5555-5555-5555-555555555555', agent_name: 'Finance Agent', description: 'Validates salary and payroll accounts.', version: '1.0.0', status: 'active' }
    ]
  };

  class QueryBuilder {
    constructor(table, data) {
      this.table = table;
      this.data = [...data];
      this.filters = [];
      this._limit = null;
      this._range = null;
      this._order = null;
      this._single = false;
      this._maybeSingle = false;
    }

    select(columns, options) {
      return this;
    }

    eq(column, value) {
      this.filters.push((item) => item[column] === value);
      return this;
    }

    neq(column, value) {
      this.filters.push((item) => item[column] !== value);
      return this;
    }

    in(column, values) {
      this.filters.push((item) => values.includes(item[column]));
      return this;
    }

    ilike(column, pattern) {
      const regex = new RegExp(pattern.replace(/%/g, ".*"), "i");
      this.filters.push((item) => regex.test(item[column] || ""));
      return this;
    }

    or(pattern) {
      // Simple parse for or filters like col.ilike.%val%
      this.filters.push((item) => {
        const parts = pattern.split(",");
        return parts.some((p) => {
          const [col, op, val] = p.split(".");
          const cleanVal = (val || "").replace(/%/g, "");
          return String(item[col] || "").toLowerCase().includes(cleanVal.toLowerCase());
        });
      });
      return this;
    }

    order(column, { ascending = true } = {}) {
      this._order = { column, ascending };
      return this;
    }

    range(from, to) {
      this._range = { from, to };
      return this;
    }

    limit(num) {
      this._limit = num;
      return this;
    }

    single() {
      this._single = true;
      return this;
    }

    maybeSingle() {
      this._maybeSingle = true;
      return this;
    }

    async then(resolve, reject) {
      try {
        let result = [];

        if (this.action === "insert") {
          const arr = Array.isArray(this.actionPayload) ? this.actionPayload : [this.actionPayload];
          const inserted = [];
          for (const r of arr) {
            const newRecord = {
              id: r.id || require("crypto").randomUUID(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...r
            };
            db[this.table].push(newRecord);
            inserted.push(newRecord);
          }
          result = inserted;
        } else if (this.action === "update") {
          let matching = [...this.data];
          for (const filter of this.filters) {
            matching = matching.filter(filter);
          }
          for (const r of matching) {
            const index = db[this.table].findIndex((item) => item.id === r.id);
            if (index !== -1) {
              db[this.table][index] = {
                ...db[this.table][index],
                ...this.actionPayload,
                updated_at: new Date().toISOString()
              };
              Object.assign(r, this.actionPayload);
              r.updated_at = db[this.table][index].updated_at;
            }
          }
          result = matching;
        } else if (this.action === "delete") {
          let matching = [...this.data];
          for (const filter of this.filters) {
            matching = matching.filter(filter);
          }
          for (const r of matching) {
            const index = db[this.table].findIndex((item) => item.id === r.id);
            if (index !== -1) {
              db[this.table].splice(index, 1);
            }
          }
          result = matching;
        } else if (this.action === "upsert") {
          const arr = Array.isArray(this.actionPayload) ? this.actionPayload : [this.actionPayload];
          const upserted = [];
          const onConflict = this.onConflict || "id";
          for (const r of arr) {
            const conflictVal = r[onConflict];
            const index = db[this.table].findIndex((item) => item[onConflict] === conflictVal);
            if (index !== -1) {
              db[this.table][index] = {
                ...db[this.table][index],
                ...r,
                updated_at: new Date().toISOString()
              };
              upserted.push(db[this.table][index]);
            } else {
              const newRecord = {
                id: r.id || require("crypto").randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...r
              };
              db[this.table].push(newRecord);
              upserted.push(newRecord);
            }
          }
          result = upserted;
        } else {
          result = [...this.data];
          for (const filter of this.filters) {
            result = result.filter(filter);
          }
        }

        // Apply ordering (only for select queries)
        if (this._order && !this.action) {
          const { column, ascending } = this._order;
          result.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
          });
        }

        const count = result.length;

        // Apply range & limit
        if (this._range) {
          result = result.slice(this._range.from, this._range.to + 1);
        }
        if (this._limit) {
          result = result.slice(0, this._limit);
        }

        let finalData = result;
        if (this._single) {
          if (result.length === 0) {
            return resolve({ data: null, error: { message: "Row not found", code: "PGRST116" }, count: 0 });
          }
          finalData = result[0];
        } else if (this._maybeSingle) {
          finalData = result.length > 0 ? result[0] : null;
        }

        resolve({ data: finalData, error: null, count });
      } catch (err) {
        resolve({ data: null, error: { message: err.message }, count: 0 });
      }
    }

    insert(records) {
      this.action = "insert";
      this.actionPayload = records;
      return this;
    }

    update(updates) {
      this.action = "update";
      this.actionPayload = updates;
      return this;
    }

    delete() {
      this.action = "delete";
      return this;
    }

    upsert(records, options = {}) {
      this.action = "upsert";
      this.actionPayload = records;
      this.onConflict = options.onConflict;
      return this;
    }
  }

  const mockClient = {
    from: (table) => {
      if (!db[table]) db[table] = [];
      return new QueryBuilder(table, db[table]);
    }
  };

  supabase = mockClient;
  supabaseAnon = mockClient;
}

module.exports = { supabase, supabaseAnon };
