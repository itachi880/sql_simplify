"use-strict";
/**
 * @typedef {object} Delete
 * @property {number} affectedRows - The number of rows that were deleted.
 * @property {number} warningCount - The number of warnings that occurred during the execution.
 * @property {string} message - A message summarizing the execution (optional).
 * @property {number} serverStatus - The status of the server after the query execution.
 */

/**
 * @typedef {object} Update
 * @property {number} affectedRows - The number of rows that matched the update condition.
 * @property {number} changedRows - The number of rows that were actually changed (i.e., new values differ from existing).
 * @property {number} warningCount - The number of warnings that occurred during the query execution.
 * @property {string} message - A summary of the execution, typically containing row match/change counts.
 * @property {number} serverStatus - The status of the server after the query execution.
 */

/**
 * @typedef {object} Insert
 * @property {number} affectedRows - The number of rows that were inserted.
 * @property {number} insertId - The ID of the inserted row, particularly useful for tables with an AUTO_INCREMENT field.
 * @property {number} warningCount - The number of warnings that occurred during the query execution.
 * @property {string} message - A summary of the execution, such as the number of inserted rows.
 * @property {number} serverStatus - The status of the server after the query execution.
 */
/**
 * @template  default_val_column
 */
/**
 * @typedef {Object} ColumnDefinition
 * @property {string} type - The data type of the column (e.g., 'integer', 'string').
 * @property {boolean} autoInc - Indicates if the column is auto-incrementing.
 * @property {default_val_column} default - The default value for the column.
 * @property {boolean} primary_key - Indicates if this column is a primary key.
 */
/**
 * @template  Table_columns
 */
/**
 * @example
 * const { Table } = require("sql_simplify");

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

 */
class Table {
  static types = {
    string: "VARCHAR(255)",
    integer: "INT",
    float: "FLOAT",
    boolean: "BOOL",
    object: "LONGTEXT",
  };
  /**
   * @param {object} param0
   * @param {Record<keyof Table_columns, ColumnDefinition>} param0.schema - The table schema, where each key is a column name and the value is a ColumnDefinition.
   * @param {import("mysql").Pool} param0.db_connection
   * @param {string} param0.table_name
   */
  constructor({ schema = {}, db_connection = false, table_name = "" }) {
    this.schema = schema;
    this.table_name = table_name;
    this.table_id_name = null;
    Object.entries(schema).forEach((column) => {
      if (column[1].primary_key) this.table_id_name = column[0];
    });
    /**
     * @type {(sql:string)=>Promise<[response<any>,import("mysql").MysqlError|null]>}
     */
    this.db_connection = wraper(db_connection);
    //check for table if exist if not create it
  }
  /**
   * @typedef {Record.<keyof Table_columns, ColumnDefinition["default"]>} TableDataType
   */
  /**
   * @example
   * const newUser = { name: "John Doe", email: "john@example.com" };
    const [createdUser, createError] = await userTable.create(newUser);

    if (createError) {
      console.error("Error creating user:", createError);
    } else {
      console.log("Created user:", createdUser);
    }
   * @description Creates a new instance of the table.
   * @param {TableDataType} obj - An object containing the values to insert.
   * @returns {Promise<[(Insert|null), (import("mysql").MysqlError|null)]>}
   */
  async create(obj) {
    /**
     * @type {[(Insert|null),(import("mysql").MysqlError|null)]}
     */
    const [data, error] = await this.db_connection(
      `INSERT INTO ${this.table_name} (${Object.keys(obj).join(",")}) VALUES (${Object.values(obj)
        .map((value) => "'" + Table.#escapeChar(typeof value == "object" ? JSON.stringify(value) : value + "") + "'")
        .join(",")})`
    );
    if (error) {
      console.log(" error message : " + error.message, "\nsql query : " + error.sqlMessage);
      return [null, error];
    }
    if (data.insertId && this.table_id_name) obj[this.table_id_name] = data.insertId;
    return [obj, null];
  }
  /**
   *
   * @returns {Promise<[(TableDataType[]|null),(import("mysql").MysqlError|null)]>}
   * @example
   * const [users, findAllError] = await userTable.findAll();
    if (findAllError) {
      console.error("Error fetching users:", findAllError);
    } else {
      console.log("All users:", users);
    }
   */
  async findAll() {
    return await this.db_connection(`SELECT * FROM ${this.table_name}`);
  }

