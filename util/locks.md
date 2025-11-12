Another exciting day of lacking gainful employment. What to write about? I suppose I'm overdue to cover something data related.

I once overheard an otherwise very talented developer loudly complaining about deadlocks in SQL Server, bemoaning Microsoft's "backward technology." I hate Microsoft as much as the next guy, but deadlocks are not a SQL Server specific issue. Different systems can have different prevention and mitigation strategies, but any data system with concurrency and locking can experience a deadlock. This isn't even an issue isolated to database systems; it can happen in any software with concurrency and resource locks.

To understand how a deadlock can happen in a relational database, we first have to know a bit about locks.


## Locks

A database transaction will automatically acquire a lock on the target resource, which could be on the scope of rows, pages, or even the entire database. The scope of the lock and the type will determine how concurrent operations on the same target resource will be handled. There are various different locks modes that vary per database system, but at baseline we have **Shared Locks** and **Exclusive Locks**. When a transaction obtains an exclusive lock on a resource, no other transaction can obtain any other type of lock. This typically occurs with data writes/updates (INSERTs, UPDATEs, and DELETEs). A database restore would be an example of an exclusive lock on an entire database. When a transaction obtains a Shared Lock, the resource is reserved for read only access (SELECTs, for instance). Multiple transactions can obtain a shared lock for read access, but *typically* data modifications (exclusive locks) are blocked. We also have **Update Locks**; an update lock can be obtained on a resource with a shared lock or locks on it, effectively imposing a shared lock that will block any new shared locks. One the existing shared lock transactions are completed, the update lock will become an exclusive lock.

I'm glossing over a lot of minutia and exceptions, but the documentation for the relevant data system will be the bet comprehensive guide. To quote a wise DBA, "It depends." The [PostgreSQL docs](https://www.postgresql.org/docs/current/explicit-locking.html) have a pretty nifty table showing which locks conflict with other lock modes, for example.

On the subject of Postgres, it is quite different than most RDBMS sytems, due to having *Multi-version Concurrency Control* out of the box. In effect, Postgres keeps multiple versions of each row, thus a transaction sees a snapshot of the latest committed version the data as it was when the transaction started. Meanwhile, another transaction can make data modifications by adding a new row version. In practice, reads do not block writes, and vice versa. In practice, this also means *dirty reads*, reading data from an uncommitted transaction, is not a thing in Postgres (you can request a READ COMMITTED isolation level, but it just maps to the default READ COMMITTED). 

Microsoft SQL Server, for its part, has the SNAPSHOT and READ COMMITTED SNAPSHOT isolation levels (latter is often referred to as RCSI). The previous row version is stored in the tempdb system database, and both require the ALLOW_SNAPSHOT_ISOLATION setting to be on. RCSI is a database setting, and stores row versions in tempdb for the duration of each SQL statement, whereas SET TRANSACTION ISOLATION LEVEL SNAPSHOT is activated manually for a session, and snapshots are kept for the duration of the whole transaction. RCSI thus does not occupy tempdb as long, however two statements in a single transaction could theoretically read different snapshots.

I'm getting severely sidetracked.


## Blocking

When a transaction gets a lock on a row, page, database, etc., and another transaction subsequently tries to obtain an conflicting lock, that transaction is **blocked**. This is not the same as a deadlock; no transaction will be killed. The second transaction will simply have to wait until the first is done. Let's generate an example in Postgres. Recall that due to MVCC, reads and writes will not block each other. So, let's do two write operations.

```
-- In one query window

BEGIN

  UPDATE blog.posts SET updated_at = NOW() WHERE post_id = 12
```

