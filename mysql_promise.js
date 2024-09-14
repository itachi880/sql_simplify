/**
 *
 * @param {import("mysql").Pool} mysql_pool
 * @returns {(sql: string) => Promise<[any[], import("mysql").MysqlError | null]>}
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
