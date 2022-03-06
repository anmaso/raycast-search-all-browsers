import _ from "lodash";
import { homedir } from "os";
import initSqlJs, { Database } from "sql.js";

import { environment, getPreferenceValues } from "@raycast/api";

import { Device, LocalTab, RemoteTab } from "../types";
import { executeJxa, getCurrentDeviceName } from "../utils";
import { join } from "path";
import { readFile } from "fs/promises";

const DATABASE_PATH = `${homedir()}/Library/Safari/CloudTabs.db`;


const  safariAppIdentifier = "Safari";

let loadedDb: Database;
const loadDb = async (): Promise<Database> => {
  if (loadedDb) {
    return loadedDb;
  }

  const fileBuffer = await readFile(DATABASE_PATH);
  const SQL = await initSqlJs({
    locateFile: () => join(environment.assetsPath, "sql-wasm.wasm"),
  });

  const db = new SQL.Database(fileBuffer);
  loadedDb = db;

  return db;
};

const executeQuery = async (db: Database, query: string): Promise<unknown> => {
  const results = [];
  const stmt = db.prepare(query);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }

  stmt.free();
  return results;
};

const fetchLocalTabs = (): Promise<LocalTab[]> =>
  executeJxa(`
    const safari = Application("${safariAppIdentifier}");
    const tabs = [];
    safari.windows().map(window => {
      return window.tabs().map(tab => {
        tabs.push({
          uuid: window.id() + '-' + tab.index(),
          title: tab.name(),
          url: tab.url() || '',
          window_id: window.id(),
          index: tab.index(),
          is_local: true
        });
      })
    });

    return tabs;
`);

const fetchRemoteTabs = async (): Promise<RemoteTab[]> => {
  const currentDeviceName = getCurrentDeviceName();

  try {
    const db = await loadDb();
    const tabs = (await executeQuery(
      db,
      `SELECT t.tab_uuid as uuid, d.device_uuid, d.device_name, t.title, t.url
         FROM cloud_tabs t
         INNER JOIN cloud_tab_devices d ON t.device_uuid = d.device_uuid
         WHERE device_name != "${currentDeviceName}"`
    )) as RemoteTab[];

    return tabs;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const useDevices = async () => {
    const currentDeviceName = getCurrentDeviceName();
    const localTabs = await fetchLocalTabs();

      const localDevice = {
        uuid: "local",
        name: `${currentDeviceName} ★`,
        tabs: localTabs,
      };


  return {localTabs};
};

export default useDevices;
