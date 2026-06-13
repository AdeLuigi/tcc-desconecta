import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface ActivityData {
  userId: string;
  minutosDesconectado: number;
  data: string; // YYYY-MM-DD
}

interface RankingData {
  userId: string;
  total: number;
  streak: number;
  ultimaAtividade?: string;
}

/**
 * Calcula o streak com base na última atividade registrada.
 * @param {Partial<RankingData>} current - dados atuais do ranking
 * @param {string} today - data de hoje no formato YYYY-MM-DD
 * @return {number} novo valor do streak
 */
function calculateStreak(current: Partial<RankingData>, today: string): number {
  if (!current.ultimaAtividade) return 1;
  const lastDate = new Date(current.ultimaAtividade);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 1) return (current.streak ?? 0) + 1; // dia consecutivo
  if (diffDays === 0) return current.streak ?? 1; // mesmo dia, não incrementa
  return 1; // quebrou o streak
}

/**
 * Disparada quando uma atividade é registrada em um grupo.
 * Atualiza o ranking do usuário de forma atômica.
 */
export const onActivityRegistered = onDocumentCreated(
  {
    document: "grupos/{groupId}/atividades/{activityId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const activity = snapshot.data() as ActivityData;
    const {groupId} = event.params;
    const {userId, minutosDesconectado, data} = activity;

    if (!userId || minutosDesconectado == null || !data) {
      logger.warn("onActivityRegistered: dados incompletos", activity);
      return;
    }

    const db = admin.firestore();
    const rankingRef = db.doc(`grupos/${groupId}/ranking/${userId}`);

    await db.runTransaction(async (tx) => {
      const rankingSnap = await tx.get(rankingRef);
      const current: Partial<RankingData> =
        rankingSnap.exists ?
          (rankingSnap.data() as RankingData) :
          {total: 0, streak: 0};

      tx.set(
        rankingRef,
        {
          userId,
          total: (current.total ?? 0) + minutosDesconectado,
          streak: calculateStreak(current, data),
          ultimaAtividade: data,
        },
        {merge: true},
      );
    });

    logger.info(
      `Ranking atualizado: grupo=${groupId}` +
      ` usuario=${userId} +${minutosDesconectado}min`,
    );
  },
);
