const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const bcrypt = require('bcryptjs');
const { addUser } = require('../../database');

const LOG_CHANNEL_ID = '1516531922707152947';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-user')
        .setDescription('Add a user to the verification database')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('email')
                .setDescription('User email address')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('password')
                .setDescription('User password')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('tier')
                .setDescription('Access tier')
                .setRequired(true)
                .addChoices(
                    { name: 'Pro', value: 'pro' },
                    { name: 'Lifetime', value: 'lifetime' }
                )
        ),

    async execute(interaction) {
        const email = interaction.options.getString('email');
        const password = interaction.options.getString('password');
        const tier = interaction.options.getString('tier');

        await interaction.deferReply({ ephemeral: true });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            addUser(email, hashedPassword, tier);

            try {
                const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
                await logChannel.send(`📋 New **${tier}** user added: \`${email}\``);
            } catch (logError) {
                console.error('Failed to send log message:', logError);
            }

            await interaction.editReply({
                content: `✅ User **${email}** added with **${tier}** tier.`
            });
        } catch (error) {
            await interaction.editReply({ content: `❌ ${error.message}` });
        }
    }
};
