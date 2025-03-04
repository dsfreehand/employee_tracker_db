import db from './db';

// View all departments
export const viewDepartments = async () => {
  const result = await db.query('SELECT * FROM department');
  console.table(result.rows);  // Display results as a table
};

// Add a department
export const addDepartment = async (name: string) => {
  await db.query('INSERT INTO department (name) VALUES ($1)', [name]);
  console.log(`Department "${name}" added.`);
};

// View all roles with department and salary info
export const viewRoles = async () => {
  const result = await db.query(
    `SELECT role.id, role.title, role.salary, department.name AS department 
     FROM role
     JOIN department ON role.department_id = department.id`
  );
  console.table(result.rows);  // Display results as a table
};

// Add a role
export const addRole = async (title: string, salary: number, departmentId: number) => {
  await db.query(
    'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
    [title, salary, departmentId]
  );
  console.log(`Role "${title}" added with salary ${salary}.`);
};

// View all employees with roles and manager information
export const viewEmployees = async () => {
  const result = await db.query(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, 
      department.name AS department, manager.first_name AS manager_first_name, manager.last_name AS manager_last_name
     FROM employee
     LEFT JOIN role ON employee.role_id = role.id
     LEFT JOIN department ON role.department_id = department.id
     LEFT JOIN employee manager ON employee.manager_id = manager.id`
  );
  console.table(result.rows);  // Display results as a table
};

// Add an employee
export const addEmployee = async (firstName: string, lastName: string, roleId: number, managerId: number | null) => {
  await db.query(
    'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
    [firstName, lastName, roleId, managerId]
  );
  console.log(`Employee "${firstName} ${lastName}" added.`);
};

// Update an employee's role
export const updateEmployeeRole = async (employeeId: number, newRoleId: number) => {
  await db.query(
    'UPDATE employee SET role_id = $1 WHERE id = $2',
    [newRoleId, employeeId]
  );
  console.log(`Employee with ID ${employeeId} updated to new role with ID ${newRoleId}.`);
};
