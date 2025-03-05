require("dotenv").config(); // Load environment variables from .env file
const inquirer = require("inquirer").default; // Had issues with inquirer, so I added .default
const { Client } = require("pg"); // Required per the assignment
const fs = require("fs");
const path = require("path");

// Create PostgreSQL client using environment variables in my .env file
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

client
  .connect() // This actually makes the connection to the SQL database
  .then(() => console.log("Connected to the database!"))
  .catch((err) => console.error("Connection error", err.stack));

// Inquirer prompts for the main menu
const mainMenu = () => {
  return inquirer.prompt({
    type: "list",
    name: "action",
    message: "What would you like to do?",
    choices: [
      "View all departments",
      "View all roles",
      "View all employees",
      "View employees by manager",
      "View employees by department",
      "Add a department",
      "Add a role",
      "Add an employee",
      "Update an employee role",
      "View department budget",
      "Delete an employee",
      "Delete a department",
      "Delete a role",
      "Exit",
    ],
  });
};

// Function to get all departments
const getAllDepartments = async () => {
  const res = await client.query("SELECT * FROM department");
  console.table(res.rows);
};

// Function to get all roles
const getAllRoles = async () => {
  const res = await client.query("SELECT * FROM role");
  console.table(res.rows);
};

// Function to get all employees
const getAllEmployees = async () => {
  const res = await client.query(`
    SELECT e.id, e.first_name, e.last_name, r.title, d.name as department, r.salary, m.first_name as manager
    FROM employee e
    JOIN role r ON e.role_id = r.id
    JOIN department d ON r.department_id = d.id
    LEFT JOIN employee m ON e.manager_id = m.id
  `);
  console.table(res.rows);
};

// Function to add a department
const addDepartment = async () => {
  const { name } = await inquirer.prompt({
    type: "input",
    name: "name",
    message: "Enter the name of the department:",
  });

  // Add the new department to the database
  await client.query("INSERT INTO department (name) VALUES ($1)", [name]);
  console.log(`Department "${name}" added successfully!`);

  // Refresh the department list after adding a department
  const departmentsRes = await client.query("SELECT * FROM department");
  const departmentChoices = departmentsRes.rows.map((department) => ({
    name: department.name,
    value: department.id,
  }));
};

// Function to add a role
const addRole = async () => {
  const departmentsRes = await client.query("SELECT * FROM department");
  const departmentChoices = departmentsRes.rows.map((department) => ({
    name: department.name,
    value: department.id,
  }));

  const { title, salary, department_id } = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Enter the title of the role:",
    },
    {
      type: "input",
      name: "salary",
      message: "Enter the salary for the role:",
      validate: (input) =>
        !isNaN(input) ? true : "Please enter a valid salary.",
    },
    {
      type: "list",
      name: "department_id",
      message: "Select a department for this role:",
      choices: departmentChoices,
    },
  ]);

  await client.query(
    "INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)",
    [title, salary, department_id]
  );
  console.log(`Role "${title}" added successfully!`);
};

// Function to add an employee
const addEmployee = async () => {
  // Get the latest departments from the database
  const departmentsRes = await client.query("SELECT * FROM department");
  const departmentChoices = departmentsRes.rows.map((department) => ({
    name: department.name,
    value: department.id,
  }));

  const rolesRes = await client.query("SELECT * FROM role");
  const roleChoices = rolesRes.rows.map((role) => ({
    name: role.title,
    value: role.id,
  }));

  const employeesRes = await client.query("SELECT * FROM employee");
  const managerChoices = employeesRes.rows.map((employee) => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id,
  }));

  const { first_name, last_name, role_id, department_id, manager_id } =
    await inquirer.prompt([
      {
        type: "input",
        name: "first_name",
        message: "Enter the first name of the employee:",
      },
      {
        type: "input",
        name: "last_name",
        message: "Enter the last name of the employee:",
      },
      {
        type: "list",
        name: "role_id",
        message: "Select a role for this employee:",
        choices: roleChoices,
      },
      {
        type: "list",
        name: "department_id",
        message: "Select a department for this employee:",
        choices: departmentChoices, // Ensure the department list is dynamic
      },
      {
        type: "list",
        name: "manager_id",
        message:
          "Select a manager for this employee (or leave blank if no manager):",
        choices: [...managerChoices, { name: "None", value: null }],
      },
    ]);

  await client.query(
    "INSERT INTO employee (first_name, last_name, role_id, department_id, manager_id) VALUES ($1, $2, $3, $4, $5)",
    [first_name, last_name, role_id, department_id, manager_id]
  );
  console.log(`Employee "${first_name} ${last_name}" added successfully!`);
};

