import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const PROJECT_ID = "demo-sportclash";
const FIRESTORE_PORT = 8082;

let testEnv;

async function seed(fn) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await fn(context.firestore());
  });
}

async function seedLeague({
  leagueId,
  ownerUid,
  visibility = "public",
  dailyPointsLimit = 5,
  membersCount = 1,
} = {}) {
  await seed(async (db) => {
    await setDoc(doc(db, "leagues", leagueId), {
      name: `Liga ${leagueId}`,
      visibility,
      dailyPointsLimit,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      createdBy: ownerUid,
      membersCount,
    });

    await setDoc(doc(db, "leagueMembers", `${leagueId}_${ownerUid}`), {
      leagueId,
      uid: ownerUid,
      role: "owner",
      joinedAt: new Date("2026-01-01T00:00:00Z"),
    });
  });
}

async function seedMember({ leagueId, uid, role }) {
  await seed(async (db) => {
    await setDoc(doc(db, "leagueMembers", `${leagueId}_${uid}`), {
      leagueId,
      uid,
      role,
      joinedAt: new Date("2026-01-01T00:00:00Z"),
    });
  });
}

async function seedJoinRequest({ leagueId, uid, status }) {
  await seed(async (db) => {
    await setDoc(doc(db, "leagueJoinRequests", `${leagueId}_${uid}`), {
      leagueId,
      uid,
      status,
      createdAt: new Date("2026-01-02T00:00:00Z"),
      decidedAt: status === "pending" ? null : new Date("2026-01-03T00:00:00Z"),
      decidedBy: status === "pending" ? null : "admin",
    });
  });
}

test.before(async () => {
  const rules = await fs.readFile("firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: "127.0.0.1",
      port: FIRESTORE_PORT,
    },
  });
});

