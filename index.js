const { Table } = require("./class");
const { wraper } = require("./mysql_promise");
module.exports.Table = Table;
module.exports.mysql_promise = wraper;
