import BetterSqlite3 = require("better-sqlite3");
declare namespace BetterSqlite3Helper {
  type MigrationOptions = {
    /** Whether to set to 'last' to automatically reapply the last migration-file. Default: false */
    force?: "last" | false;
    /** The name of the database table that is used to keep track. Default: 'migration' */
    table?: string;
    /** The path of the migration files. Default: './migrations' */
    migrationsPath?: string;
    /** Or an array of migration strings */
    migrations?: string[];
  };

  type DBOptions = {
    /** Path to sqlite database file. Default: './data/sqlite3.db' */
    path?: string;
    /** Whether to create a db only in memory. Default: false */
    memory?: boolean;
    /** Whether to open database readonly. Default: false */
    readonly?: boolean;
    /** Whether to throw error if database not exists. Default: false */
    fileMustExist?: boolean;
    /** Whether to automatically enable 'PRAGMA journal_mode = WAL'. Default: true */
    WAL?: boolean;
    /** Migration options. Disable completely by setting `migrate: false` */
    migrate?: MigrationOptions | false;
  };

  type DataObject = { [key: string]: any };

  /**
   * Specifies a where clause.
   *
   *   - Either a string containing the value to use as ID that will be translated to ['id = ?', id]
   *   - Or an array with a string and the replacements for ? after that. F.e. ['id > ? && name = ?', id, name].
   *   - Or an object with key values. F.e. {id: params.id}. Or simply an ID that will be translated to ['id = ?', id]
   */
  type WhereClause = string | any[] | DataObject;

  type VariableArgFunction = (...params: any[]) => any;
  type ArgumentTypes<F extends VariableArgFunction> = F extends (
    ...args: infer A
  ) => any
    ? A
    : never;

  interface Transaction<F extends VariableArgFunction> {
    (...params: ArgumentTypes<F>): any;
    default(...params: ArgumentTypes<F>): any;
    deferred(...params: ArgumentTypes<F>): any;
    immediate(...params: ArgumentTypes<F>): any;
    exclusive(...params: ArgumentTypes<F>): any;
  }

  interface DBInstance {
    memory: boolean;
    readonly: boolean;
    name: string;
    open: boolean;
    inTransaction: boolean;

    connection(): BetterSqlite3.Database;

    prepare(sql: string): BetterSqlite3.Statement;

    transaction<F extends VariableArgFunction>(fn: F): Transaction<F>;

    exec(sqls: string): this;
    pragma(string: string, options?: BetterSqlite3.PragmaOptions): any;
    checkpoint(databaseName?: string): this;
    function(name: string, cb: (...params: any[]) => any): this;
    function(
      name: string,
      options: BetterSqlite3.RegistrationOptions,
      cb: (...params: any[]) => any
    ): this;
    aggregate(name: string, options: BetterSqlite3.AggregateOptions): this;
    loadExtension(path: string): this;
    close(): this;
    defaultSafeIntegers(toggleState?: boolean): this;

    /**
     * Executes the prepared statement. When execution completes it returns an info object describing any changes made. The info object has two properties:
     *
     * info.changes: The total number of rows that were inserted, updated, or deleted by this operation. Changes made by foreign key actions or trigger programs do not count.
     * info.lastInsertRowid: The rowid of the last row inserted into the database (ignoring those caused by trigger programs). If the current statement did not insert any rows into the database, this number should be completely ignored.
     *
     * If execution of the statement fails, an Error is thrown.
     * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#runbindparameters---object
     *
     * @param {Object} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {*} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/wiki/API#binding-parameters
     * @returns {Object}
     */
    run(query: string, ...bindParameters: any[]): BetterSqlite3.RunResult;

    /**
     * Returns all values of a query
     * @see https://github.com/JoshuaWise/better-sqlite3/wiki/API#allbindparameters---array-of-rows
     *
     * @param {Object} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {any} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/wiki/API#binding-parameters
     * @returns {array}
     */
    query<RowData = DataObject>(
      query: string,
      ...bindParameters: any[]
    ): RowData[];

    /**
     * Similar to .query(), but instead of returning every row together, an iterator is returned so you can retrieve the rows one by one.
     * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#iteratebindparameters---iterator
     *
     * @param {Object} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {*} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/wiki/API#binding-parameters
     * @returns {Iterator}
     */
    queryIterate<RowData = DataObject>(
      query: string,
      ...bindParameters: any[]
    ): Iterable<RowData>;

    /**
     * Returns the values of the first row of the query-result
     * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#getbindparameters---row
     *
     * @param {Object} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {*} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#binding-parameters
     * @returns {Object|undefined}
     */
    queryFirstRow<RowData = DataObject>(
      query: string,
      ...bindParameters: any[]
    ): RowData | undefined;

    /**
     * Returns the values of the first row of the query-result
     * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#getbindparameters---row
     * It returns always an object and thus can be used with destructuring assignment
     *
     * @example const {id, name} = DB().queryFirstRowObject(sql)
     * @param {Object} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {*} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#binding-parameters
     * @returns {Object}
     */
    queryFirstRowObject<RowData = DataObject>(
      query: string,
      ...bindParameters: any[]
    ): RowData | Object;

