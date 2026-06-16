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
        .setName('verify-pro-panel')
        .setDescription('Send the Pro verification panel')
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
                new TextDisplayBuilder().setContent('## ✅ Pro Verification')
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    'Click the button below and enter your credentials to verify your **Pro** purchase and receive your role.'
                )
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify_pro')
                        .setLabel('Verify Pro')
                        .setStyle(ButtonStyle.Primary)
                )
            );

        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        await interaction.reply({ content: `✅ Pro panel sent to ${channel}.`, ephemeral: true });
    }
};
