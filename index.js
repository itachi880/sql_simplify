const { Table } = require("./class");
const mysql = require("mysql");
const schema = { name: "", id_2: 0 };
const Pool = mysql.createPool({ host: "localhost", user: "root", password: "", database: "test", port: 3306 });
const Test_module = new Table({ table_id_column_name: "id", schema: schema, table_name: "test", db_connection: Pool });
const schema2 = { name: "", id: 0, ref: 0 };
const Test_module2 = new Table({ table_id_column_name: "id", schema: schema2, table_name: "test2", db_connection: Pool });
Test_module.getByJoin({ related_table: Test_module2, get: [""], columns: { ref: "", on: "" } });