    /**
     * Returns the value of the first column in the first row of the query-result
     *
     * @param {Object} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {*} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#binding-parameters
     * @returns {*}
     */
    queryFirstCell<CellType = any>(
      query: string,
      ...bindParameters: any[]
    ): CellType | undefined;

    /**
     * Returns an Array that only contains the values of the specified column
     *
     * @param {String} column Name of the column
     * @param {String} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {*} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#binding-parameters
     * @returns {Array}
     */
    queryColumn<ColumnType = any>(
      column: string,
      query: string,
      ...bindParameters: any[]
    ): ColumnType[];

    /**
     * Returns a Object that get it key-value-combination from the result of the query
     *
     * @param {String} key Name of the column that values should be the key
     * @param {String} column Name of the column that values should be the value for the object
     * @param {String} query the SQL-Query that should be run. Can contain placeholders for bind parameters.
     * @param {*} bindParameters You can specify bind parameters @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#binding-parameters
     * @returns {object}
     */
    queryKeyAndColumn<ValueColumnType = any>(
      key: string,
      column: string,
      query: string,
      ...bindParameters: any[]
    ): { [key: string]: ValueColumnType };

    /**
     * Create an update statement; create more complex one with exec yourself.
     *
     * @param {String} table required. Name of the table
     * @param {Object} data A Object of data to set. Key is the name of the column. Value 'undefined' is filtered
     * @param {String|Array|Object} where required. array with a string and the replacements for ? after that. F.e. ['id > ? && name = ?', id, name]. Or an object with key values. F.e. {id: params.id}.
     * @param {undefined|Array} whiteList optional List of columns that can only be updated with "data"
     * @returns {Integer} Number of changed rows
     */
    update<RowData = DataObject>(
      table: string,
      data: Partial<RowData>,
      where: WhereClause,
      whiteList?: string[]
    ): number;

    /**
     * Create an update statement; create more complex one with exec yourself.
     *
     * @param {String} table Name of the table
     * @param {Object} data a Object of data to set. Key is the name of the column. Value 'undefined' is filtered
     * @param {String|Array|Object} where required. array with a string and the replacements for ? after that. F.e. ['id > ? && name = ?', id, name]. Or an object with key values. F.e. {id: params.id}.
     * @param {undefined|Array} whiteBlackList optional List of columns that can not be updated with "data" (blacklist)
     * @returns {Integer} Number of changed rows
     */
    updateWithBlackList<RowData = DataObject>(
      table: string,
      data: Partial<RowData>,
      where: WhereClause,
      blackList?: string[]
    ): number;

    /**
     * Create an insert statement; create more complex one with exec yourself.
     *
     * @param {String} table Name of the table
     * @param {Object|Array} data a Object of data to set. Key is the name of the column. Can be an array of objects.
     * @param {undefined|Array} whiteList optional List of columns that only can be updated with "data"
     * @returns {Integer} Last inserted row id
     */
    insert<RowData = DataObject>(
      table: string,
      data: Partial<RowData> | Partial<RowData>[],
      whiteList?: string[]
    ): number;

    /**
     * Create an insert statement; create more complex one with exec yourself.
     *
     * @param {String} table Name of the table
     * @param {Object|Array} data a Object of data to set. Key is the name of the column. Can be an array of objects.
     * @param {undefined|Array} whiteBlackList optional List of columns that can not be updated with "data" (blacklist)
     * @returns {Integer} Last inserted row id
     */
    insertWithBlackList<RowData = DataObject>(
      table: string,
      data: Partial<RowData> | Partial<RowData>[],
      blackList?: string[]
    ): number;

    /**
     * Create an replace statement; create more complex one with exec yourself.
     *
     * @param {String} table Name of the table
     * @param {Object|Array} data a Object of data to set. Key is the name of the column. Can be an array of objects.
     * @param {undefined|Array} whiteList optional List of columns that only can be updated with "data"
     * @returns {Integer} Last inserted row id
     */
    replace<RowData = DataObject>(
      table: string,
      data: Partial<RowData> | Partial<RowData>[],
      whiteList?: string[]
    ): number;

    /**
     * Create an replace statement; create more complex one with exec yourself.
     *
     * @param {String} table Name of the table
     * @param {Object|Array} data a Object of data to set. Key is the name of the column. Can be an array of objects.
     * @param {undefined|Array} whiteBlackList optional List of columns that can not be updated with "data" (blacklist)
     * @returns {Integer} Last inserted row id
     */
    replaceWithBlackList<RowData = DataObject>(
      table: string,
      data: Partial<RowData> | Partial<RowData>[],
      blackList?: string[]
    ): number;

    /**
     * Create a delete statement; create more complex one with exec yourself.
     *
     * @param {String} table required. Name of the table
     * @param {String|Array|Object} where required. array with a string and the replacements for ? after that. F.e. ['id > ? && name = ?', id, name]. Or an object with key values. F.e. {id: params.id}.
     * @returns {Integer} Number of changed rows
     */
     delete(
       table: string,
       where: WhereClause,
     ): number;

    /**
     * Migrates database schema to the latest version
     */
    migrate(options?: MigrationOptions): this;
  }
}

export default function DB(
  options?: BetterSqlite3Helper.DBOptions
): BetterSqlite3Helper.DBInstance;