// Function to update an employee role
const updateEmployeeRole = async () => {
  const employeesRes = await client.query("SELECT * FROM employee");
  const employeeChoices = employeesRes.rows.map((employee) => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id,
  }));

  const managersRes = await client.query("SELECT * FROM employee");
  const managerChoices = managersRes.rows.map((employee) => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id,
  }));

  const rolesRes = await client.query("SELECT * FROM role");
  const roleChoices = rolesRes.rows.map((role) => ({
    name: role.title,
    value: role.id,
  }));

  const { employee_id, new_role_id } = await inquirer.prompt([
    {
      type: "list",
      name: "employee_id",
      message: "Select an employee to update:",
      choices: employeeChoices,
    },
    {
      type: "list",
      name: "new_role_id",
      message: "Select a new role for the employee:",
      choices: roleChoices,
    },
    {
      type: "list",
      name: "manager_id",
      message:
        "Select a manager for this employee (or leave blank if no manager):",
      choices: [...managerChoices, { name: "None", value: null }],
    },
  ]);

  await client.query("UPDATE employee SET role_id = $1 WHERE id = $2", [
    new_role_id,
    employee_id,
  ]);
  console.log(`Employee's role updated successfully!`);
};

const viewEmployeesByManager = async () => {
  try {
    // Query to get employees along with their manager's name (if applicable)
    const res = await client.query(`
        SELECT e.id, e.first_name, e.last_name, e.manager_id, m.first_name AS manager_first_name, m.last_name AS manager_last_name
        FROM employee e
        LEFT JOIN employee m ON e.manager_id = m.id
        ORDER BY m.last_name, m.first_name, e.last_name, e.first_name;
      `);

    const employees = res.rows;

    // Create a structure to hold employees by their manager
    const managers = {};

    employees.forEach((employee) => {
      // If the employee has a manager, we group them by manager_id
      const managerName = employee.manager_first_name
        ? `${employee.manager_first_name} ${employee.manager_last_name}`
        : "No Manager";

      if (!managers[managerName]) {
        managers[managerName] = [];
      }

      // Add the employee to the corresponding manager's list
      managers[managerName].push({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
      });
    });

    // Display the employees grouped by their manager
    for (const manager in managers) {
      console.log(`Manager: ${manager}`);
      managers[manager].forEach((employee) => {
        console.log(`  - ${employee.name}`);
      });
      console.log("\n"); // Add a new line for separation between managers
    }
  } catch (err) {
    console.error("Error viewing employees by manager:", err);
  }
};

