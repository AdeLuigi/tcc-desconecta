/**
 * Migração: adiciona o campo `membrosIds` em grupos que ainda não o possuem.
 *
 * Uso:
 *   1. Obtenha a chave de serviço do Firebase Console → Configurações do Projeto → Contas de serviço
 *   2. Salve o JSON como `scripts/serviceAccountKey.json`
 *   3. Execute: node scripts/migrate-membros-ids.js
 */

const admin = require("firebase-admin")
const serviceAccount = require("./serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function migrate() {
  const snapshot = await db.collection("grupos").get()

  const docsToMigrate = snapshot.docs.filter((doc) => !doc.data().membrosIds)

  if (docsToMigrate.length === 0) {
    console.log("Nenhum documento precisa de migração.")
    return
  }

  console.log(`Migrando ${docsToMigrate.length} grupos...`)

  // Firestore batch tem limite de 500 operações
  const BATCH_SIZE = 500
  for (let i = 0; i < docsToMigrate.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = docsToMigrate.slice(i, i + BATCH_SIZE)

    chunk.forEach((doc) => {
      const membros = doc.data().membros || []
      const membrosIds = membros.map((m) => m.userId).filter(Boolean)
      batch.update(doc.ref, { membrosIds })
    })

    await batch.commit()
    console.log(`  Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} grupos atualizados`)
  }

  console.log("Migração concluída.")
}

migrate().catch((err) => {
  console.error("Erro na migração:", err)
  process.exit(1)
})
