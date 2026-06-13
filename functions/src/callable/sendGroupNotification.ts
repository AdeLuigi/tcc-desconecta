import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface SendGroupNotificationData {
  groupId: string;
  senderId: string;
  message: string;
}

/**
 * Callable function para enviar notificação push para
 * todos os membros de um grupo, exceto o remetente.
 * Os tokens FCM nunca são expostos ao cliente.
 */
export const sendGroupNotification = onCall<SendGroupNotificationData>(
  {region: "southamerica-east1"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login necessário");
    }

    const {groupId, senderId, message} = request.data;

    if (!groupId || !senderId || !message) {
      throw new HttpsError(
        "invalid-argument",
        "groupId, senderId e message são obrigatórios",
      );
    }

    const db = admin.firestore();

    const groupSnap = await db.doc(`grupos/${groupId}`).get();
    if (!groupSnap.exists) {
      throw new HttpsError("not-found", "Grupo não encontrado");
    }

    const group = groupSnap.data() ?? {};
    const memberIds: string[] =
        ((group.membrosIds as string[]) ?? []).filter(
          (id) => id !== senderId,
        );

    if (memberIds.length === 0) return {sent: 0};

    // Buscar tokens FCM dos membros em paralelo
    const userDocs = await Promise.all(
      memberIds.map((id) => db.doc(`usuarios/${id}`).get()),
    );

    const tokens = userDocs
      .filter((d) =>
        d.exists &&
          d.data()?.fcmToken &&
          d.data()?.configuracoes?.notificacoes !== false,
      )
      .map((d) => (d.data()?.fcmToken ?? "") as string);
    if (tokens.length === 0) return {sent: 0};

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: group.nome as string,
        body: message,
      },
      data: {groupId},
    });

    if (response.failureCount > 0) {
      logger.warn(
        `sendGroupNotification: ${response.failureCount}` +
        ` falha(s) de ${tokens.length}`,
      );
    }

    logger.info(
      "sendGroupNotification: enviado para" +
      ` ${response.successCount}/${tokens.length}` +
      ` membros do grupo ${groupId}`,
    );

    return {sent: response.successCount};
  },
);
