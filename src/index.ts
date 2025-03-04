import inquirer from 'inquirer';
import { Client } from 'pg';

const client = new Client({
  // Your connection details here
});

client.connect();

async function promptForEmployeeDetails() {
  // Define the questions object properly, ensuring TypeScript understands it
  const questions = [
    {
      type: 'input',
      name: 'firstName',
      message: "Enter the employee's first name:",
    },
    {
      type: 'input',
      name: 'lastName',
      message: "Enter the employee's last name:",
    },
    {
      type: 'input',
      name: 'roleId',
      message: "Enter the role ID for this employee:",
      validate: (input: string) => {
        const roleId = parseInt(input);
        if (isNaN(roleId) || roleId <= 0) {
          return 'Please enter a valid role ID (positive integer).';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'managerId',
      message: "Enter the manager ID for this employee (optional):",
      default: null,
      validate: (input: string) => {
        if (input && isNaN(parseInt(input))) {
          return 'Manager ID should be a valid number or leave it empty.';
        }
        return true;
      },
    },
  ];

  // Execute the prompt
  const { firstName, lastName, roleId, managerId } = await inquirer.prompt(questions);

  // Convert the input into numbers where appropriate
  const roleIdInt = parseInt(roleId);
  const managerIdInt = managerId ? parseInt(managerId) : null;

  console.log('Role ID:', roleIdInt);
  console.log('Manager ID:', managerIdInt);

  // Call the function to insert the employee into the database
  await insertEmployeeIntoDatabase(firstName, lastName, roleIdInt, managerIdInt);
}

async function insertEmployeeIntoDatabase(firstName: string, lastName: string, roleId: number, managerId: number | null) {
  const query = `
    INSERT INTO employee (first_name, last_name, role_id, manager_id)
    VALUES ($1, $2, $3, $4)
  `;
  const values = [firstName, lastName, roleId, managerId];

  try {
    const result = await client.query(query, values);
    console.log('Employee added successfully:', result);
  } catch (err) {
    console.error('Error inserting employee:', err);
  }
}

// Call the function to start the process
promptForEmployeeDetails();
