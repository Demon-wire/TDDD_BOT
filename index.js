const {
    Client,
    GatewayIntentBits,
    Collection,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { token, roles } = require('./config.json');
const { findUserByEmail } = require('./database');
const { getSettings } = require('./ticket-settings');

const LOG_CHANNEL_ID = '1516531922707152947';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(commandsPath)) {
    const folderPath = path.join(commandsPath, folder);
    for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
        const command = require(path.join(folderPath, file));
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        }
    }
}

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const reply = { content: '❌ An error occurred.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
        return;
    }

    // ── Buttons ─────────────────────────────────────────────────────────────
    if (interaction.isButton()) {
        const { customId } = interaction;

        // Verify buttons
        if (customId === 'verify_pro' || customId === 'verify_lifetime') {
            const tier = customId === 'verify_pro' ? 'pro' : 'lifetime';
            const tierLabel = tier === 'pro' ? 'Pro' : 'Lifetime';

            const modal = new ModalBuilder()
                .setCustomId(`verify_modal_${tier}`)
                .setTitle(`Verify ${tierLabel} Purchase`);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('email')
                        .setLabel('Email Address')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('your@email.com')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('password')
                        .setLabel('Password')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal);
            return;
        }

        // Open ticket
        if (customId === 'create_ticket') {
            const settings = getSettings();

            const existing = interaction.guild.channels.cache.find(
                c => c.topic === `opener:${interaction.user.id}`
            );
            if (existing) {
                return interaction.reply({
                    content: `❌ You already have an open ticket: ${existing}`,
                    ephemeral: true
                });
            }

            const permissionOverwrites = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
                {
                    id: client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
                },
            ];

            if (settings.staffRoleId) {
                permissionOverwrites.push({
                    id: settings.staffRoleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
                });
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: settings.categoryId || null,
                topic: `opener:${interaction.user.id}`,
                permissionOverwrites,
            });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🎫 Ticket — ${interaction.user}`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        'Welcome! Please describe your issue and a staff member will be with you shortly.'
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('claim_ticket')
                            .setLabel('Claim')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('✋'),
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Close')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🔒')
                    )
                );

            await ticketChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
            await interaction.reply({ content: `✅ Your ticket has been created: ${ticketChannel}`, ephemeral: true });
            return;
        }

        // Claim ticket
        if (customId === 'claim_ticket') {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🎫 Ticket`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Welcome! Please describe your issue and a staff member will be with you shortly.\n\n✋ **Claimed by ${interaction.user}**`
                    )
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('claim_ticket')
                            .setLabel('Claimed')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('✋')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Close')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🔒')
                    )
                );

            await interaction.message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
            await interaction.reply({ content: `✅ You claimed this ticket.`, ephemeral: true });
            return;
        }

        // Close ticket
        if (customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Ticket wird in 5 Sekunden geschlossen...' });
            setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
            return;
        }
    }

    // ── Modal submits ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith('verify_modal_')) return;

        const tier = interaction.customId.replace('verify_modal_', '');
        const email = interaction.fields.getTextInputValue('email').trim().toLowerCase();
        const password = interaction.fields.getTextInputValue('password');

        await interaction.deferReply({ ephemeral: true });

        const user = findUserByEmail(email);

        if (!user) {
            return interaction.editReply({ content: '❌ No account found with that email.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return interaction.editReply({ content: '❌ Incorrect password.' });
        }

        if (user.tier !== tier) {
            const registeredLabel = user.tier.charAt(0).toUpperCase() + user.tier.slice(1);
            return interaction.editReply({
                content: `❌ This account is registered under **${registeredLabel}**, not **${tier.charAt(0).toUpperCase() + tier.slice(1)}**.`
            });
        }

        try {
            await interaction.member.roles.add(roles[tier]);
            const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
            await interaction.editReply({ content: `✅ Verified! You have been given the **${tierLabel}** role.` });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Failed to assign role. Please contact an admin.' });
        }
    }
});

client.login(token);
