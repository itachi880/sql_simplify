# sql_simplify

A simple and lightweight Object-Relational Mapping (ORM) library for Node.js, designed to interact with sql databases using promises. This ORM provides an easy-to-use interface for creating, reading, updating, and deleting records in your sql database.

## Features

- Promise-based API: Works seamlessly with async/await syntax for better error handling.
- Dynamic Schema Definition: Define your database schema using JavaScript objects.
- Table Creation: Automatically creates tables based on the provided schema.
- Supports Joins: Perform join operations with related tables.
- Custom SQL Queries: Execute custom SQL queries easily.
- a great error handling as we use golang like aproch
- you can benefite just from the error handling if you dont want
- ide intellessens in each step to increase productivity and reduce typose in code

## Installation

To install the package, run the following command:

```javascript
npm install sql_simplify
```

## Usage

### Setting Up the Database Connection (if you want to benefite just from error handling)

First, you need to create a sql pool connection. Here’s an example:

```javascript
const sql = require("mysql");
const { wraper } = require("sql_simplify/wraper");

const sql_pool = sql.createPool({
  host: "localhost",
  user: "your_username",
  password: "your_password",
  database: "your_database",
});

const db_connection = wraper(sql_pool);
```

### Defining a Table Schema

You can define your table schema as follows:

```javascript
const { Table } = require("./class");

const userSchema = {
  id: {
    type: Table.types.integer,
    autoInc: true,
    primary_key: true,
  },
  name: {
    type: Table.types.string,
    default: "",
    primary_key: false,
  },
  email: {
    type: Table.types.string,
    default: "",
    primary_key: false,
  },
};

const userTable = new Table({
  schema: userSchema,
  db_connection,
  table_name: "users",
});

// Create the table in the database
userTable.create_table_in_db();
```

### Performing CRUD Operations

You can use the defined table to perform CRUD operations:

## 1. Create

### example 1

```javascript
const newUser = { name: "John Doe", email: "john@example.com" };

const [createdUser, createError] = await userTable.create(newUser);

if (createError) {
  console.error("Error creating user:", createError);
} else {
  console.log("Created user:", createdUser);
}
```

#

> if you want you can benefit from the intellessens in you ide by simply create the object inside the `create` methode like this

#

### example

```javascript
const [createdUser, createError] = await userTable.create({
  name: "John Doe",
  //sholde get intellessens for email feald
});

if (createError) {
  console.error("Error creating user:", createError);
} else {
  console.log("Created user:", createdUser);
}
```

### 2. Read All

```javascript
const [users, findAllError] = await userTable.findAll();
if (findAllError) {
  console.error("Error fetching users:", findAllError);
} else {
  console.log("All users:", users);
}
```

### 3. Find By Condition

```javascript
const [foundUsers, findByError] = await userTable.findBy({
  email: { value: "john@example.com", operateur: "=" },
});
if (findByError) {
  console.error("Error finding user:", findByError);
} else {
  console.log("Found users:", foundUsers);
}
```

> #### i think its a great time to talk about conditions in our orm sens it may look inpractical at first

### 1. simple condition

```javascript
//ex 1
const condition1 = {
  feald: { operator: "=", value: 10 },
};
//like you said in sql
("... WHERE feald = 10");
//ex 2
const condition2 = {
  feald: { operator: ">=", value: 10 },
};
//like you said in sql
("... WHERE feald >= 10");
//you get the idea lastley the operation there as the same as the ones used in sql wich ("=",">=","<=","!=")
```

### 2. complexe conditions

#### the fun part begine

```javascript
//ex1
const condition1={
    and:[
        fieald1:{value:10,operator:"="},feald2:{value:"itachi":operator:"="}
    ]
}
//like you said in sql
"... WHERE ((feald1 = 10) and (feald2='itachi')) "
//the () here to help you understand in this case if you use theme or not will not affect the finel result

const condition1={
    and: [
    { fieald1: { value: 10, operator: "=" } ,
        or: [
          {
            feald2: { value: "itachi", operator: "=" },
          },
          { feald3: { value: "2022-01-10", operator: "<" } },
        ],
      },
  ],
}
//like you said in sql
"...
    WHERE
         ((feald1 = 10)
         and
            (
                (feald2='itachi' )
                or
                (fealde3 < "2022-01-10")
            )
         ) "
    /*
    i think you get the idea if you still dont understand
    correctly how it work you can use the static privet methode
    parseCondition from the tabel it accept a object `condition`
    and return the sql condition string

    lastly the and and or acept tabel of fealdes or other
    conditions as objects like
    */
    and:[
        {or:
            [
                {fieald}
            ]
        },
        fieald
        ]
    //each field is a aboject of the fielad {value ,operator}
```

