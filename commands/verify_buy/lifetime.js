const {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorSpacingSize,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-lifetime-panel')
        .setDescription('Send the Lifetime verification panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the panel to')
                .setRequired(true)
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 👑 Lifetime Verification')
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    'Click the button below and enter your credentials to verify your **Lifetime** purchase and receive your role.'
                )
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify_lifetime')
                        .setLabel('Verify Lifetime')
                        .setStyle(ButtonStyle.Success)
                )
            );

        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        await interaction.reply({ content: `✅ Lifetime panel sent to ${channel}.`, ephemeral: true });
    }
};