  /**
   * @typedef {object} Schema
   * @property {string} value - Description of the column property.
   * @property {string} operateur - Description of the column property.
   * @typedef {Record<keyof TableDataType, Schema>} All
   * @typedef {object} Condition
   * @property {(Condition|fullcondition)[]} and - Logical `AND` conditions
   * @property {(Condition|fullcondition)[]} or - Logical `OR` conditions
   * @typedef {(All & Condition)} fullcondition
   * @param {Condition} obj
   * @returns {Promise<[Table_columns[]|null,(import("mysql").MysqlError|null)]>}
   *@example
      const [foundUsers, findByError] = await userTable.findBy({
      email: { value: "john@example.com", operateur: "=" },
    });
    if (findByError) {
      console.error("Error finding user:", findByError);
    } else {
      console.log("Found users:", foundUsers);
    }
   **/
  async findBy(obj) {
    return await this.db_connection(`SELECT * FROM ${this.table_name} WHERE ${Table.#parse_condition(obj)}`);
  }
  /**
   * Updates existing rows in the database.
   * @param {TableDataType} new_data - An object containing the new values to set.
   * @param {fullcondition} by - The condition to identify which rows to update.
   * @returns {Promise<[Update|null, (import("mysql").MysqlError|null)]>}
   * @example
   * const [updateResult, updateError] = await userTable.update({ name: "John Smith" }, { id: { value: 1, operateur: "=" } });
      if (updateError) {
        console.error("Error updating user:", updateError);
      } else {
        console.log("Updated user:", updateResult);
      }
   */

