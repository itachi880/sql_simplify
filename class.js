const mysql = require("mysql");
const { wraper } = require("./mysql_promise");
/**
 * @template T
 */
class Table {
  /**
   * @param {T} schema
   * @param {import("mysql").Pool} db_connection
   */
  constructor(schema, db_connection, table_name) {
    this.schema = schema;
    this.table_name = table_name;
    /**
     * @type {(sql)=>Promise<T[]>}
     */
    this.db_connection = wraper(db_connection);
  }
  /**
   * @param {T} obj
   */
  async create(obj) {
    return await this.db_connection(
      `INSERT INTO ${this.table_name} (${Object.keys(obj).join(",")}) VALUES (${Object.values(obj)
        .map((value) => this.#escapeChar(value))
        .join(",")})`
    );
  }

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
   * @returns
   **/
  async findBy(obj) {
    return await this.db_connection(`SELECT * FROM ${this.table_name} WHERE ${this.#parse_condition(obj)}`);
  }
  /**
   * @param {T} by
   * @param {Condition} obj
   * @returns {T}
   */
  async update(by, obj) {
    return await this.db_connection(`
      UPDATE  ${this.table_name}
      SET ${Object.entries(by)
        .map((columnUpd) => columnUpd[0] + "=" + '"' + this.#escapeChar(columnUpd[1]) + '"')
        .join(",")}
      WHERE ${this.#parse_condition(obj)}`);
  }
  /**
   * @param {fullcondition} by
   * @returns {boolean}
   */
  async delete(by) {
    return await this.db_connection(`
      DELETE FROM ${this.table_name}
      WHERE ${this.#parse_condition(by)}`);
  }
  #parse_condition(condition) {
    const sql = [];
    for (const [key, val] of Object.entries(condition)) {
      if (key === "and" || key === "or") {
        sql.push(`(${val.map(this.#parse_condition).join(" " + key + " ")})`);
      } else {
        sql.push(`${key}${val.operateur}"${this.#escapeChar(val.value + "")}"`);
      }
    }
    return sql.join(" and ") || "";
  }
  #escapeChar(string) {
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
}
