const {
    Client,
    GatewayIntentBits,
    Collection,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { token, roles } = require('./config.json');
const { findUserByEmail } = require('./database');

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

    if (interaction.isButton()) {
        if (interaction.customId !== 'verify_pro' && interaction.customId !== 'verify_lifetime') return;

        const tier = interaction.customId === 'verify_pro' ? 'pro' : 'lifetime';
        const tierLabel = tier === 'pro' ? 'Pro' : 'Lifetime';

        const modal = new ModalBuilder()
            .setCustomId(`verify_modal_${tier}`)
            .setTitle(`Verify ${tierLabel} Purchase`);

        const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('Email Address')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('your@email.com')
            .setRequired(true);

        const passwordInput = new TextInputBuilder()
            .setCustomId('password')
            .setLabel('Password')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(emailInput),
            new ActionRowBuilder().addComponents(passwordInput)
        );

        await interaction.showModal(modal);
        return;
    }

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

        const roleId = roles[tier];
        try {
            await interaction.member.roles.add(roleId);
            const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
            await interaction.editReply({ content: `✅ Verified! You have been given the **${tierLabel}** role.` });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Failed to assign role. Please contact an admin.' });
        }
    }
});

client.login(token);
