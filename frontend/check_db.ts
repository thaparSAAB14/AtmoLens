import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error("No POSTGRES_URL found");
    process.exit(1);
  }
  
  const sql = neon(url);
  
  const runs = await sql`SELECT * FROM ingest_runs ORDER BY id DESC LIMIT 1`;
  if (runs.length === 0) {
    console.log("No runs found");
    return;
  }
  
  const latestRun = runs[0];
  console.log("Latest Run:", latestRun);
  
  const items = await sql`SELECT * FROM ingest_items WHERE run_id = ${latestRun.id}`;
  console.log("Items:");
  for (const item of items) {
    console.log(`- ${item.map_type}: ${item.status} | error: ${item.error_message} | http: ${item.source_http_status} | attempts: ${item.attempts}`);
  }
}

main().catch(console.error);
