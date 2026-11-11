// The diagnostic calculators' data, as every part of the app reads it.
//
// It comes from calculator-data.json in the code (written by the Diagnostic App
// project's build/build.py, or `node calculator-build.js`), unless an administrator has
// uploaded the spreadsheets in the app (Upload tab): then the uploaded version, kept on
// the data disk (DATA_DIR/calculator/current.json), is used until they go back to the
// code's file. Every upload is kept (DATA_DIR/calculator/history/). Parts of the app that
// keep their own copy (the calculator tabs, chapter links, site search) register with
// onChange and are told when it changes, so no restart is needed.
const fs = require('fs');
const path = require('path');

const CODE_FILE = path.join(__dirname, 'calculator-data.json');
const DIR = path.join(process.env.DATA_DIR || path.join(__dirname, 'data'), 'calculator');
const CURRENT = path.join(DIR, 'current.json');
const HISTORY = path.join(DIR, 'history');

let data = null;
let meta = null; // { source: 'code' | 'upload', at, by, files } for the data in use
const listeners = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function load() {
  if (fs.existsSync(CURRENT)) {
    try {
      const saved = readJson(CURRENT);
      data = saved.data;
      meta = { source: 'upload', ...saved.meta };
      return;
    } catch (err) {
      console.warn(`Uploaded calculator data not read (${err.message}); using the code's file.`);
    }
  }
  try {
    data = readJson(CODE_FILE);
  } catch (err) {
    console.warn(`Calculator data not loaded (${err.message}); the calculator tabs will be empty.`);
    data = { panels: [], differentials: [] };
  }
  meta = { source: 'code' };
}

function get() {
  if (!data) load();
  return data;
}

function info() {
  get();
  return meta;
}

function onChange(fn) {
  listeners.push(fn);
}

function notify() {
  for (const fn of listeners) {
    try { fn(data); } catch (err) { console.error('Calculator data listener failed', err); }
  }
}

// Saves new data (from uploaded spreadsheets) and uses it from now on.
function publish(newData, newMeta) {
  fs.mkdirSync(HISTORY, { recursive: true });
  const at = new Date().toISOString();
  const saved = { meta: { ...newMeta, at }, data: newData };
  const json = JSON.stringify(saved);
  fs.writeFileSync(path.join(HISTORY, `${at.replace(/[:.]/g, '-')}.json`), json);
  const tmp = `${CURRENT}.tmp`;
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, CURRENT);
  data = newData;
  meta = { source: 'upload', ...saved.meta };
  notify();
}

// Earlier uploads, newest first: [{ name, at, by, files }].
function history() {
  if (!fs.existsSync(HISTORY)) return [];
  return fs.readdirSync(HISTORY).filter(f => f.endsWith('.json')).sort().reverse().map(name => {
    try { const m = readJson(path.join(HISTORY, name)).meta || {}; return { name, at: m.at, by: m.by, files: m.files || [] }; } catch { return { name }; }
  });
}

// Uses an earlier upload again (name from history()), or the code's file ('code').
function restore(name) {
  if (name === 'code') {
    if (fs.existsSync(CURRENT)) fs.renameSync(CURRENT, `${CURRENT}.replaced-${Date.now()}`);
    data = null;
    load();
    notify();
    return;
  }
  if (!/^[\w-]+\.json$/.test(name) || !fs.existsSync(path.join(HISTORY, name))) throw new Error('No such upload.');
  const saved = readJson(path.join(HISTORY, name));
  const tmp = `${CURRENT}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(saved));
  fs.renameSync(tmp, CURRENT);
  data = saved.data;
  meta = { source: 'upload', ...saved.meta };
  notify();
}

module.exports = { get, info, onChange, publish, history, restore, CODE_FILE };
