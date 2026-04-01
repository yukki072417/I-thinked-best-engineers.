import { pool } from "../db.js";

export type FriendStatus = "pending" | "accepted" | "rejected";

export interface Friend {
  github_login: string;
  name: string | null;
  avatar_url: string;
  status: FriendStatus;
}

export async function findFriends(github_login: string): Promise<Friend[]> {
  const [rows] = await pool.execute<any[]>(
    `SELECT
       CASE WHEN f.requester_login = ? THEN f.requestee_login ELSE f.requester_login END AS github_login,
       u.name,
       u.avatar_url,
       f.status
     FROM friends f
     JOIN users u ON u.github_login = CASE WHEN f.requester_login = ? THEN f.requestee_login ELSE f.requester_login END
     WHERE f.requester_login = ? OR f.requestee_login = ?`,
    [github_login, github_login, github_login, github_login]
  );
  return rows;
}

export async function createFriendRequest(
  requester_login: string,
  requestee_login: string,
  autoAccept: boolean
): Promise<FriendStatus> {
  const status: FriendStatus = autoAccept ? "accepted" : "pending";
  await pool.execute(
    `INSERT INTO friends (requester_login, requestee_login, status)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [requester_login, requestee_login, status]
  );
  return status;
}

export async function updateFriendStatus(
  requestee_login: string,
  requester_login: string,
  status: "accepted" | "rejected"
): Promise<boolean> {
  const [result] = await pool.execute<any>(
    `UPDATE friends SET status = ?
     WHERE requester_login = ? AND requestee_login = ? AND status = 'pending'`,
    [status, requester_login, requestee_login]
  );
  return result.affectedRows > 0;
}