First, in one query window (I'm using Dbeaver), we use BEGIN to start a transaction, we then run a query without committing, which leaves the transaction open and leaves the lock(s) in place, though the query appears to complete in the query editor. We can check the Postgres system views, pg_locks and pg_stat_activity:

```
SELECT
  l.locktype,
  l.relation::regclass::text,
  l.mode,
  l.granted,
  a.usename,
  a.query,
  a.state
 FROM pg_locks l
 JOIN pg_stat_activity a ON l.pid = a.pid
 WHERE l.relation IS NOT null and l.relation::regclass::text not like 'pg%'
```

| pid | locktype | relation | mode | granted | usename | query | state |
|-----|----------|----------|------|---------|---------|-------|-------|
| 2289973 | relation | blog.posts_slug_key | RowExclusiveLock | true | webmaster | UPDATE blog.posts set updated_at = NOW() where post_id = 12 | idle in transaction |
| 2289973 | relation | blog.posts_pkey | RowExclusiveLock | true | webmaster | UPDATE blog.posts set updated_at = NOW() where post_id = 12 | idle in transaction |
| 2289973 | relation | blog.posts | RowExclusiveLock | true | webmaster | UPDATE blog.posts set updated_at = NOW() where post_id = 12 | idle in transaction |

As you can see, we've obtained RowExclusiveLocks on the table and indexes. Now, we try running the same update in a another query window. Unlike before, the query will never complete; it is blocked by the first query. We can check the system view, pg_stat_activity:

```
SELECT 
  pid, 
  username, 
  pg_blocking_pids(pid) as blocked_by,
  query as blocked_query
  FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
-- taken from https://stackoverflow.com/questions/26489244/how-to-detect-query-which-holds-the-lock-in-postgres
```

| pid | usename | blocked_by | blocked_query |
|-----|---------|------------|---------------|
| 2289916 | webmaster | {2289973} | UPDATE blog.posts set updated_at = NOW() where post_id = 12 |

Until the first transaction commits and releases it exclusive wait, the second UPDATE is stuck waiting. This is **blocking**; a transaction waiting for another transaction to complete release so it can impose its own lock. This still isn't a deadlock, though.

## Deadlocks

A car traffic analogy comes to mind. Imagine a truck stopped in narrow road, unloading cargo. Cars that come up behind the truck are forced to stop until the truck is finished unloading. Once the truck is done and drives forward, everyone can proceed. This is **blocking**.

Now imagine a car trying to pull out of a parking spot. At the same time, another car is trying drive down the path the first car is backing into. Both cars proceed to the point where the first car is blocking the road the second car is trying to drive down, and the second car is blocking the area the first car wants to back into. We are at an impasse where no one can proceed because the other is occupying the space the other needs; this is a **deadlock**. The only way to resolve this is for one of the cars to "rollback" and allow the other to pass.

Analogies tend to fall apart after a while, so I'm going back to database terms. Say two transactions each have a locks on different resource. Then within the same transaction, they each need to get a lock on the resource the other has locked. This is a circular dependency. If the lock modes are conflicting (for example, all exclusive locks), the transactions are now at an impasse; no one can move forward. When one or more transactions are stuck in this circular dependency situation, we have a deadlock. These transactions will permanently block each other unless action is taken.

So how does the database proceed? Most systems periodically poll for locking and deadlock events. MS SQL Server's lock monitor performs a deadlock search through all of the databases processes every 5 seconds by default. Postgres will wait on a lock for 1 second before checking for a deadlock condition (this is determined by the deadlock_timeout server configuration parameter). In each case, the database engine will pick one of the transactions as the **deadlock victim** (kind of sounds like a Hitchcock movie). The engine will choose the least expensive transaction to rollback, or just pick at random if each transaction costs the same.

Let's try to create a deadlock in Postgres. This isn't as straight forward to do as simple blocking, so we'll have to employ some tricks.

```
-- In the first query editor window

BEGIN

-- Execute first
SELECT updated_at FROM blog.posts
WHERE post_id = 12
FOR UPDATE;

-- Execute t
hird
UPDATE blog.posts
SET updated_at = NOW()
WHERE post_id = 13;
```

```
-- In the second query editor window

BEGIN

-- Execute second
SELECT updated_at FROM blog.posts
WHERE post_id = 13
FOR UPDATE;

-- Execute fourth
UPDATE blog.posts
SET updated_at = NOW()
WHERE post_id = 12;
```

Firstly, note the use of the FOR UPDATE clause in the SELECT statements. Recall that SELECTs normally do not block write due to MVCC. With the FOR UPDATE clause, the SELECT will obtain obtain a ShareLock, which blocks writes. One would use this clause when we do not want the data we're reading to be modified over the course of our transaction.

Note also the execution order denoted by the comment. First we run the SELECT  for post_id = 12, which obtains a write-blocking lock on that row. Then, in the other session, we run the SELECT for post_id = 13, which gets the same lock mode on on that row. Then in the first session, we try to run an UPDATE; due to the ShareLock held by the select in the second session, this UPDATE is blocked. Finally, we run the fourth UPDATE, which will be blocked by the first SELECT. We are now stuck in circular dependency. This situation will persist for exactly 1 second, at which point Postgres's deadlock_timeout will kick in.

In this case, the second session was chosen as the deadlock victim.

```
SQL Error [40P01]: ERROR: deadlock detected
  Detail: Process 2298887 waits for ShareLock on transaction 588; blocked by process 2298885.
Process 2298885 waits for ShareLock on transaction 589; blocked by process 2298887.
  Hint: See server log for query details.
  Where: while updating tuple (0,17) in relation "posts"
```

## Deadlock Prevention and Mitigation

Deadlocks are usually rare. They tend to come up somewhat more often in OLTP databases with large numbers of concurrent transaction, due to increased opportunity. How can we prevent them? We already discussed multi-version concurrency control, which keeps reads and writes from blocking each other. Another prevention method is to simply make the database go faster (brrrr). Query tuning, proper indexing, statistics maintenance, etc. will help transactions complete faster, reducing the window of opportunity for deadlocks (and decrease regular blocking).

Even with a well tuned database, a deadlock is always a lingering possibility. Applications that interact with databases should implement error handling that catches deadlock errors and retries the aborted transaction.

That's all I've got for now. Here are some sources that helped me compile this write-up.

[Postgres Docs - Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)


[Postgres Docs - Lock Management](https://www.postgresql.org/docs/current/runtime-config-locks.html)

[Microsoft SQL Server Deadlocks Guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-deadlocks-guide?view=sql-server-ver17)

[SET TRANSACTION ISOLATION LEVEL docs](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql?view=sql-server-ver17)


Until next time - Div
