const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== 설정 =====
const REQUIRED_MINUTES = 30; // 필요한 시간
const ROLE_ID = process.env.ROLE_ID;

// 인정할 음성 채널 ID (2개 이상 가능)
const ALLOWED_VOICE_CHANNELS = [
  "1410529901618139217",
  "1462820517919850649"
];
// =================

const joinTimes = new Map();

// 음성 상태 변경 감지
client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member;
  if (!member) return;

  const oldChannel = oldState.channelId;
  const newChannel = newState.channelId;

  // 허용 채널 입장
  if (
    !oldChannel &&
    newChannel &&
    ALLOWED_VOICE_CHANNELS.includes(newChannel)
  ) {
    joinTimes.set(member.id, Date.now());
    return;
  }

  // 허용 채널 → 허용 채널 이동 (시간 유지)
  if (
    oldChannel &&
    newChannel &&
    ALLOWED_VOICE_CHANNELS.includes(oldChannel) &&
    ALLOWED_VOICE_CHANNELS.includes(newChannel)
  ) {
    return;
  }

  // 허용 채널에서 나감
  if (
    oldChannel &&
    ALLOWED_VOICE_CHANNELS.includes(oldChannel) &&
    (!newChannel || !ALLOWED_VOICE_CHANNELS.includes(newChannel))
  ) {
    joinTimes.delete(member.id);
  }
});

// 1분마다 체크
setInterval(async () => {
  const now = Date.now();

  for (const [userId, joinTime] of joinTimes.entries()) {
    const minutes = (now - joinTime) / 1000 / 60;

    if (minutes >= REQUIRED_MINUTES) {
      joinTimes.delete(userId);

      for (const guild of client.guilds.cache.values()) {
        try {
          const member = await guild.members.fetch(userId);
          if (!member.roles.cache.has(ROLE_ID)) {
            await member.roles.add(ROLE_ID);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}, 60 * 1000);

client.once("ready", () => {
  console.log(`✅ 봇 온라인: ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

