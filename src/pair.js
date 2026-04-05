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
  const recentPairs = new Set(historyResult.rows.map(r => makeKey(r.user1_id, r.user2_id)));

  // Get participants
  const result = await pool.query('SELECT user_id FROM participants');
  const participants = result.rows.map(r => r.user_id);

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

  const used = new Set(); // Track paired users
  let leftover = null;

  // Handle odd number of participants
  if (participants.length % 2 !== 0) {
    leftover = participants.pop();
  }

  for (let i = 0; i < participants.length; i++) {
    const user1 = participants[i];
    if (used.has(user1)) continue; //  skip already paired
 
    // Try to find a partner not recently paired
    let partner = participants.slice(i + 1).find(u => !used.has(u) && !recentPairs.has(makeKey(user1, u)));

    // Fallback: any unused participant
    if (!partner) {
      partner = participants.slice(i + 1).find(u => !used.has(u));
    }

    if (!partner) continue; // No available partner, skip this participant (shouldn't happen)

    used.add(user1);
    used.add(partner);

    // Form group
    const group = [user1, partner];

    // If leftover exists and this is the last pair, add to make a triple
    if (leftover && participants.length === used.size) {
      group.push(leftover);
      leftover = null;
    }

    // DM each member
   for (const u of group) {
  try {
    const userObj = await client.users.fetch(u); // Fetch recipient

    // Get mentions for everyone else in the group
    const others = group
      .filter(x => x !== u)
      .map(x => `<@${x}>`) 
      .join(', ');

    await userObj.send(`☕ You’ve been paired with ${others}! Have a great chat 👋`);
  } catch (err) {
    console.error(`Failed to DM user ${u}:`, err);
    await channel.send(`⚠️ Could not DM <@${u}>`);
  }
}

    // Save pairings to DB
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