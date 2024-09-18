const { wraper } = require("./mysql_promise");
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
 * @template Table_columns
 */
module.exports.Table = class Table {
  /**
   * @param {object} param0
   * @param {Table_columns} param0.schema
   * @param {import("mysql").Pool} param0.db_connection
   * @param {string} param0.table_name
   * @param {string} param0.table_id_column_name
   */
  constructor({ schema = {}, db_connection = false, table_name = "", table_id_column_name = "" }) {
    this.schema = schema;
    this.table_name = table_name;

    if (table_id_column_name) this.table_id_name = table_id_column_name;
    /**
     * @type {(sql:string)=>Promise<[response<any>,import("mysql").MysqlError|null]>}
     */
    this.db_connection = wraper(db_connection);
    //check for table if exist if not create it
  }
  /**
   * @param {Table_columns} obj
   * @returns {Promise<[Table_columns,(import("mysql").MysqlError|null)]>}
   */
  async create(obj) {
    /**
     * @type {[(Insert|null),(import("mysql").MysqlError|null)]}
     */
    const [data, error] = await this.db_connection(
      `INSERT INTO ${this.table_name} (${Object.keys(obj).join(",")}) VALUES (${Object.values(obj)
        .map((value) => Table.#escapeChar(value))
        .join(",")})`
    );
    if (error) {
      console.log(" error message : " + error.message, "\nsql query : " + error.sqlMessage);
      return [null, error];
    }
    if (this.table_id_name) obj[this.table_id_name] = data.insertId;
    return [obj, null];
  }
  /**
   *
   * @returns {Promise<[Table_columns[]|null,(import("mysql").MysqlError|null)]>}
   */
  async findAll() {
    return await this.db_connection(`SELECT * FROM ${this.table_name}`);
  }

  /**
   * @typedef {object} Schema
   * @property {string} value - Description of the column property.
   * @property {string} operateur - Description of the column property.
   * @typedef {Record<keyof T, Schema>} All
   * @typedef {Object} Condition
   * @property {(Condition|fullcondition)[]} and - Logical `AND` conditions
   * @property {(Condition|fullcondition)[]} or - Logical `OR` conditions
   * @typedef {(All & Condition)} fullcondition
   * @param {Condition} obj
   * @returns {Promise<[Table_columns[]|null,(import("mysql").MysqlError|null)]>}
   **/
  async findBy(obj) {
    return await this.db_connection(`SELECT * FROM ${this.table_name} WHERE ${Table.#parse_condition(obj)}`);
  }
  /**
   * @param {Table_columns} old
   * @param {Condition} by
   * @returns {Table_columns}
   */
  async update(old = {}, by = {}) {
    return await this.db_connection(`
      UPDATE  ${this.table_name}
      SET ${Object.entries(old)
        .map((columnUpd) => columnUpd[0] + "=" + '"' + Table.#escapeChar(value) + '"')
        .join(",")}
      ${Object.keys(by).length != 0 ? "WHERE " + Table.#parse_condition(by) : ""}`);
  }
  /**
   * @param {fullcondition} if_is can be {} if the deletion has to affect every column be carfull what you put here
   * @returns {Promise<[data<Delete>,(import("mysql").MysqlError|null)]>}
   */
  async delete(if_is = {}) {
    return await this.db_connection(`
      DELETE FROM ${this.table_name}
      ${Object.keys(obj).length != 0 ? "WHERE " + Table.#parse_condition(if_is) : ""}`);
  }
  /**
   * Performs a join query with a related table.
   *
   * @template Related_Table_columns
   * @param {object} param0 - Parameters for the join operation.
   * @param {Table<Related_Table_columns>} param0.related_table - The related table to join with.
   * @param {Array<keyof Related_Table_columns | keyof Table_columns>} param0.get - Columns to retrieve from the related table.
   * @param {("INNER"|"LEFT"|"RIGHT"|"OUTER")} param0.join_type - The type of join to perform.
   * @param {{ on: keyof Related_Table_columns, ref: keyof Table_columns }} param0.columns - Join condition.
   * @param {Condition} param0.condition
   * @returns {Promise<[Table_columns[]|null,(import("mysql").MysqlError|null)]>}
   */
  async getByJoin({ related_table, get, join_type, columns, condition }) {
    let sql = "SELECT " + get.join(" , ") + " FROM " + related_table.table_name + " " + join_type + " JOIN ON" + columns.on + "=" + columns.ref;
    if (condition) sql += ` WHERE ${Table.#escapeChar(Table.#parse_condition(condition))}`;
    return await this.db_connection(sql);
  }

  async create_table_in_db() {
    const [data, error] = await this.db_connection(`CREATE TABLE ${this.table_name} (${Table.#getcolumns_data_type_sting(this.schema)})`);
    if (error) console.log("error :" + error.message, " \nquery : " + error.sqlMessage);
    return [data, error];
  }
  //helper functions
  /**
   * @param {Table_columns} schema
   * @returns
   */
  static #getcolumns_data_type_sting(schema) {
    let columns = [];
    const types = {
      string: "VARCHAR(255)",
      number: "INT",
      boolean: "BOOL",
      object: "LONGTEXT",
    };
    for (const [key, type] of Object.entries(schema)) {
      columns.push(key + " " + types[typeof type]);
    }
    return columns.join(" , ");
  }
  static #parse_condition(condition) {
    const sql = [];
    for (const [key, val] of Object.entries(condition)) {
      if (key === "and" || key === "or") {
        sql.push(`(${val.map(Table.#parse_condition).join(" " + key + " ")})`);
      } else {
        sql.push(`${key}${val.operateur}"${Table.#escapeChar(val.value + "")}"`);
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
    console.log(string);
    for (let i = 0; i < string.length; i++) {
      str += badChars[string[i]] || string[i];
    }
    return str;
  }
};
