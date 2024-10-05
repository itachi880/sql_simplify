const { Table } = require("./class");
const { wraper } = require("./mysql_promise");
module.exports.Table = Table;
module.exports.mysql_promise = wraper;
function parse_condition(condition) {
  const sql = [];
  for (const [key, val] of Object.entries(condition)) {
    if (key === "and" || key === "or") {
      sql.push(`(${val.map(parse_condition).join(" " + key + " ")})`);
    } else {
      sql.push(`${key} ${val.operateur} " ${val.value + ""}"`);
    }
  }
  return sql.join(" and ");
}
console.log(
  parse_condition({
    and: [
      { fieald1: { value: 10, operateur: "=" } },

      {
        or: [
          {
            feald2: { value: "itachi", operateur: "=" },
          },
          { feald3: { value: "2022-01-10", operateur: "<" } },
        ],
      },
    ],
  })
);