test.after(async () => {
  await testEnv?.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

test("Public: can get profiles and leagues; cannot list users", async () => {
  const anon = testEnv.unauthenticatedContext();
  const db = anon.firestore();

  await seed(async (adminDb) => {
    await setDoc(doc(adminDb, "users", "u1"), { nombre: "Public" });
    await setDoc(doc(adminDb, "leagues", "pub"), {
      name: "Public League",
      visibility: "public",
      dailyPointsLimit: 5,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      createdBy: "owner",
      membersCount: 1,
    });
    await setDoc(doc(adminDb, "leagues", "priv"), {
      name: "Private League",
      visibility: "private",
      dailyPointsLimit: 5,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      createdBy: "owner",
      membersCount: 1,
    });
  });

  await assertSucceeds(getDoc(doc(db, "users", "u1")));
  await assertSucceeds(getDoc(doc(db, "leagues", "pub")));
  await assertSucceeds(getDoc(doc(db, "leagues", "priv")));

  // list public leagues (query constrained to visibility==public)
  await assertSucceeds(
    getDocs(
      query(collection(db, "leagues"), where("visibility", "==", "public")),
    ),
  );

  // listing users must fail
  await assertFails(getDocs(collection(db, "users")));
});

test("Leagues: authenticated user can create league; must create fields correctly", async () => {
  const bob = testEnv.authenticatedContext("bob");
  const db = bob.firestore();

  await assertSucceeds(
    setDoc(doc(db, "leagues", "L1"), {
      name: "Mi liga",
      visibility: "public",
      dailyPointsLimit: 3,
      createdAt: serverTimestamp(),
      createdBy: "bob",
      membersCount: 1,
    }),
  );

  // bootstrap membership owner
  await assertSucceeds(
    setDoc(doc(db, "leagueMembers", "L1_bob"), {
      leagueId: "L1",
      uid: "bob",
      role: "owner",
      joinedAt: serverTimestamp(),
    }),
  );
});

test("Leagues: owner can edit settings; admin can only update membersCount", async () => {
  await seedLeague({ leagueId: "L1", ownerUid: "alice", visibility: "public" });
  await seedMember({ leagueId: "L1", uid: "admin1", role: "admin" });

  const ownerDb = testEnv.authenticatedContext("alice").firestore();
  const adminDb = testEnv.authenticatedContext("admin1").firestore();

  await assertSucceeds(
    updateDoc(doc(ownerDb, "leagues", "L1"), { name: "Nuevo" }),
  );

  await assertSucceeds(
    updateDoc(doc(adminDb, "leagues", "L1"), { membersCount: 2 }),
  );

  await assertFails(updateDoc(doc(adminDb, "leagues", "L1"), { name: "Nope" }));
});

test("Leagues: only owner can delete", async () => {
  await seedLeague({ leagueId: "L1", ownerUid: "alice" });
  await seedMember({ leagueId: "L1", uid: "admin1", role: "admin" });

  const ownerDb = testEnv.authenticatedContext("alice").firestore();
  const adminDb = testEnv.authenticatedContext("admin1").firestore();

  await assertFails(deleteDoc(doc(adminDb, "leagues", "L1")));
  await assertSucceeds(deleteDoc(doc(ownerDb, "leagues", "L1")));
});

test("Members: only owner can change roles and kick", async () => {
  await seedLeague({ leagueId: "L1", ownerUid: "alice" });
  await seedMember({ leagueId: "L1", uid: "admin1", role: "admin" });
  await seedMember({ leagueId: "L1", uid: "m1", role: "member" });

  const ownerDb = testEnv.authenticatedContext("alice").firestore();
  const adminDb = testEnv.authenticatedContext("admin1").firestore();

  await assertFails(
    updateDoc(doc(adminDb, "leagueMembers", "L1_m1"), { role: "admin" }),
  );
  await assertSucceeds(
    updateDoc(doc(ownerDb, "leagueMembers", "L1_m1"), { role: "admin" }),
  );

  await assertFails(deleteDoc(doc(adminDb, "leagueMembers", "L1_m1")));
  await assertSucceeds(deleteDoc(doc(ownerDb, "leagueMembers", "L1_m1")));
});

test("Members: user can get their own membership doc even if missing", async () => {
  await seedLeague({ leagueId: "L1", ownerUid: "alice" });

  const userDb = testEnv.authenticatedContext("u2").firestore();
  const snap = await assertSucceeds(
    getDoc(doc(userDb, "leagueMembers", "L1_u2")),
  );
  assert.equal(snap.exists(), false);
});

test("JoinRequests: requester can create and re-request after rejection (public only)", async () => {
  await seedLeague({
    leagueId: "pub",
    ownerUid: "alice",
    visibility: "public",
  });
  await seedLeague({
    leagueId: "priv",
    ownerUid: "alice",
    visibility: "private",
  });
  await seedMember({ leagueId: "pub", uid: "admin1", role: "admin" });
  await seedMember({ leagueId: "priv", uid: "admin1", role: "admin" });

  const userDb = testEnv.authenticatedContext("u2").firestore();
  const adminDb = testEnv.authenticatedContext("admin1").firestore();

  await assertSucceeds(
    setDoc(doc(userDb, "leagueJoinRequests", "pub_u2"), {
      leagueId: "pub",
      uid: "u2",
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
    }),
  );

  // admin can list pending
  await assertSucceeds(
    getDocs(
      query(
        collection(adminDb, "leagueJoinRequests"),
        where("leagueId", "==", "pub"),
        where("status", "==", "pending"),
      ),
    ),
  );

  // seed a rejected request and allow re-request (public)
  await seedJoinRequest({ leagueId: "pub", uid: "u2", status: "rejected" });
  await assertSucceeds(
    updateDoc(doc(userDb, "leagueJoinRequests", "pub_u2"), {
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
    }),
  );

  // same pattern must fail for private
  await seedJoinRequest({ leagueId: "priv", uid: "u2", status: "rejected" });
  await assertFails(
    updateDoc(doc(userDb, "leagueJoinRequests", "priv_u2"), {
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
    }),
  );
});

test("PointRequests: member can create/edit/delete pending; reject requires reason; admin cannot self-moderate", async () => {
  await seedLeague({ leagueId: "L1", ownerUid: "alice" });
  await seedMember({ leagueId: "L1", uid: "admin1", role: "admin" });
  await seedMember({ leagueId: "L1", uid: "m1", role: "member" });

  const memberDb = testEnv.authenticatedContext("m1").firestore();
  const adminDb = testEnv.authenticatedContext("admin1").firestore();
  const ownerDb = testEnv.authenticatedContext("alice").firestore();

  // member can create + edit + delete while pending
  await assertSucceeds(
    setDoc(doc(memberDb, "pointRequests", "L1_m1_pending"), {
      leagueId: "L1",
      uid: "m1",
      points: 1,
      note: "",
      performedOn: "2026-05-11",
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
      rejectReason: null,
      rejectedOn: null,
    }),
  );

  await assertSucceeds(
    updateDoc(doc(memberDb, "pointRequests", "L1_m1_pending"), {
      note: "nota",
    }),
  );

  await assertSucceeds(
    deleteDoc(doc(memberDb, "pointRequests", "L1_m1_pending")),
  );

  // moderation path (separate request)
  await assertSucceeds(
    setDoc(doc(memberDb, "pointRequests", "L1_m1_mod"), {
      leagueId: "L1",
      uid: "m1",
      points: 1,
      note: "",
      performedOn: "2026-05-11",
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
      rejectReason: null,
      rejectedOn: null,
    }),
  );

  // reject without reason must fail
  await assertFails(
    updateDoc(doc(adminDb, "pointRequests", "L1_m1_mod"), {
      status: "rejected",
      decidedAt: serverTimestamp(),
      decidedBy: "admin1",
      rejectReason: "",
      rejectedOn: "2026-05-11",
    }),
  );

  // reject with reason succeeds
  await assertSucceeds(
    updateDoc(doc(adminDb, "pointRequests", "L1_m1_mod"), {
      status: "rejected",
      decidedAt: serverTimestamp(),
      decidedBy: "admin1",
      rejectReason: "No válido",
      rejectedOn: "2026-05-11",
    }),
  );

  // admin cannot moderate own request
  await assertSucceeds(
    setDoc(doc(adminDb, "pointRequests", "L1_admin1_1"), {
      leagueId: "L1",
      uid: "admin1",
      points: 1,
      note: "",
      performedOn: "2026-05-11",
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
      rejectReason: null,
      rejectedOn: null,
    }),
  );

  await assertFails(
    updateDoc(doc(adminDb, "pointRequests", "L1_admin1_1"), {
      status: "approved",
      decidedAt: serverTimestamp(),
      decidedBy: "admin1",
      rejectReason: null,
      rejectedOn: null,
    }),
  );

  // owner can self-moderate
  await assertSucceeds(
    setDoc(doc(ownerDb, "pointRequests", "L1_alice_1"), {
      leagueId: "L1",
      uid: "alice",
      points: 1,
      note: "",
      performedOn: "2026-05-11",
      status: "pending",
      createdAt: serverTimestamp(),
      decidedAt: null,
      decidedBy: null,
      rejectReason: null,
      rejectedOn: null,
    }),
  );

  await assertSucceeds(
    updateDoc(doc(ownerDb, "pointRequests", "L1_alice_1"), {
      status: "approved",
      decidedAt: serverTimestamp(),
      decidedBy: "alice",
      rejectReason: null,
      rejectedOn: null,
    }),
  );
});

test("PointRequests: members can read approved requests for ranking; cannot read others' pending", async () => {
  await seedLeague({ leagueId: "L1", ownerUid: "alice" });
  await seedMember({ leagueId: "L1", uid: "m1", role: "member" });
  await seedMember({ leagueId: "L1", uid: "m2", role: "member" });

  await seed(async (db) => {
    await setDoc(doc(db, "pointRequests", "L1_m2_approved"), {
      leagueId: "L1",
      uid: "m2",
      points: 1,
      note: "",
      performedOn: "2026-05-11",
      status: "approved",
      createdAt: new Date("2026-05-11T10:00:00Z"),
      decidedAt: new Date("2026-05-11T12:00:00Z"),
      decidedBy: "alice",
      rejectReason: null,
      rejectedOn: null,
    });

    await setDoc(doc(db, "pointRequests", "L1_m2_pending"), {
      leagueId: "L1",
      uid: "m2",
      points: 1,
      note: "",
      performedOn: "2026-05-11",
      status: "pending",
      createdAt: new Date("2026-05-11T10:00:00Z"),
      decidedAt: null,
      decidedBy: null,
      rejectReason: null,
      rejectedOn: null,
    });
  });

  const memberDb = testEnv.authenticatedContext("m1").firestore();

  // member can query approved for ranking
  const approvedSnap = await assertSucceeds(
    getDocs(
      query(
        collection(memberDb, "pointRequests"),
        where("leagueId", "==", "L1"),
        where("status", "==", "approved"),
      ),
    ),
  );
  assert.equal(approvedSnap.docs.length, 1);

  // but cannot read someone else's pending
  await assertFails(getDoc(doc(memberDb, "pointRequests", "L1_m2_pending")));
});

test("LeagueHistory: admin sees all; member must query by visibleToUids", async () => {
  await seedLeague({ leagueId: "L1", ownerUid: "alice" });
  await seedMember({ leagueId: "L1", uid: "admin1", role: "admin" });
  await seedMember({ leagueId: "L1", uid: "m1", role: "member" });

  await seed(async (db) => {
    await setDoc(doc(db, "leagueHistory", "e1"), {
      leagueId: "L1",
      type: "pointRequest.decide",
      actorUid: "admin1",
      adminUids: ["alice", "admin1"],
      subjectUids: ["m1"],
      visibleToUids: ["alice", "admin1", "m1"],
      payload: {},
      createdAt: new Date("2026-01-05T00:00:00Z"),
    });
    await setDoc(doc(db, "leagueHistory", "e2"), {
      leagueId: "L1",
      type: "pointRequest.decide",
      actorUid: "admin1",
      adminUids: ["alice", "admin1"],
      subjectUids: ["someone-else"],
      visibleToUids: ["alice", "admin1", "someone-else"],
      payload: {},
      createdAt: new Date("2026-01-05T00:00:00Z"),
    });
  });

  const adminDb = testEnv.authenticatedContext("admin1").firestore();
  const memberDb = testEnv.authenticatedContext("m1").firestore();

  // sanity: both are members
  await assertSucceeds(getDoc(doc(adminDb, "leagueMembers", "L1_admin1")));
  await assertSucceeds(getDoc(doc(memberDb, "leagueMembers", "L1_m1")));

  const adminSnap = await assertSucceeds(
    getDocs(
      query(
        collection(adminDb, "leagueHistory"),
        where("leagueId", "==", "L1"),
        where("visibleToUids", "array-contains", "admin1"),
      ),
    ),
  );
  assert.equal(adminSnap.docs.length, 2);

  // member query without visibleToUids filter must fail
  await assertFails(
    getDocs(
      query(
        collection(memberDb, "leagueHistory"),
        where("leagueId", "==", "L1"),
      ),
    ),
  );

  // member query with visibleToUids filter must succeed
  const snap = await assertSucceeds(
    getDocs(
      query(
        collection(memberDb, "leagueHistory"),
        where("leagueId", "==", "L1"),
        where("visibleToUids", "array-contains", "m1"),
      ),
    ),
  );
  assert.equal(snap.docs.length, 1);
});
