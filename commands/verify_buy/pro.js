const{
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,     
    PermissionFlagsBits,
    InteractionContextType,
    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    SeparatorSpacingSize,
    SeparatorBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-pro-panel')
        .setDescription('sending the pro verification panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option
            .setName('channel')
            .setDescription('In which channel should the message been send')
            .setRequired(true)
        ),

    async execute(interaction) {

		const channel = interaction.options.getChannel('channel');

    }

}