const deleteEmployee = async () => {
  try {
    // Fetch the list of employees to display for selection
    const employeesRes = await client.query(
      "SELECT id, first_name, last_name FROM employee"
    );
    const employees = employeesRes.rows;

    // If no employees found, exit early
    if (employees.length === 0) {
      console.log("No employees found to delete.");
      return;
    }

    // Prompt user to select an employee to delete
    const { employeeToDeleteId } = await inquirer.prompt([
      {
        type: "list",
        name: "employeeToDeleteId",
        message: "Select the employee to delete:",
        choices: employees.map((emp) => ({
          name: `${emp.first_name} ${emp.last_name}`,
          value: emp.id,
        })),
      },
    ]);

    // Fetch the employee to be deleted (to get their full details)
    const employeeToDeleteRes = await client.query(
      "SELECT id, first_name, last_name, manager_id FROM employee WHERE id = $1",
      [employeeToDeleteId]
    );
    const employeeToDelete = employeeToDeleteRes.rows[0];

    if (!employeeToDelete) {
      console.log("Employee not found.");
      return;
    }

    // Update all employees who have this employee as their manager...
    // It did not like when I delete a manager and another emplyee still referenced them...
    // Set their manager_id to NULL (or reassign if necessary)
    await client.query(
      "UPDATE employee SET manager_id = NULL WHERE manager_id = $1",
      [employeeToDelete.id]
    );

    console.log(
      `Reassigned employees with ${employeeToDelete.first_name} ${employeeToDelete.last_name} as their manager to have no manager.`
    );

    // Step 4: Delete the employee
    await client.query("DELETE FROM employee WHERE id = $1", [
      employeeToDelete.id,
    ]);

    console.log(
      `Employee ${employeeToDelete.first_name} ${employeeToDelete.last_name} has been deleted successfully.`
    );
  } catch (err) {
    console.error("Error deleting employee:", err);
  }
};

const viewEmployeesByDepartment = async () => {
  try {
    // Query to get employees with their department names
    const res = await client.query(`
        SELECT e.id, e.first_name, e.last_name, d.name AS department
        FROM employee e
        JOIN department d ON e.department_id = d.id
        ORDER BY d.name, e.last_name, e.first_name
      `);

    const employees = res.rows;

    if (employees.length === 0) {
      console.log("No employees found.");
      return;
    }

    // Group employees by department
    const departments = employees.reduce((acc, employee) => {
      if (!acc[employee.department]) {
        acc[employee.department] = [];
      }
      acc[employee.department].push(
        `${employee.first_name} ${employee.last_name}`
      );
      return acc;
    }, {});

    // Display employees grouped by department
    for (const [department, employeeList] of Object.entries(departments)) {
      console.log(`\n${department}:`);
      employeeList.forEach((employee) => {
        console.log(`  - ${employee}`);
      });
    }
  } catch (err) {
    console.error("Error retrieving employees by department:", err);
  }
};

const deleteRole = async () => {
  try {
    // Step 1: Fetch all roles
    const rolesRes = await client.query("SELECT id, title FROM role");
    const roles = rolesRes.rows;

    // If no roles found, exit early
    if (roles.length === 0) {
      console.log("No roles found to delete.");
      return;
    }

    // Step 2: Prompt the user to select a role to delete
    const { roleToDeleteId } = await inquirer.prompt([
      {
        type: "list",
        name: "roleToDeleteId",
        message: "Select the role to delete:",
        choices: roles.map((role) => ({
          name: role.title,
          value: role.id,
        })),
      },
    ]);

    // Fetch details of the selected role
    const roleToDeleteRes = await client.query(
      "SELECT id, title FROM role WHERE id = $1",
      [roleToDeleteId]
    );
    const roleToDelete = roleToDeleteRes.rows[0];

    if (!roleToDelete) {
      console.log("Role not found.");
      return;
    }

    // Step 3: Check if any employees are assigned to the role
    const employeesInRoleRes = await client.query(
      "SELECT id, first_name, last_name FROM employee WHERE role_id = $1",
      [roleToDeleteId]
    );
    const employeesInRole = employeesInRoleRes.rows;

    if (employeesInRole.length > 0) {
      console.log(
        `There are ${employeesInRole.length} employee(s) assigned to this role:`
      );

      // List all employees assigned to the role
      employeesInRole.forEach((emp) => {
        console.log(`${emp.first_name} ${emp.last_name}`);
      });

      // Prompt user to reassign employees to another role
      const { reassignRole } = await inquirer.prompt([
        {
          type: "list",
          name: "reassignRole",
          message:
            "Would you like to reassign these employees to another role?",
          choices: ["Yes", "No"],
        },
      ]);

      if (reassignRole === "Yes") {
        // Step 4: Fetch all roles again for reassignment
        const rolesForReassignmentRes = await client.query(
          "SELECT id, title FROM role"
        );
        const rolesForReassignment = rolesForReassignmentRes.rows;

        // Prompt user to select a new role for the employees
        const { newRoleId } = await inquirer.prompt([
          {
            type: "list",
            name: "newRoleId",
            message: "Select a new role for the employees:",
            choices: rolesForReassignment.map((role) => ({
              name: role.title,
              value: role.id,
            })),
          },
        ]);

        // Step 5: Reassign employees to the new role
        await client.query(
          "UPDATE employee SET role_id = $1 WHERE role_id = $2",
          [newRoleId, roleToDeleteId]
        );

        console.log(
          `Employees have been reassigned to the new role successfully.`
        );
      } else {
        console.log("Employees will remain without a role.");
        // Optionally, set their `role_id` to NULL (if applicable)
        await client.query(
          "UPDATE employee SET role_id = NULL WHERE role_id = $1",
          [roleToDeleteId]
        );
      }
    }

    // Step 6: Delete the role
    await client.query("DELETE FROM role WHERE id = $1", [roleToDeleteId]);

    console.log(`Role '${roleToDelete.title}' has been deleted successfully.`);
  } catch (err) {
    console.error("Error deleting role:", err);
  }
};

