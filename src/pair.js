import { pool } from './db.js';

export async function runPairing(client, channel) {
  const month = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
  const makeKey = (a, b) => [a, b].sort().join('-');

  // Get recent pairings (last 3 months)
  const historyResult = await pool.query(
    `SELECT user1_id, user2_id
     FROM pairings
     WHERE month >= TO_CHAR(NOW() - INTERVAL '3 months', 'YYYY-MM')`
  );

  const recentPairs = new Set();
  for (const row of historyResult.rows) {
    recentPairs.add(makeKey(row.user1_id, row.user2_id));
  }

  // Get participants
  const result = await pool.query('SELECT user_id FROM participants');
  const participants = result.rows.map(row => row.user_id);

  if (participants.length < 2) {
    await channel.send(
      participants.length === 0
        ? "No participants have joined the coffee chat yet."
        : "Not enough participants to create pairs."
    );
    return;
  }

  // Shuffle participants
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  const used = new Set();

  for (let i = 0; i < participants.length; i++) {
    const user1 = participants[i];
    if (used.has(user1)) continue;

    let partner1 = null;
    let partner2 = null;

    // Find first partner not recently paired
    for (let j = i + 1; j < participants.length; j++) {
      const user2 = participants[j];
      if (used.has(user2)) continue;

      if (!recentPairs.has(makeKey(user1, user2))) {
        partner1 = user2;
        break;
      }
    }

    // Fallback: allow repeat if no fresh match
    if (!partner1) {
      for (let j = i + 1; j < participants.length; j++) {
        const user2 = participants[j];
        if (!used.has(user2)) {
          partner1 = user2;
          break;
        }
      }
    }

    if (!partner1) {
      // Only one left, no partners
      try {
        const userObj = await client.users.fetch(user1);
        await userObj.send(`👀 You have no partner this month. Try again next month!`);
      } catch {
        await channel.send(`⚠️ Could not DM <@${user1}>`);
      }
      continue;
    }

    used.add(user1);
    used.add(partner1);

    // Check for third participant to make a triple
    if (participants.length - used.size === 1) {
      // Only one participant left, make a triple
      for (let k = i + 1; k < participants.length; k++) {
        const user3 = participants[k];
        if (!used.has(user3)) {
          partner2 = user3;
          used.add(partner2);
          break;
        }
      }
    }

    const group = [user1, partner1];
    if (partner2) group.push(partner2);

    // DM everyone in the group
    for (const u of group) {
      try {
        const others = group.filter(x => x !== u).map(x => `<@${x}>`).join(', ');
        const userObj = await client.users.fetch(u);
        await userObj.send(`☕ You’ve been paired with ${others}! Have a great chat 👋`);
      } catch {
        await channel.send(`⚠️ Could not DM <@${u}>`);
      }
    }

    // Save pairs to DB (only save as pairwise, not triples)
    for (let x = 0; x < group.length; x++) {
      for (let y = x + 1; y < group.length; y++) {
        await pool.query(
          'INSERT INTO pairings(user1_id, user2_id, month) VALUES($1, $2, $3)',
          [group[x], group[y], month]
        );
      }
    }
  }

  await channel.send(`☕ Pairings for this month have been sent privately to your DMs!`);
}