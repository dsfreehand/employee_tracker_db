-- Drop tables if they exist
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS department;

-- Create the department table
CREATE TABLE department (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

-- Create the role table
CREATE TABLE role (
  id SERIAL PRIMARY KEY,
  title VARCHAR(30) UNIQUE NOT NULL,
  salary DECIMAL NOT NULL,
  department_id INTEGER NOT NULL REFERENCES department(id)
);

-- Create the employee table
CREATE TABLE employee (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES role(id),
  department_id INTEGER NOT NULL REFERENCES department(id),
  manager_id INTEGER REFERENCES employee(id) -- Self-referencing for managers
);

-- Insert departments
INSERT INTO department (name) VALUES
  ('Engineering'),
  ('Finance'),
  ('Legal'),
  ('Sales');

-- Insert roles (including manager positions)
INSERT INTO role (title, salary, department_id) VALUES
  ('Software Engineer', 100000, 1),
  ('Engineering Manager', 120000, 1),
  ('Accountant', 80000, 2),
  ('Finance Manager', 100000, 2),
  ('Lawyer', 120000, 3),
  ('Legal Manager', 140000, 3),
  ('Sales Lead', 80000, 4),
  ('Sales Manager', 90000, 4);

-- Insert managers first (so we can reference them when inserting employees)
INSERT INTO employee (first_name, last_name, role_id, department_id) VALUES
  ('Eve', 'Miller', 2, 1),   -- Engineering Manager
  ('Frank', 'Davis', 4, 2),  -- Finance Manager
  ('Grace', 'Wilson', 6, 3), -- Legal Manager
  ('Hank', 'Moore', 8, 4);   -- Sales Manager

-- Insert employees and assign managers
INSERT INTO employee (first_name, last_name, role_id, department_id, manager_id) VALUES
  ('Alice', 'Johnson', 1, 1, (SELECT id FROM employee WHERE first_name = 'Eve' AND last_name = 'Miller')), 
  ('Bob', 'Smith', 3, 2, (SELECT id FROM employee WHERE first_name = 'Frank' AND last_name = 'Davis')),      
  ('Charlie', 'Brown', 5, 3, (SELECT id FROM employee WHERE first_name = 'Grace' AND last_name = 'Wilson')),  
  ('Diana', 'Jones', 7, 4, (SELECT id FROM employee WHERE first_name = 'Hank' AND last_name = 'Moore'));    