const viewDepartmentBudget = async () => {
  try {
    // Fetch all departments
    const departmentsRes = await client.query(
      "SELECT id, name FROM department"
    );
    const departments = departmentsRes.rows;

    // If no departments exist
    if (departments.length === 0) {
      console.log("No departments found.");
      return;
    }

    // Prompt user to select a department
    const { departmentId } = await inquirer.prompt([
      {
        type: "list",
        name: "departmentId",
        message: "Select a department to view its total budget:",
        choices: departments.map((department) => ({
          name: department.name,
          value: department.id,
        })),
      },
    ]);

    // Calculate the total salary for the selected department
    const totalSalaryRes = await client.query(
      `SELECT SUM(r.salary) AS total_salary
         FROM employee e
         JOIN role r ON e.role_id = r.id
         WHERE r.department_id = $1`,
      [departmentId]
    );

    const totalSalary = totalSalaryRes.rows[0].total_salary;

    // Display the result
    if (totalSalary === null) {
      console.log("No employees found in this department.");
    } else {
      console.log(
        `The total budget (salary) for the department is: $${totalSalary}`
      );
    }
  } catch (err) {
    console.error("Error viewing department budget:", err);
  }
};

// Main function to run the application
const runApp = async () => {
  let continueApp = true;

  while (continueApp) {
    const { action } = await mainMenu();

    switch (action) {
      case "View all departments":
        await getAllDepartments();
        break;
      case "View all roles":
        await getAllRoles();
        break;
      case "View all employees":
        await getAllEmployees();
        break;
      case "Add a department":
        await addDepartment();
        break;
      case "Add a role":
        await addRole();
        break;
      case "Add an employee":
        await addEmployee();
        break;
      case "Update an employee role":
        await updateEmployeeRole();
        break;
      case "View employees by manager":
        await viewEmployeesByManager();
        break;
      case "Delete an employee":
        await deleteEmployee();
        break;
      case "Delete a department":
        await deleteDepartment();
        break;
      case "Delete a role":
        await deleteRole();
        break;
      case "View employees by department":
        await viewEmployeesByDepartment();
        break;
      case "View department budget":
        await viewDepartmentBudget();
        break;
      case "Exit":
        continueApp = false;
        console.log("Goodbye!");
        break;
      default:
        break;
    }
  }

  client.end(); // Close the connection when done
};

runApp();
