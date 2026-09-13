import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { createAuthToken } from '../src/lib/jwt.js';
import { parseIssueQuery } from '../src/lib/issue-query.js';

test('query parser rejects ambiguous and unbounded input', () => {
  for (const input of [{page:['1','2']}, {status:{}}, {search:[]}, {limit:'101'}, {page:'0'}, {page:'2147483647'}, {projectId:'1e2'}, {order:'DROP TABLE'}, {unknown:'x'}]) {
    assert.throws(() => parseIssueQuery(input));
  }
  assert.equal(parseIssueQuery({search:'  hello  ',assigneeId:'unassigned'}).search,'hello');
});

test('pagination migration backfills last activity and preserves legacy data', async () => {
  const pool = new Pool({connectionString:process.env.DATABASE_URL});
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query('CREATE SCHEMA devtrack_m8_migration_test');
    await db.query('SET LOCAL search_path TO devtrack_m8_migration_test, public');
    for (const name of ['20260827101804_init','20260829203542_add_user_model','20260910075304_add_issue_assignee','20260911090000_add_workspaces','20260911160000_add_projects','20260912080000_comments_and_activity']) {
      const sql = await readFile(`prisma/migrations/${name}/migration.sql`,'utf8');
      await db.query(sql.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''));
    }
    await db.query(`INSERT INTO "Workspace" (name,"updatedAt") VALUES ('Legacy',NOW());
      INSERT INTO "Project" (name,"workspaceId","updatedAt") VALUES ('Legacy',1,NOW());
      INSERT INTO "Issue" (title,"workspaceId","projectId","createdAt") VALUES ('Unchanged',1,1,'2020-01-01'),('Changed',1,1,'2020-01-01');
      INSERT INTO "Activity" ("issueId",type,"newValue","createdAt") VALUES (2,'TITLE_CHANGED','Changed','2021-01-01');`);
    const before = (await db.query('SELECT * FROM "Issue" ORDER BY id')).rows;
    await db.query(await readFile('prisma/migrations/20260913020000_issue_search_pagination/migration.sql','utf8'));
    const after = (await db.query('SELECT * FROM "Issue" ORDER BY id')).rows;
    assert.deepEqual(after.map(({updatedAt,...rest})=>rest), before);
    assert.deepEqual(after[0].updatedAt, before[0].createdAt);
    assert.deepEqual(after[1].updatedAt, (await db.query('SELECT "createdAt" FROM "Activity" WHERE "issueId" = 2')).rows[0].createdAt);
  } finally { await db.query('ROLLBACK'); db.release(); await pool.end(); }
});

