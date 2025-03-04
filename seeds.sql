-- Active: 1741105046810@@127.0.0.1@5432@employee_tracker_db@public

CREATE TABLE department (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE role (
  id SERIAL PRIMARY KEY,
  title VARCHAR(30) UNIQUE NOT NULL,
  salary DECIMAL NOT NULL,
  department_id INTEGER NOT NULL REFERENCES department(id)
);

CREATE TABLE employee (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES role(id),
  manager_id INTEGER REFERENCES employee(id)
);

INSERT INTO department (name) VALUES
  ('Engineering'),
  ('Finance'),
  ('Legal'),
  ('Sales');

  INSERT INTO role (title, salary, department_id) VALUES
  ('Software Engineer', 100000, 1),
  ('Accountant', 80000, 2),
  ('Lawyer', 120000, 3),
  ('Sales Lead', 80000, 4);

    INSERT INTO employee (first_name, last_name, role_id) VALUES
    ('Alice', 'Johnson', 1),
    ('Bob', 'Smith', 2),
    ('Charlie', 'Brown', 3),
    ('Diana', 'Jones', 4);

SELECT * FROM role