import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import fs from 'fs'

let db: any = null

async function openDb() {
  if (!db) {
    const dbPath = process.env.NODE_ENV === 'production'
      ? path.resolve('/home', 'data', 'burnrate.db')
      : path.resolve(process.cwd(), 'data', 'burnrate.db');
    const dbDir = path.dirname(dbPath);

    // ensure the data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    await db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        amount REAL,
        date TEXT,
        note TEXT,
        category TEXT
      );

      CREATE TABLE IF NOT EXISTS spending (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL,
        date TEXT,
        is_advanced BOOLEAN
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spending_id INTEGER,
        payment_type TEXT,
        amount REAL,
        date TEXT,
        invoice_receipt TEXT,
        FOREIGN KEY (spending_id) REFERENCES spending (id)
      );

      CREATE TABLE IF NOT EXISTS revenue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL,
        date TEXT
      );

      CREATE TABLE IF NOT EXISTS asset_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        color TEXT
      );
    `)
  }
  return db
}

export async function getAssets() {
  const db = await openDb()
  return db.all('SELECT * FROM assets ORDER BY date DESC')
}

export async function addAsset(name: string, amount: number, date: string, note: string, category: string) {
  const db = await openDb()
  await db.run('INSERT OR IGNORE INTO asset_categories (name) VALUES (?)', [category])
  return db.run('INSERT INTO assets (name, amount, date, note, category) VALUES (?, ?, ?, ?, ?)', [name, amount, date, note, category])
}

export async function updateAsset(id: number, name: string, amount: number, date: string, note: string, category: string) {
  const db = await openDb()
  await db.run('INSERT OR IGNORE INTO asset_categories (name) VALUES (?)', [category])
  return db.run('UPDATE assets SET name = ?, amount = ?, date = ?, note = ?, category = ? WHERE id = ?', [name, amount, date, note, category, id])
}

export async function deleteAsset(id: number) {
  const db = await openDb()
  return db.run('DELETE FROM assets WHERE id = ?', [id])
}

export async function getAssetCategories() {
  const db = await openDb()
  return db.all('SELECT * FROM asset_categories ORDER BY name')
}

export async function addAssetCategory(name: string, color: string) {
  const db = await openDb()
  return db.run('INSERT OR REPLACE INTO asset_categories (name, color) VALUES (?, ?)', [name, color])
}

export async function getSpending() {
  const db = await openDb()
  return db.all('SELECT * FROM spending ORDER BY date DESC')
}

export async function addSpending(amount: number, date: string, isAdvanced: boolean) {
  const db = await openDb()
  return db.run('INSERT INTO spending (amount, date, is_advanced) VALUES (?, ?, ?)', [amount, date, isAdvanced])
}

export async function updateSpending(id: number, amount: number, date: string, isAdvanced: boolean) {
  const db = await openDb()
  return db.run('UPDATE spending SET amount = ?, date = ?, is_advanced = ? WHERE id = ?', [amount, date, isAdvanced, id])
}

export async function deleteSpending(id: number) {
  const db = await openDb()
  await db.run('DELETE FROM transactions WHERE spending_id = ?', [id])
  return db.run('DELETE FROM spending WHERE id = ?', [id])
}

export async function getTransactions(spendingId: number) {
  const db = await openDb()
  return db.all('SELECT * FROM transactions WHERE spending_id = ? ORDER BY date', [spendingId])
}

export async function addTransaction(spendingId: number, paymentType: string, amount: number, date: string, invoiceReceipt: string) {
  const db = await openDb()
  return db.run('INSERT INTO transactions (spending_id, payment_type, amount, date, invoice_receipt) VALUES (?, ?, ?, ?, ?)', 
    [spendingId, paymentType, amount, date, invoiceReceipt])
}

export async function deleteTransactions(spendingId: number) {
  const db = await openDb()
  return db.run('DELETE FROM transactions WHERE spending_id = ?', [spendingId])
}

export async function getRevenue() {
  const db = await openDb()
  return db.all('SELECT * FROM revenue ORDER BY date DESC')
}

export async function addRevenue(amount: number, date: string) {
  const db = await openDb()
  return db.run('INSERT INTO revenue (amount, date) VALUES (?, ?)', [amount, date])
}

export async function updateRevenue(id: number, amount: number, date: string) {
  const db = await openDb()
  return db.run('UPDATE revenue SET amount = ?, date = ? WHERE id = ?', [amount, date, id])
}

export async function deleteRevenue(id: number) {
  const db = await openDb()
  return db.run('DELETE FROM revenue WHERE id = ?', [id])
}

export async function getFinancialData() {
  const db = await openDb()
  const assets = await db.all('SELECT * FROM assets ORDER BY date')
  const spending = await db.all('SELECT * FROM spending ORDER BY date')
  const revenue = await db.all('SELECT * FROM revenue ORDER BY date')
  const categories = await db.all('SELECT * FROM asset_categories')

  let currentAssets = 0
  let totalSpending = 0
  let spendingCount = 0
  const financialData = []
  const allDates = new Set([...assets, ...spending, ...revenue].map(item => item.date.slice(0, 7)))

  for (const monthYear of Array.from(allDates).sort()) {
    const monthAssets = assets.filter((a: { date: string }) => a.date.startsWith(monthYear))
    const monthSpending = spending.find((s: { date: string }) => s.date.startsWith(monthYear))
    const monthRevenue = revenue.find((r: { date: string }) => r.date.startsWith(monthYear))

    const newAssets = monthAssets.map((asset: { amount: any; category: any }) => ({
      amount: asset.amount,
      category: asset.category,
      color: categories.find((c: { name: any }) => c.name === asset.category)?.color || '#000000'
    }))

    currentAssets += monthAssets.reduce((sum: any, asset: { amount: any }) => sum + asset.amount, 0)
    if (monthSpending) {
      currentAssets -= monthSpending.amount
      totalSpending += monthSpending.amount
      spendingCount++
    }
    if (monthRevenue) currentAssets += monthRevenue.amount

    financialData.push({
      date: monthYear,
      assets: currentAssets,
      spending: monthSpending ? monthSpending.amount : 0,
      revenue: monthRevenue ? monthRevenue.amount : 0,
      newAssets: newAssets.length > 0 ? newAssets : undefined
    })
  }

  const avgMonthlySpend = spendingCount > 0 ? totalSpending / spendingCount : 0
  const remainingAssets = currentAssets
  const runway = avgMonthlySpend > 0 ? remainingAssets / avgMonthlySpend : Infinity

  return { financialData, avgMonthlySpend, remainingAssets, runway }
}

export async function getFinancialDataForForecast() {
  const { financialData, avgMonthlySpend, remainingAssets, runway } = await getFinancialData()
  return { financialData, avgMonthlySpend, remainingAssets, runway }
}