### 4. Update

```javascript
const [updateResult, updateError] = await userTable.update({ name: "John Smith" }, { id: { value: 1, operateur: "=" } });
if (updateError) {
  console.error("Error updating user:", updateError);
} else {
  console.log("Updated user:", updateResult);
}
```

### 5. Delete

```javascript
const [deleteResult, deleteError] = await userTable.delete({
  id: { value: 1, operateur: "=" },
});
if (deleteError) {
  console.error("Error deleting user:", deleteError);
} else {
  console.log("Deleted user:", deleteResult);
}
```

### Joining Tables

To perform a join operation, use the getByJoin method:

```javascript
const { relatedTable } = require("./related_table");
//use the object instence of the model
const joinResult = await userTable.getByJoin({
  related_table: relatedTable,
  get: ["users.name", "relatedTable.columnName"], //you can use it like this and also like

  get: [`{usersTable.table_name}.column`, "relatedTable.columnName"], //or like
  get: ["column1", "column2"], //we shold talk about this
  join_type: "INNER",
  columns: { on: "relatedTable.userId", ref: "users.id" },
  condition: { "users.email": { value: "john@example.com", operateur: "=" } },
});
```

##

> the use case i want to talk about wich is "get: ["column1","column2"]" is a two edged sord from a prespective it shold give you `intellessens` of the colmns from the tow tables the `primary` key and the `foregen` key tables but if the primary and the foregen key hase the same name like we say the first table is `users` and the second is `post` and we have `post.id` and `users.id` you may face a issue about the db dont know wich table id you reference for by saing `id`

##

## API Documentation

### Table Class

- constructor({ schema, db_connection, table_name })
- create(obj): Promise<[Insert|null, sqlError|null]>
- findAll(): Promise<[TableDataType[]|null, sqlError|null]>
- findBy(obj): Promise<[TableDataType[]|null, sqlError|null]>
- update(new_data, by): Promise<[Update|null, sqlError|null]>
- delete(if_is): Promise<[Delete|null, sqlError|null]>
- getByJoin(params): Promise<[Table_columns[]|null, sqlError|null]>
- create_table_in_db(): Promise<[data|null, sqlError|null]>

## Error Handling

The `sql_simplify` ORM adopts a Golang-like approach to error handling, ensuring that errors are explicitly returned and can be handled in a structured manner.

All ORM methods return a tuple `[data, error]`, where:

- `data`: Contains the result of the query.
- `error`: Contains any error that occurred during execution.

### Example:

```javascript
const [returnedData, errorInProccess] = await table.methode(data);

if (errorInProccess) {
  console.error("Error :", errorInProccess);
} else {
  console.log("process success:", returnedData);
}
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### Joining Tables

To perform a join operation, use the `getByJoin` method:

```javascript
const { relatedTable } = require("./related_table");
// Use the object instance of the model
const joinResult = await userTable.getByJoin({
  related_table: relatedTable,
  get: ["users.name", "relatedTable.columnName"],
  // Example 1: Standard usage
  get: [`${usersTable.table_name}.column`, "relatedTable.columnName"],
  // Example 2: Using dynamic table names
  get: ["column1", "column2"],
  // Example 3: Table columns selection
  join_type: "INNER",
  columns: { on: "relatedTable.userId", ref: "users.id" },
  condition: { "users.email": { value: "john@example.com", operateur: "=" } },
});
```

## Handling Column Ambiguity in Joins

When using the `get: ["column1", "column2"]` option, there is a potential for ambiguity if the tables being joined have columns with the same name (e.g., `users.id` and `post.id`). In such cases, it's important to explicitly specify the table name along with the column to avoid conflicts.

For example, if both tables have a column named `id`, specify the table name like this:

```js
const joinResult = await userTable.getByJoin({
  related_table: relatedTable,
  get: ["users.id AS userId", "posts.id AS postId"],
  // Specify aliases to avoid ambiguity
  join_type: "INNER",
  columns: { on: "posts.userId", ref: "users.id" },
  condition: { "users.email": { value: "john@example.com", operateur: "=" } },
});
```

By specifying aliases, you can easily differentiate between the columns of the joined tables, ensuring that your queries are clear and error-free.
