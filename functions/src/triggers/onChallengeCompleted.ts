import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Disparada quando o status de um participante de desafio muda.
 * Se mudar para "concluido", incrementa a pontuação do usuário.
 */
export const onChallengeCompleted = onDocumentUpdated(
  {
    document: "desafios/{challengeId}/participantes/{userId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // Só processar quando o status muda para "concluido"
    if (before.status === after.status || after.status !== "concluido") return;

    const {challengeId, userId} = event.params;
    const db = admin.firestore();

    const challengeSnap = await db.doc(`desafios/${challengeId}`).get();
    if (!challengeSnap.exists) {
      logger.warn(
        `onChallengeCompleted: desafio ${challengeId} não encontrado`,
      );
      return;
    }

    const challenge = challengeSnap.data() ?? {};
    const pontos: number = (challenge.pontos as number) ?? 10;

    await db.doc(`usuarios/${userId}`).update({
      pontuacao: admin.firestore.FieldValue.increment(pontos),
    });

    logger.info(
      `Desafio concluído: challengeId=${challengeId}` +
      ` userId=${userId} +${pontos}pts`,
    );
  },
);