test('issue search API: combined filters, stable pages, updated ordering and isolation', async () => {
  const server = app.listen(0,'127.0.0.1');
  await new Promise<void>(resolve => server.once('listening',resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/issues`;
  const users: number[] = [], workspaces: number[] = [];
  async function request(query: string, expected = 200, user = users[0], suffix = '', method = 'GET', body?: unknown) {
    const response = await fetch(`${base}${suffix}?${query}`, {method,headers:{'Content-Type':'application/json',...(user ? {Cookie:`devtrack_token=${createAuthToken(user)}`} : {})},...(body ? {body:JSON.stringify(body)} : {})});
    const result = await response.json();
    assert.equal(response.status,expected,JSON.stringify(result));
    assert.doesNotMatch(JSON.stringify(result),/passwordHash|unused-secret|stack/);
    return result;
  }
  try {
    for (const name of ['Owner','Member','Outsider']) users.push((await prisma.user.create({data:{name,email:`m8-${crypto.randomUUID()}@example.test`,passwordHash:'unused-secret'}})).id);
    const [owner,member,outsider] = users as [number,number,number];
    for(const name of ['Search workspace','Foreign workspace']) workspaces.push((await prisma.workspace.create({data:{name,memberships:{create:[{userId:owner,role:'OWNER'},{userId:member}]}}})).id);
    const [workspaceId,foreignId] = workspaces as [number,number];
    const a = await prisma.project.create({data:{name:'A',workspaceId}});
    const b = await prisma.project.create({data:{name:'B',workspaceId}});
    const foreign = await prisma.project.create({data:{name:'Foreign',workspaceId:foreignId}});
    const ids: number[] = [];
    for(let i=0;i<25;i++) ids.push((await prisma.issue.create({data:{title:`Search task ${i}`,workspaceId,projectId:i<20?a.id:b.id,status:i%2?'TODO':'IN_PROGRESS',priority:i%2?'LOW':'HIGH',assigneeId:i%2?member:owner,createdAt:new Date('2020-01-01'),updatedAt:new Date(2020,0,1+i)}})).id);
    await prisma.issue.create({data:{title:'100%_literal\\path',workspaceId,projectId:a.id}});
    await prisma.issue.create({data:{title:'Search task secret',workspaceId:foreignId,projectId:foreign.id}});
    const q = `workspaceId=${workspaceId}`;
    await request(q,401,0); await request(q,403,outsider);
    await request(q+`&projectId=${foreign.id}`,404);
    await request(`workspaceId=${foreignId}`,403,outsider);
    for (const invalid of ['page=0','page=-1','page=1.5','page=1e2','page=2147483647','limit=101','limit=0','status=OPEN','priority=BAD','assigneeId=0','assigneeId=null','sort=title','order=up','page=1&page=2','status[eq]=TODO','unknown=1','search=%00','search='+ 'a'.repeat(201),'projectId=1&projectId=2','workspaceId=1']) await request(q+'&'+invalid,400);
    const combined = await request(q+`&search=%20sEaRcH%20&projectId=${a.id}&assigneeId=${owner}&status=IN_PROGRESS&priority=HIGH&limit=3&sort=createdAt&order=asc`);
    assert.equal(combined.total,10); assert.equal(combined.totalPages,4); assert.equal(combined.limit,3); assert.equal(combined.page,1);
    assert.deepEqual(combined.items.map((i:{id:number})=>i.id),[ids[0],ids[2],ids[4]]);
    const seen:number[] = [];
    for(let page=1;page<=3;page++) {
      const result = await request(q+`&search=search&limit=10&page=${page}&order=asc`);
      assert.equal(result.total,25); assert.equal(result.totalPages,3);
      seen.push(...result.items.map((i:{id:number})=>i.id));
    }
    assert.deepEqual(seen,ids);
    const empty = await request(q+'&search=no-match'); assert.equal(empty.total,0); assert.equal(empty.totalPages,0); assert.deepEqual(empty.items,[]);
    const beyond = await request(q+'&page=99'); assert.equal(beyond.total,26); assert.deepEqual(beyond.items,[]);
    const unassigned = await request(q+'&assigneeId=unassigned'); assert.equal(unassigned.total,1);
    for(const search of ['%','_','\\','100%_literal\\path']) assert.equal((await request(q+'&search='+encodeURIComponent(search))).total,1);
    assert.equal((await request(q+`&assigneeId=${outsider}`)).total,0);
    const mine = await request(q+'&search=task&limit=100',200,member,'/mine'); assert.equal(mine.total,12); assert.ok(mine.items.every((i:{assigneeId:number})=>i.assigneeId===member));
    assert.equal((await request(q+`&assigneeId=${owner}`,200,member,'/mine')).total,0);
    await request(q+`&projectId=${foreign.id}`,404,member,'/mine');
    const updatedBefore = await request(q+'&search=task&sort=updatedAt&order=desc&limit=1'); assert.equal(updatedBefore.items[0].id,ids[24]);
    const changed = await request(q,200,owner,`/${ids[0]}`,'PATCH',{title:'Search task freshly changed'});
    assert.ok(new Date(changed.updatedAt).getTime()>new Date('2020-02-01').getTime());
    assert.equal((await request(q+'&search=task&sort=updatedAt&limit=1')).items[0].id,ids[0]);
    assert.equal((await request(q+'&search=task&sort=updatedAt&order=asc&limit=1')).items[0].id,ids[1]);
  } finally {
    await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
    await prisma.workspace.deleteMany({where:{id:{in:workspaces}}});
    await prisma.user.deleteMany({where:{id:{in:users}}});
    await prisma.$disconnect();
  }
});
