require('dotenv').config(); // Load environment variables from .env file
const inquirer = require('inquirer').default;  // Fix: Default export of inquirer
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Create PostgreSQL client using environment variables
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

client.connect()
  .then(() => console.log('Connected to the database!'))
  .catch((err) => console.error('Connection error', err.stack));

// Inquirer prompts for the main menu
const mainMenu = () => {
  return inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      'View all departments',
      'View all roles',
      'View all employees',
      'Add a department',
      'Add a role',
      'Add an employee',
      'Update an employee role',
      'Exit'
    ]
  });
};

// Function to get all departments
const getAllDepartments = async () => {
  const res = await client.query('SELECT * FROM department');
  console.table(res.rows);
};

// Function to get all roles
const getAllRoles = async () => {
  const res = await client.query('SELECT * FROM role');
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
    type: 'input',
    name: 'name',
    message: 'Enter the name of the department:',
  });

  // Add the new department to the database
  await client.query('INSERT INTO department (name) VALUES ($1)', [name]);
  console.log(`Department "${name}" added successfully!`);

  // Refresh the department list after adding a department
  const departmentsRes = await client.query('SELECT * FROM department');
  const departmentChoices = departmentsRes.rows.map(department => ({
    name: department.name,
    value: department.id
  }));

  // You can now pass the updated department list to the next steps as needed
};

// Function to add a role
const addRole = async () => {
  const departmentsRes = await client.query('SELECT * FROM department');
  const departmentChoices = departmentsRes.rows.map(department => ({
    name: department.name,
    value: department.id
  }));

  const { title, salary, department_id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Enter the title of the role:',
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Enter the salary for the role:',
      validate: input => !isNaN(input) ? true : 'Please enter a valid salary.'
    },
    {
      type: 'list',
      name: 'department_id',
      message: 'Select a department for this role:',
      choices: departmentChoices,
    }
  ]);

  await client.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, department_id]);
  console.log(`Role "${title}" added successfully!`);
};

// Function to add an employee
const addEmployee = async () => {
  // Get the latest departments from the database
  const departmentsRes = await client.query('SELECT * FROM department');
  const departmentChoices = departmentsRes.rows.map(department => ({
    name: department.name,
    value: department.id
  }));

  const rolesRes = await client.query('SELECT * FROM role');
  const roleChoices = rolesRes.rows.map(role => ({
    name: role.title,
    value: role.id
  }));

  const employeesRes = await client.query('SELECT * FROM employee');
  const managerChoices = employeesRes.rows.map(employee => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id
  }));

  const { first_name, last_name, role_id, department_id, manager_id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'first_name',
      message: 'Enter the first name of the employee:',
    },
    {
      type: 'input',
      name: 'last_name',
      message: 'Enter the last name of the employee:',
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'Select a role for this employee:',
      choices: roleChoices,
    },
    {
      type: 'list',
      name: 'department_id',
      message: 'Select a department for this employee:',
      choices: departmentChoices,  // Ensure the department list is dynamic
    },
    {
      type: 'list',
      name: 'manager_id',
      message: 'Select a manager for this employee (or leave blank if no manager):',
      choices: [...managerChoices, { name: 'None', value: null }],
    }
  ]);

  await client.query('INSERT INTO employee (first_name, last_name, role_id, department_id, manager_id) VALUES ($1, $2, $3, $4, $5)', [first_name, last_name, role_id, department_id, manager_id]);
  console.log(`Employee "${first_name} ${last_name}" added successfully!`);
};

// Function to update an employee role
const updateEmployeeRole = async () => {
  const employeesRes = await client.query('SELECT * FROM employee');
  const employeeChoices = employeesRes.rows.map(employee => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id
  }));

  const rolesRes = await client.query('SELECT * FROM role');
  const roleChoices = rolesRes.rows.map(role => ({
    name: role.title,
    value: role.id
  }));

  const { employee_id, new_role_id } = await inquirer.prompt([
    {
      type: 'list',
      name: 'employee_id',
      message: 'Select an employee to update:',
      choices: employeeChoices,
    },
    {
      type: 'list',
      name: 'new_role_id',
      message: 'Select a new role for the employee:',
      choices: roleChoices,
    }
  ]);

  await client.query('UPDATE employee SET role_id = $1 WHERE id = $2', [new_role_id, employee_id]);
  console.log(`Employee's role updated successfully!`);
};

// Main function to run the application
const runApp = async () => {
  let continueApp = true;

  while (continueApp) {
    const { action } = await mainMenu();

    switch (action) {
      case 'View all departments':
        await getAllDepartments();
        break;
      case 'View all roles':
        await getAllRoles();
        break;
      case 'View all employees':
        await getAllEmployees();
        break;
      case 'Add a department':
        await addDepartment();
        break;
      case 'Add a role':
        await addRole();
        break;
      case 'Add an employee':
        await addEmployee();
        break;
      case 'Update an employee role':
        await updateEmployeeRole();
        break;
      case 'Exit':
        continueApp = false;
        console.log('Goodbye!');
        break;
      default:
        break;
    }
  }

  client.end(); // Close the connection when done
};

runApp();
