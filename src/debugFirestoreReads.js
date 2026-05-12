// Debug helper to narrow down which rule is denying reads.
// Import and call window.__debugFirestoreReads() from the browser console.

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function debugFirestoreReads() {
  const info = {
    auth: {
      hasUser: !!auth.currentUser,
      uid: auth.currentUser?.uid || null,
    },
  };

  async function tryQuery(label, q) {
    try {
      const snap = await getDocs(q);
      return {
        ok: true,
        label,
        size: snap.size,
        first: snap.docs[0]
          ? { id: snap.docs[0].id, data: snap.docs[0].data() }
          : null,
      };
    } catch (e) {
      return {
        ok: false,
        label,
        code: e?.code,
        message: e?.message,
      };
    }
  }

  const results = [];

  results.push(
    await tryQuery(
      "leagues(limit 1)",
      query(collection(db, "leagues"), limit(1)),
    ),
  );

  results.push(
    await tryQuery(
      "leagues where visibility==public (limit 1)",
      query(
        collection(db, "leagues"),
        where("visibility", "==", "public"),
        limit(1),
      ),
    ),
  );

  return { ...info, results };
}

if (typeof window !== "undefined") {
  window.__debugFirestoreReads = debugFirestoreReads;
}
