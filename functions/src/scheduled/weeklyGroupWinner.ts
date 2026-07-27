import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface AppUsage {
  packageName: string;
  timeInMinutes: number;
}

/**
 * Retorna os últimos N dias como strings YYYY-MM-DD (horário UTC).
 * @param {number} n - Quantidade de dias para trás.
 * @return {string[]} Array de datas no formato YYYY-MM-DD.
 */
function lastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

/**
 * Soma o tempo de tela de um usuário para um conjunto de datas.
 * Quando filterByApps=true, soma apenas os apps em selectedApps.
 * @param {admin.firestore.Firestore} db - Instância do Firestore.
 * @param {string} userId - ID do usuário.
 * @param {string[]} dates - Datas no formato YYYY-MM-DD.
 * @param {string[]} selectedApps - Package names dos apps filtrados.
 * @param {boolean} filterByApps - Se true, filtra pelo selectedApps.
 * @return {Promise<number>} Total de minutos de tela no período.
 */
async function getMemberScreenTime(
  db: admin.firestore.Firestore,
  userId: string,
  dates: string[],
  selectedApps: string[],
  filterByApps: boolean,
): Promise<number> {
  const snap = await db
    .collection("estatisticas")
    .where("userId", "==", userId)
    .where("data", "in", dates)
    .get();

  let total = 0;
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (filterByApps) {
      const appList: AppUsage[] = data.all_apps ?? data.top_apps ?? [];
      total += appList
        .filter((a) => selectedApps.includes(a.packageName))
        .reduce((sum, a) => sum + (a.timeInMinutes ?? 0), 0);
    } else {
      total += (data.tempo_total_minutos as number) ?? 0;
    }
  });

  return total;
}

/**
 * Formata minutos para exibição humana, ex: "2h 30min" ou "45min".
 * @param {number} minutes - Valor em minutos.
 * @return {string} String formatada.
 */
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

/**
 * Cron Job semanal (domingo, 20h BRT).
 *
 * Para cada grupo ativo, calcula quem teve o menor tempo de tela
 * nos últimos 7 dias e envia uma notificação push para todos os membros.
 *
 * O critério segue a mesma lógica do ranking semanal exibido no app:
 * - Grupos "screenTime": usa tempo_total_minutos da coleção `estatisticas`
 * - Grupos "screenTimeForApps": soma apenas os apps selecionados pelo grupo
 * - Grupos "checkin": usa tempo_total_minutos (sem filtro de apps)
 */
export const weeklyGroupWinner = onSchedule(
  {
    schedule: "0 20 * * 0",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async () => {
    const db = admin.firestore();
    const dates = lastNDays(7);

    const groupsSnap = await db.collection("grupos").get();
    logger.info(`weeklyGroupWinner: processando ${groupsSnap.size} grupos`);

    for (const groupDoc of groupsSnap.docs) {
      const groupId = groupDoc.id;
      try {
        const group = groupDoc.data();
        const membrosIds: string[] = (group.membrosIds as string[]) ?? [];
        const groupType: string = (group.groupType as string) ?? "screenTime";
        const selectedApps: string[] = (group.selectedApps as string[]) ?? [];
        const filterByApps =
          groupType === "screenTimeForApps" && selectedApps.length > 0;

        if (membrosIds.length < 2) continue;

        // --- Calcular tempo semanal de cada membro ---
        const memberTimes: {userId: string; time: number}[] = [];
        for (const userId of membrosIds) {
          const time = await getMemberScreenTime(
            db, userId, dates, selectedApps, filterByApps,
          );
          memberTimes.push({userId, time});
        }

        const withData = memberTimes.filter((m) => m.time > 0);
        if (withData.length === 0) {
          logger.info(`Grupo ${groupId}: sem dados de tela esta semana`);
          continue;
        }

        // Vencedor = menor tempo de tela
        const winner = withData.reduce((best, m) =>
          m.time < best.time ? m : best,
        );

        // --- Nome do vencedor ---
        const winnerDoc = await db.doc(`usuarios/${winner.userId}`).get();
        const winnerData = winnerDoc.data() ?? {};
        const winnerName: string =
          (winnerData.displayName as string) ??
          (winnerData.nome as string) ??
          "um membro";

        // --- Coletar tokens FCM (sem duplicatas) ---
        const tokenSet = new Set<string>();
        for (const userId of membrosIds) {
          const userDoc = await db.doc(`usuarios/${userId}`).get();
          if (!userDoc.exists) continue;
          const userData = userDoc.data() ?? {};
          const token = userData.fcmToken as string | undefined;
          const notificationsEnabled =
            userData.configuracoes?.notificacoes !== false;
          if (token && notificationsEnabled) tokenSet.add(token);
        }

        const tokens = [...tokenSet].slice(0, 500); // FCM limit
        if (tokens.length === 0) {
          logger.info(`Grupo ${groupId}: nenhum token FCM disponível`);
          continue;
        }

        // --- Enviar notificação ---
        const timeStr = formatTime(winner.time);
        const groupName = group.nome as string;
        const title = `🏅 Resultado da semana — ${groupName}`;
        const body = `🏆 ${winnerName} venceu com apenas ${timeStr} de tela!`;

        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {title, body},
          data: {
            type: "weekly_winner",
            groupId,
            winnerId: winner.userId,
          },
          android: {
            priority: "high",
            notification: {channelId: "weekly_winner"},
          },
        });

        logger.info(
          `Grupo ${groupId}: vencedor="${winnerName}" (${timeStr}), ` +
          `enviado para ${response.successCount}/${tokens.length} membros`,
        );

        if (response.failureCount > 0) {
          logger.warn(
            `Grupo ${groupId}: ${response.failureCount} falha(s) de envio`,
          );
        }
      } catch (err) {
        logger.error(`Erro ao processar grupo ${groupId}:`, err);
      }
    }

    logger.info("weeklyGroupWinner: concluído");
  },
);
