#!/usr/bin/env node

import process from "node:process";

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function parseArgs(argv) {
  const args = {
    projectId:
      process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "",
    emulator: false,
    prod: false,
    force: false,
    dryRun: false,
    batchSize: 300,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project" || a === "-p") {
      args.projectId = String(argv[++i] || "");
      continue;
    }
    if (a === "--emulator") {
      args.emulator = true;
      continue;
    }
    if (a === "--prod") {
      args.prod = true;
      continue;
    }
    if (a === "--force") {
      args.force = true;
      continue;
    }
    if (a === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (a === "--batch" || a === "--batch-size") {
      args.batchSize = Number(argv[++i] || 0);
      continue;
    }
    if (a === "--help" || a === "-h") {
      args.help = true;
      continue;
    }
  }

  return args;
}

function usage() {
  console.log(
    `\nReset de ligas (DESTRUCTIVO)\n\nUso:\n  node scripts/resetLeagues.mjs --emulator --project demo-sportclash --force\n\nOpciones:\n  --project, -p   Project ID (requerido para emulador si no está en env)\n  --emulator      Usa Firestore Emulator (recomendado)\n  --prod          Borra en Firestore REAL (muy peligroso)\n  --force         Requerido para ejecutar borrado\n  --dry-run       No borra; solo lista conteos\n  --batch-size    Tamaño de lote (default: 300)\n\nColecciones que se borran:\n  leagues, leagueMembers, leagueJoinRequests, pointRequests, leagueHistory\n`,
  );
}

async function getCollectionCount(db, colName) {
  // count() existe en Admin SDK moderno, pero en algunos entornos/emulador puede fallar.
  try {
    const snap = await db.collection(colName).count().get();
    return Number(snap.data().count || 0);
  } catch {
    // Fallback: contar por paginación (más lento, pero robusto)
    let total = 0;
    let last = null;
    while (true) {
      let q = db.collection(colName).orderBy("__name__").limit(500);
      if (last) q = q.startAfter(last);
      const snap = await q.get();
      if (snap.empty) break;
      total += snap.size;
      last = snap.docs[snap.docs.length - 1];
    }
    return total;
  }
}

async function deleteCollection(db, colName, batchSize, dryRun) {
  let deleted = 0;
  while (true) {
    const snap = await db.collection(colName).limit(batchSize).get();
    if (snap.empty) break;

    if (dryRun) {
      deleted += snap.size;
      break;
    }

    const bw = db.bulkWriter();
    for (const doc of snap.docs) {
      bw.delete(doc.ref);
    }
    await bw.close();

    deleted += snap.size;
  }
  return deleted;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    process.exit(0);
  }

  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (emulatorHost && !args.prod) {
    // Si el emulador está configurado en env, asumimos emulador.
    args.emulator = true;
  }

  if (!args.projectId) {
    console.error("ERROR: Falta projectId. Usa --project <id>.");
    usage();
    process.exit(2);
  }

  if (!args.force) {
    console.error("ERROR: Falta --force (protección anti-borrado accidental).");
    usage();
    process.exit(2);
  }

  if (args.prod) {
    const okEnv = process.env.SPORTCLASH_RESET_PROD === "YES_I_KNOW";
    if (!okEnv) {
      console.error(
        "ERROR: Para borrar en producción, define SPORTCLASH_RESET_PROD=YES_I_KNOW.",
      );
      process.exit(2);
    }
  }

  // Inicialización Admin:
  // - Emulador: no requiere credenciales
  // - Producción: requiere GOOGLE_APPLICATION_CREDENTIALS (service account)
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const opts = { projectId: args.projectId };

  if (args.prod) {
    if (!credPath) {
      console.error(
        "ERROR: Producción requiere GOOGLE_APPLICATION_CREDENTIALS apuntando a un service account JSON.",
      );
      process.exit(2);
    }

    initializeApp({ ...opts, credential: applicationDefault() });
  } else {
    initializeApp(opts);
  }

  const db = getFirestore();

  const collections = [
    "leagues",
    "leagueMembers",
    "leagueJoinRequests",
    "pointRequests",
    "leagueHistory",
  ];

  console.log(
    `\nTarget: ${args.prod ? "PRODUCCIÓN" : args.emulator ? "EMULADOR" : "DESCONOCIDO"}`,
  );
  console.log(`Project: ${args.projectId}`);
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      `FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST}`,
    );
  }

  const counts = {};
  for (const col of collections) {
    counts[col] = await getCollectionCount(db, col);
  }

  console.log("\nConteos actuales:");
  for (const col of collections) {
    console.log(`- ${col}: ${counts[col]}`);
  }

  if (args.dryRun) {
    console.log("\nDry-run: no se ha borrado nada.");
    return;
  }

  for (const col of collections) {
    const n = await deleteCollection(db, col, args.batchSize, false);
    console.log(`Borrado: ${col}: ${n}`);
  }

  console.log("\nOK: reset completado.");
}

main().catch((e) => {
  console.error("\nFATAL:", e?.message || e);
  process.exit(1);
});
