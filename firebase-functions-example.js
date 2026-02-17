// Firebase Cloud Function para enviar notificações push
// Este arquivo deve ser colocado em: functions/index.js (ou functions/src/index.ts se usar TypeScript)

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp();

/**
 * Cloud Function que monitora a coleção 'notificacoes_pendentes'
 * e envia notificações push para os usuários
 */
exports.sendNotifications = functions.firestore
  .document('notificacoes_pendentes/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const notificationId = context.params.notificationId;

    console.log(`Processando notificação ${notificationId}`);

    // Verificar se já foi processada
    if (notification.processed) {
      console.log('Notificação já foi processada');
      return null;
    }

    const { tokens, title, body, data } = notification;

    // Validar dados
    if (!tokens || tokens.length === 0) {
      console.error('Nenhum token fornecido');
      await snap.ref.update({ 
        processed: true, 
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: 'Nenhum token fornecido'
      });
      return null;
    }

    // Construir a mensagem
    const message = {
      notification: {
        title: title || 'Nova notificação',
        body: body || '',
      },
      data: data || {},
      // Tokens para enviar (máximo 500 por vez)
      tokens: tokens.slice(0, 500),
    };

    try {
      // Enviar notificação para múltiplos dispositivos
      const response = await admin.messaging().sendMulticast(message);

      console.log(`✅ Notificações enviadas com sucesso: ${response.successCount}/${tokens.length}`);
      
      // Log de falhas se houver
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Falha ao enviar para token ${idx}:`, resp.error);
            failedTokens.push(tokens[idx]);
          }
        });
      }

      // Marcar como processada
      await snap.ref.update({ 
        processed: true, 
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao enviar notificações:', error);
      
      // Marcar como processada com erro
      await snap.ref.update({ 
        processed: true, 
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: error.message 
      });
      
      return null;
    }
  });

/**
 * Função auxiliar para limpar tokens inválidos dos usuários
 * Pode ser chamada manualmente quando necessário
 */
exports.cleanupInvalidTokens = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário deve estar autenticado'
    );
  }

  try {
    const tokensToRemove = data.invalidTokens || [];
    
    if (tokensToRemove.length === 0) {
      return { message: 'Nenhum token para remover' };
    }

    // Buscar e atualizar usuários com tokens inválidos
    const usersRef = admin.firestore().collection('usuarios');
    const snapshot = await usersRef.where('fcmToken', 'in', tokensToRemove).get();

    const batch = admin.firestore().batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { fcmToken: admin.firestore.FieldValue.delete() });
    });

    await batch.commit();

    return { 
      message: `${snapshot.size} tokens removidos com sucesso`,
      count: snapshot.size 
    };
  } catch (error) {
    console.error('Erro ao limpar tokens:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Função para enviar notificação para um grupo específico
 * Útil para testes ou envios manuais
 */
exports.sendGroupNotificationManual = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário deve estar autenticado'
    );
  }

  const { groupId, title, body, userId } = data;

  if (!groupId || !title || !body) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'groupId, title e body são obrigatórios'
    );
  }

  try {
    // Buscar membros do grupo
    const groupDoc = await admin.firestore().collection('grupos').doc(groupId).get();
    
    if (!groupDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Grupo não encontrado');
    }

    const groupData = groupDoc.data();
    const members = groupData.membros || [];

    // Filtrar membros (excluir o autor se fornecido)
    const memberIds = members
      .filter(member => !userId || member.userId !== userId)
      .map(member => member.userId);

    if (memberIds.length === 0) {
      return { message: 'Nenhum membro para notificar' };
    }

    // Buscar tokens FCM
    const tokens = [];
    for (const memberId of memberIds) {
      const userDoc = await admin.firestore().collection('usuarios').doc(memberId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;
        const notificationsEnabled = userData.configuracoes?.notificacoes !== false;
        
        if (fcmToken && notificationsEnabled) {
          tokens.push(fcmToken);
        }
      }
    }

    if (tokens.length === 0) {
      return { message: 'Nenhum token válido encontrado' };
    }

    // Criar documento de notificação pendente
    await admin.firestore().collection('notificacoes_pendentes').add({
      tokens,
      title,
      body,
      data: {
        type: 'manual',
        groupId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
    });

    return { 
      message: 'Notificação agendada com sucesso',
      recipientCount: tokens.length 
    };
  } catch (error) {
    console.error('Erro ao enviar notificação manual:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Scheduled function para limpar notificações antigas (executada diariamente)
 * Remove notificações processadas com mais de 7 dias
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    try {
      const snapshot = await admin.firestore()
        .collection('notificacoes_pendentes')
        .where('processed', '==', true)
        .where('processedAt', '<', sevenDaysAgo)
        .limit(500)
        .get();

      if (snapshot.empty) {
        console.log('Nenhuma notificação antiga para limpar');
        return null;
      }

      const batch = admin.firestore().batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`✅ ${snapshot.size} notificações antigas removidas`);
      return null;
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      return null;
    }
  });
