const { Table } = require("./class");
const mysql = require("mysql");
const schema = { name: "", id: 0 };
const Pool = mysql.createPool({ host: "localhost", user: "root", password: "", database: "test", port: 3306 });
const Test_module = new Table({ table_id_column_name: "id", schema: { id: { autoInc: true, primary_key: true, type: Table.types.integer }, name: { default: "uknown", type: Table.types.string } }, table_name: "test", db_connection: Pool });
Test_module.delete({ id: { operateur: "=", value: 1 } }).then((res) => {
  console.log(res);
});
