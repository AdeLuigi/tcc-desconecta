/**
 * Cloud Functions para o sistema de notificações push
 * App: TCC Desconecta
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Inicializar Firebase Admin
admin.initializeApp();

// Configurações globais
setGlobalOptions({
  maxInstances: 10,
  region: "southamerica-east1", // Mesma região do Firestore
});

/**
 * Cloud Function que monitora a coleção 'notificacoes_pendentes'
 * e envia notificações push para os usuários
 *
 * Triggered quando um novo documento é criado em notificacoes_pendentes
 */
export const sendNotifications = onDocumentCreated(
  "notificacoes_pendentes/{notificationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error("Snapshot não encontrado");
      return null;
    }

    const notification = snapshot.data();
    const notificationId = event.params.notificationId;

    logger.info(`Processando notificação ${notificationId}`);

    // Verificar se já foi processada
    if (notification.processed) {
      logger.info("Notificação já foi processada");
      return null;
    }

    const {tokens, title, body, data} = notification;

    // Validar dados
    if (!tokens || tokens.length === 0) {
      logger.error("Nenhum token fornecido");
      await snapshot.ref.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: "Nenhum token fornecido",
      });
      return null;
    }

    // Construir a mensagem
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: title || "Nova notificação",
        body: body || "",
      },
      data: data || {},
      // Tokens para enviar (máximo 500 por vez)
      tokens: tokens.slice(0, 500),
    };

    try {
      // Enviar notificação para múltiplos dispositivos
      const response = await admin.messaging()
        .sendEachForMulticast(message);

      logger.info(
        `✅ Notificações enviadas: ${response.successCount}/` +
        `${tokens.length}`
      );

      // Log de falhas se houver
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.error(`Falha ao enviar para token ${idx}:`, resp.error);
            failedTokens.push(tokens[idx]);
          }
        });
      }

      // Marcar como processada
      await snapshot.ref.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return response;
    } catch (error) {
      logger.error("❌ Erro ao enviar notificações:", error);

      // Marcar como processada com erro
      await snapshot.ref.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });

      return null;
    }
  }
);

/**
 * Função auxiliar para limpar tokens inválidos dos usuários
 * Pode ser chamada manualmente quando necessário
 */
export const cleanupInvalidTokens = onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Usuário deve estar autenticado"
    );
  }

  try {
    const tokensToRemove: string[] = request.data.invalidTokens || [];

    if (tokensToRemove.length === 0) {
      return {message: "Nenhum token para remover"};
    }

    // Buscar e atualizar usuários com tokens inválidos
    const usersRef = admin.firestore().collection("usuarios");
    const snapshot = await usersRef
      .where("fcmToken", "in", tokensToRemove)
      .get();

    const batch = admin.firestore().batch();
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {fcmToken: admin.firestore.FieldValue.delete()});
    });

    await batch.commit();

    logger.info(`${snapshot.size} tokens removidos com sucesso`);

    return {
      message: `${snapshot.size} tokens removidos com sucesso`,
      count: snapshot.size,
    };
  } catch (error) {
    logger.error("Erro ao limpar tokens:", error);
    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Erro desconhecido"
    );
  }
});

/**
 * Função para enviar notificação para um grupo específico
 * Útil para testes ou envios manuais
 */
export const sendGroupNotificationManual = onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Usuário deve estar autenticado"
    );
  }

  const {groupId, title, body, userId} = request.data;

  if (!groupId || !title || !body) {
    throw new HttpsError(
      "invalid-argument",
      "groupId, title e body são obrigatórios"
    );
  }

  try {
    // Buscar membros do grupo
    const groupDoc = await admin.firestore()
      .collection("grupos")
      .doc(groupId)
      .get();

    if (!groupDoc.exists) {
      throw new HttpsError("not-found", "Grupo não encontrado");
    }

    const groupData = groupDoc.data();
    if (!groupData) {
      throw new HttpsError("not-found", "Dados do grupo não encontrados");
    }

    interface GroupMember {
      userId: string;
      cargo: string;
      nome: string;
    }

    const members = groupData.membros || [];

    // Filtrar membros (excluir o autor se fornecido)
    const memberIds = members
      .filter((member: GroupMember) =>
        !userId || member.userId !== userId)
      .map((member: GroupMember) => member.userId);

    if (memberIds.length === 0) {
      return {message: "Nenhum membro para notificar"};
    }

    // Buscar tokens FCM
    const tokens: string[] = [];
    for (const memberId of memberIds) {
      const userDoc = await admin.firestore()
        .collection("usuarios")
        .doc(memberId)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (!userData) continue;

        const fcmToken = userData.fcmToken;
        const notificationsEnabled =
          userData.configuracoes?.notificacoes !== false;

        if (fcmToken && notificationsEnabled) {
          tokens.push(fcmToken);
        }
      }
    }

    if (tokens.length === 0) {
      return {message: "Nenhum token válido encontrado"};
    }

    // Criar documento de notificação pendente
    await admin.firestore()
      .collection("notificacoes_pendentes")
      .add({
        tokens,
        title,
        body,
        data: {
          type: "manual",
          groupId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processed: false,
      });

    logger.info(
      `Notificação manual agendada para ${tokens.length} ` +
      "destinatários"
    );

    return {
      message: "Notificação agendada com sucesso",
      recipientCount: tokens.length,
    };
  } catch (error) {
    logger.error("Erro ao enviar notificação manual:", error);
    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Erro desconhecido"
    );
  }
});

/**
 * Scheduled function para limpar notificações antigas
 * (executada diariamente)
 * Remove notificações processadas com mais de 7 dias
 */
export const cleanupOldNotifications = onSchedule(
  "every 24 hours",
  async () => {
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    try {
      const snapshot = await admin.firestore()
        .collection("notificacoes_pendentes")
        .where("processed", "==", true)
        .where("processedAt", "<", sevenDaysAgo)
        .limit(500)
        .get();

      if (snapshot.empty) {
        logger.info("Nenhuma notificação antiga para limpar");
        return;
      }

      const batch = admin.firestore().batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info(`✅ ${snapshot.size} notificações antigas removidas`);
    } catch (error) {
      logger.error("Erro ao limpar notificações antigas:", error);
    }
  });
