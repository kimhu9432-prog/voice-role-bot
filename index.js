const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

// 설정값
const REQUIRED_MINUTES = 30;
const ROLE_ID = process.env.ROLE_ID;

const joinTimes = new Map();

client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member;

  // 음성채널 입장
  if (!oldState.channelId && newState.channelId) {
    joinTimes.set(member.id, Date.now());
  }

  // 음성채널 퇴장
  if (oldState.channelId && !newState.channelId) {
    joinTimes.delete(member.id);
  }
});

setInterval(async () => {
  const now = Date.now();

  for (const [userId, joinTime] of joinTimes.entries()) {
    const elapsed = (now - joinTime) / 1000 / 60;

    if (elapsed >= REQUIRED_MINUTES) {
      joinTimes.delete(userId);

      for (const guild of client.guilds.cache.values()) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        if (!member.roles.cache.has(ROLE_ID)) {
          await member.roles.add(ROLE_ID).catch(console.error);
        }
      }
    }
  }
}, 60 * 1000);

client.login(process.env.DISCORD_TOKEN);
