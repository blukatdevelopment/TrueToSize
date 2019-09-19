const expect  = require('chai').expect;
const request = require('request');
const describe = require('mocha').describe;
const before = require('mocha').before;
const it = require('mocha').it;
const assert = require('assert');
const Client = require('pg').Client;
const install = require('../bin/install');
const uninstall = require('../bin/uninstall');
var rp = require('request-promise');
const SITE_URL = `http://${process.env.APPHOST}:${process.env.APPPORT}`;

const DATABASE_TABLES = ['score_submissions', 'aggregate_scores'];


process.env.PGDATABASE = "TEST_" + process.env.PGDATABASE;



async function table_exists(schema, table) {
  const client = new Client();

  try {
    await client.connect();
  }
  catch (e) {
    console.error("Could not connect: " + e);
  }

  const sql = "SELECT EXISTS (" +
            " SELECT 1" +
            " FROM   information_schema.tables " +
            " WHERE  table_schema = $1" +
            " AND    table_name = $2" +
            ");";
  const { rows } = await client.query(sql, [schema, table]);

  return rows[0].exists;
}


describe('install and uninstall', function() {

  before(async function() {
    await install.install();
  });

  it('should start the postgres server', async function() {
    const client = new Client({
      database: 'postgres'
    });

    try {
      await client.connect();
    }
    catch (e) {
      assert.fail("Could not connect: " + e);
    }
    
    const { rows } = await client.query("SELECT 'Hello, world!' as message");
    expect(rows[0].message).to.match(/Hello/);
    await client.end();
  });

  it('should create the database tables', async function() {
    for (var i = 0; i < DATABASE_TABLES.length; i++) {
      const exists = await table_exists('truetosize', DATABASE_TABLES[i]);
      expect(exists, "table '" + DATABASE_TABLES[i] + "' exists").to.equal(true);  
    }

  });

  it('should uninstall database tables', async function() {
    await uninstall.uninstall();
    for (var i = 0; i < DATABASE_TABLES.length; i++) {
      const exists = await table_exists('truetosize', DATABASE_TABLES[i]);
      expect(exists, "table '" + DATABASE_TABLES[i] + "' has been removed").to.equal(false);  
    }
  });
});


describe('rest endpoints', function() {
  before(async function() {
    await install.install(); 
  });
  after(async function() {
    await uninstall.uninstall();
  });

  it('should store submitted entries', async function() {
    const client = new Client();

    var response;
    try {
      response = await rp({
        method: 'POST',
        uri: SITE_URL + "/submit_score",
        body: {
            submitter: "test submitter",
            shoe_type: "test shoe",
            score: 5
        },
        json: true
      });
    }
    catch (e) {
      assert.fail("Error submitting score: " + e);
    }
    

  });

});