  async update(new_data = {}, by = {}) {
    return await this.db_connection(`
      UPDATE  ${this.table_name}
      SET ${Object.entries(new_data)
        .map((columnUpd) => columnUpd[0] + "=" + '"' + Table.#escapeChar(columnUpd[1]) + '"')
        .join(",")}
      ${Object.keys(by).length != 0 ? " WHERE " + Table.#parse_condition(by) : ""}`);
  }
  /**
   * @param {fullcondition} if_is can be {} if the deletion has to affect every column be carfull what you put here
   * @returns {Promise<[data<Delete>,(import("mysql").MysqlError|null)]>}
   * @example
   * const [deleteResult, deleteError] = await userTable.delete({
      id: { value: 1, operateur: "=" },
    });
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
    } else {
      console.log("Deleted user:", deleteResult);
    }
   */
  async delete(if_is = {}) {
    return await this.db_connection(`
      DELETE FROM ${this.table_name}
      ${Object.keys(if_is).length != 0 ? "WHERE " + Table.#parse_condition(if_is) : ""}`);
  }
  /**
   * Performs a join query with a related table.
  * @example
  *const { relatedTable } = require("./related_table");
// Use the object instance of the model
const joinResult = await userTable.getByJoin({
  related_table: relatedTable,
  // Example 1: Standard usage
  get: ["users.name", "relatedTable.columnName"],
  // Example 2: Using dynamic table names
  get: [`${usersTable.table_name}.column`, `${relatedTable.table_name}.columnName`],
  // Example 3: let the db decide ich column come from wich table
  get: ["column1", "column2"],
  join_type: "INNER",
  columns: { on: "relatedTable.userId", ref: "users.id" },
  condition: { "users.email": { value: "john@example.com", operateur: "=" } },
});
  //for the get property go check documentation
   * @template Related_Table_columns
   * @param {object} param0 - Parameters for the join operation.
   * @param {Table<Related_Table_columns>} param0.related_table - The related table to join with.
   * @param {Array<keyof Related_Table_columns | keyof Table_columns>} param0.get - Columns to retrieve from the related table.
   * @param {("INNER"|"LEFT"|"RIGHT"|"OUTER")} param0.join_type - The type of join to perform.
   * @param {{ on: keyof Related_Table_columns, ref: keyof Table_columns }} param0.columns - Join condition.
   * @param {Condition} param0.condition
   * @returns {Promise<[(TableDataType & Related_Table_columns )[]|null,(import("mysql").MysqlError|null)]>}
   */
  async getByJoin({ related_table, get, join_type, columns, condition }) {
    let sql = "SELECT " + get.join(" , ") + " FROM " + related_table.table_name + " " + join_type + " JOIN ON " + `${related_table.table_name}.` + columns.on + "=" + `${this.table_name}.` + columns.ref;
    if (condition) sql += ` WHERE ${Table.#escapeChar(Table.#parse_condition(condition))}`;
    return await this.db_connection(sql);
  }
  /**
 * 
 * @example
 * 
  // Create the table in the database
  userTable.create_table_in_db();
 */
  async create_table_in_db() {
    const [data, error] = await this.db_connection(`CREATE TABLE ${this.table_name} (${Table.#getcolumns_data_type_sting(this.schema)})`);
    if (error) console.log("error :" + error.message, " \n query : " + error.sqlMessage);
    return [data, error];
  }
  async row_sql(sql = "") {
    return await this.db_connection(Table.#escapeChar(sql));
  }
  //helper functions
  /**
   * @param {Record<keyof Table_columns, ColumnDefinition>} schema
   * @returns
   */
  static #getcolumns_data_type_sting(schema = { autoInc: false, primary_key: false }) {
    const columns = [];
    const primary_key = [];
    for (const [key, defenetion] of Object.entries(schema)) {
      columns.push(key + " " + defenetion.type + (defenetion.default !== undefined ? " DEFAULT " + '"' + defenetion.default + '"' : "") + (defenetion.autoInc ? " AUTO_INCREMENT " : ""));
      if (defenetion.primary_key) primary_key.push(key);
    }
    columns.push("CONSTRAINT PK_cons PRIMARY KEY (" + primary_key.join(" , ") + ")");
    return columns.join(" , ");
  }
  /**
   *
   * @param {Condition} condition
   * @returns
   */
  static #parse_condition(condition) {
    const sql = [];
    for (const [key, val] of Object.entries(condition)) {
      if (key === "and" || key === "or") {
        sql.push(`(${val.map(Table.#parse_condition).join(" " + key + " ")})`);
      } else {
        sql.push(`${key} ${val.operateur} " ${Table.#escapeChar(val.value + "")}"`);
      }
    }
    return sql.join(" and ");
  }
  static #escapeChar(string) {
    let str = "";
    const badChars = {
      "'": "\\'",
      '"': '\\"',
      "\\": "\\\\",
      ";": "\\;",
      "--": "\\--",
      "/*": "\\/*",
      "*": "\\*",
      "%": "\\%",
      _: "\\_",
      "(": "\\(",
      ")": "\\)",
      "-": "\\-",
      "=": "\\=",
      ">": "\\>",
      "<": "\\<",
      "|": "\\|",
      "!": "\\!",
      "@": "\\@",
    };

    for (let i = 0; i < string.length; i++) {
      str += badChars[string[i]] || string[i];
    }
    return str;
  }
}
module.exports.Table = Table;
/**
 *@example
 const sql = require("mysql");
 const { wraper } = require("sql_simplify");
  const sql_pool = sql.createPool({
    host: "localhost",
    user: "your_username",
    password: "your_password",
    database: "your_database",
  });

const db_connection = wraper(sql_pool);
//db_connection is a function in this case that execut sql code like this
const [res, err] = await db_connection("select * from users");
//each time you want to execut sql you will use the retuen function from the wraper function
 * @param {import("mysql").Pool} mysql_pool
 * @returns {(sql: string) => Promise<[response<any>, import("mysql").MysqlError | null]>}
 */
module.exports.wraper = (mysql_pool) => {
  return (sql = "") => {
    return new Promise((resolve, reject) => {
      mysql_pool.query(
        sql,
        /**
         * @param {import("mysql").MysqlError} error
         * @param {any[]} elements
         */
        (error, elements) => {
          if (error) resolve([null, error]);
          resolve([elements, null]);
        }
      );
    });
  };
};
