const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ChannelType
} = require('discord.js');
const { saveSettings } = require('../../ticket-settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Send the ticket panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the panel to')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('staff-role')
                .setDescription('Role that can see and manage tickets')
                .setRequired(false)
        )
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('Category where ticket channels will be created')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false)
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const staffRole = interaction.options.getRole('staff-role');
        const category = interaction.options.getChannel('category');

        saveSettings({
            staffRoleId: staffRole?.id || null,
            categoryId: category?.id || null,
        });

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🎫 Support Tickets')
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    'Need help? Click the button below to open a ticket and our team will assist you shortly.'
                )
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Open Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                )
            );

        await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
        await interaction.reply({ content: `✅ Ticket panel sent to ${channel}.`, ephemeral: true });
    }
};
